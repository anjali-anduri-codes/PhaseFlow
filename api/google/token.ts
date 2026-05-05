/**
 * OAuth Token Exchange Endpoint
 * Vercel Function: POST /api/google/token
 * 
 * Exchanges OAuth authorization code for access token and refresh token
 * Supports both localhost development and production deployments
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

interface TokenExchangePayload {
  code: string;
  state: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/**
 * Verify OAuth state for CSRF protection
 */
function verifyState(state: string, sessionState: string): boolean {
  return state === sessionState && state.length > 0;
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.statusText} - ${error}`);
  }

  const data = await response.json() as GoogleTokenResponse;
  return data;
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Validate environment variables
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.VITE_GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing OAuth environment variables', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUri: !!redirectUri,
      });
      res.status(500).json({
        error: 'Server misconfigured: missing OAuth credentials',
      });
      return;
    }

    // Parse request body
    const { code, state } = req.body as TokenExchangePayload;

    if (!code) {
      res.status(400).json({ error: 'Authorization code required' });
      return;
    }

    // Optional: Verify CSRF state if provided
    // In production, verify state against server-side session
    // For this demo, state validation is client-side; consider adding server session storage
    if (state && state.length < 16) {
      res.status(400).json({ error: 'Invalid state parameter (CSRF validation)' });
      return;
    }

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(
      code,
      clientId,
      clientSecret,
      redirectUri
    );

    // Return token to frontend
    // Frontend will store access_token in localStorage/state
    // Refresh token is sensitive; consider storing server-side with secure httpOnly cookie
    res.status(200).json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      success: true,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({
      error: 'Token exchange failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
