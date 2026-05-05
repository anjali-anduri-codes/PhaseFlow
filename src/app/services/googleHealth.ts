const STORAGE_KEYS = {
  dataSource: 'PhaseFlow.dataSource',
  googleAuthenticated: 'PhaseFlow.google.authenticated',
  googleConsentGranted: 'PhaseFlow.google.consentGranted',
  googleAccessToken: 'PhaseFlow.google.accessToken',
  googleTokenExpiresAt: 'PhaseFlow.google.tokenExpiresAt',
  googleHasCycleData: 'PhaseFlow.google.hasCycleData',
  googleNeedsManualCycleSetup: 'PhaseFlow.google.needsManualCycleSetup',
  cycleSetupCompleted: 'PhaseFlow.cycleSetupCompleted'
} as const;

type DataSource = 'manual' | 'google' | null;

interface OAuthResult {
  success: boolean;
  mode: 'live';
  error?: string;
  code?: string;
  state?: string;
}

interface SyncResult {
  success: boolean;
  hasCycleData: boolean;
  error?: string;
}

function safeGetStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write errors in restricted environments.
  }
}

function boolFromStorage(key: string, fallback = false): boolean {
  const value = safeGetStorage(key);
  if (value == null) {
    return fallback;
  }
  return value === 'true';
}

function getAccessToken(): string | null {
  const token = safeGetStorage(STORAGE_KEYS.googleAccessToken);
  if (!token) return null;

  // Check if token has expired
  const expiresAtStr = safeGetStorage(STORAGE_KEYS.googleTokenExpiresAt);
  if (expiresAtStr) {
    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) {
      // Token expired; clear it
      safeSetStorage(STORAGE_KEYS.googleAccessToken, '');
      safeSetStorage(STORAGE_KEYS.googleTokenExpiresAt, '');
      return null;
    }
  }

  return token;
}

function saveAccessToken(token: string, expiresIn: number): void {
  safeSetStorage(STORAGE_KEYS.googleAccessToken, token);
  const expiresAt = Date.now() + expiresIn * 1000;
  safeSetStorage(STORAGE_KEYS.googleTokenExpiresAt, String(expiresAt));
}

function generateState(length = 24): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);

  let state = '';
  for (let i = 0; i < length; i++) {
    state += chars[values[i] % chars.length];
  }
  return state;
}

function getGoogleOAuthConfig() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const redirectUri =
    (import.meta.env.VITE_GOOGLE_REDIRECT_URI as string | undefined) ||
    `${window.location.origin}/oauth/google/callback`;

  return {
    clientId,
    redirectUri
  };
}

function buildGoogleOAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.reproductive_health.read'
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function launchOAuthPopup(url: string, redirectUri: string, expectedState: string): Promise<OAuthResult> {
  const popup = window.open(url, 'PhaseFlow-google-oauth', 'width=520,height=720');

  if (!popup) {
    return {
      success: false,
      mode: 'live',
      error: 'Popup was blocked. Please allow popups and try again.'
    };
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.clearInterval(poller);
      popup.close();
      resolve({
        success: false,
        mode: 'live',
        error: 'Google sign-in timed out. Please try again.'
      });
    }, 120000);

    const poller = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(poller);
        window.clearTimeout(timeout);
        resolve({
          success: false,
          mode: 'live',
          error: 'Sign-in was canceled before completion.'
        });
        return;
      }

      try {
        const popupUrl = popup.location.href;
        if (!popupUrl.startsWith(redirectUri)) {
          return;
        }

        const callbackUrl = new URL(popupUrl);
        const code = callbackUrl.searchParams.get('code');
        const state = callbackUrl.searchParams.get('state');
        const error = callbackUrl.searchParams.get('error');

        window.clearInterval(poller);
        window.clearTimeout(timeout);
        popup.close();

        if (error) {
          resolve({
            success: false,
            mode: 'live',
            error: `Google sign-in failed: ${error}`
          });
          return;
        }

        if (!code || !state || state !== expectedState) {
          resolve({
            success: false,
            mode: 'live',
            error: 'Sign-in validation failed. Please try again.'
          });
          return;
        }

        resolve({
          success: true,
          mode: 'live',
          code,
          state
        });
      } catch {
        // Cross-origin during OAuth; keep polling until redirected back to the app origin.
      }
    }, 500);
  });
}

async function exchangeCodeForToken(code: string, state: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Determine backend URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined || 
                   (typeof window !== 'undefined' ? window.location.origin : '');

    const response = await fetch(`${baseUrl}/api/google/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      return {
        success: false,
        error: errorData.error || 'Token exchange failed'
      };
    }

    const tokenData = await response.json() as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!tokenData.access_token) {
      return {
        success: false,
        error: 'No access token in response'
      };
    }

    const expiresIn = tokenData.expires_in || 3600; // Default 1 hour
    saveAccessToken(tokenData.access_token, expiresIn);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Token exchange failed'
    };
  }
}

export function setSelectedDataSource(dataSource: DataSource): void {
  if (!dataSource) {
    return;
  }
  safeSetStorage(STORAGE_KEYS.dataSource, dataSource);
}

export function getSelectedDataSource(): DataSource {
  const value = safeGetStorage(STORAGE_KEYS.dataSource);
  if (value === 'manual' || value === 'google') {
    return value;
  }
  return null;
}

export function getGoogleAuthState(): boolean {
  return boolFromStorage(STORAGE_KEYS.googleAuthenticated, false);
}

export function getGoogleConsentState(): boolean {
  return boolFromStorage(STORAGE_KEYS.googleConsentGranted, false);
}

export function getGoogleNeedsManualCycleSetup(): boolean {
  return boolFromStorage(STORAGE_KEYS.googleNeedsManualCycleSetup, false);
}

export function clearGoogleNeedsManualCycleSetup(): void {
  safeSetStorage(STORAGE_KEYS.googleNeedsManualCycleSetup, 'false');
  safeSetStorage(STORAGE_KEYS.cycleSetupCompleted, 'true');
}

export async function authenticateWithGoogle(): Promise<OAuthResult> {
  const config = getGoogleOAuthConfig();

  if (!config.clientId) {
    return {
      success: false,
      mode: 'live',
      error: 'VITE_GOOGLE_CLIENT_ID is not configured.'
    };
  }

  const state = generateState();
  const authUrl = buildGoogleOAuthUrl(config.clientId, config.redirectUri, state);
  const result = await launchOAuthPopup(authUrl, config.redirectUri, state);

  if (result.success && result.code && result.state) {
    // Exchange code for token
    const exchangeResult = await exchangeCodeForToken(result.code, result.state);
    if (exchangeResult.success) {
      safeSetStorage(STORAGE_KEYS.googleAuthenticated, 'true');
      return result;
    } else {
      return {
        success: false,
        mode: 'live',
        error: exchangeResult.error || 'Failed to exchange authorization code'
      };
    }
  }

  return result;
}

export function saveGoogleFitConsent(granted: boolean): void {
  safeSetStorage(STORAGE_KEYS.googleConsentGranted, String(granted));
}

export async function syncGoogleFitCycleData(): Promise<SyncResult> {
  const isAuthenticated = getGoogleAuthState();
  const hasConsent = getGoogleConsentState();

  if (!isAuthenticated || !hasConsent) {
    return {
      success: false,
      hasCycleData: false,
      error: 'Google account and consent are required before syncing.'
    };
  }

  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        hasCycleData: false,
        error: 'No Google access token found. Please re-authenticate.'
      };
    }

    // Live mode: Call backend endpoint to fetch cycle data
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined || 
                   (typeof window !== 'undefined' ? window.location.origin : '');
    
    const response = await fetch(`${baseUrl}/api/google/fit-cycle-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401) {
      // Token expired or invalid; user needs to re-authenticate
      safeSetStorage(STORAGE_KEYS.googleAccessToken, '');
      safeSetStorage(STORAGE_KEYS.googleTokenExpiresAt, '');
      return {
        success: false,
        hasCycleData: false,
        error: 'Google session expired. Please re-authenticate.'
      };
    }

    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      return {
        success: false,
        hasCycleData: false,
        error: errorData.error || 'Failed to sync cycle data'
      };
    }

    const data = await response.json() as { hasCycleData?: boolean };
    const hasCycleData = data.hasCycleData || false;

    safeSetStorage(STORAGE_KEYS.googleHasCycleData, String(hasCycleData));
    safeSetStorage(STORAGE_KEYS.googleNeedsManualCycleSetup, String(!hasCycleData));

    return {
      success: true,
      hasCycleData
    };
  } catch (error) {
    return {
      success: false,
      hasCycleData: false,
      error: error instanceof Error ? error.message : 'Failed to sync cycle data'
    };
  }
}
