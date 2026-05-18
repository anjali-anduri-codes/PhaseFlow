import { VercelRequest, VercelResponse } from '@vercel/node';

interface SyncStatePayload {
  deviceId?: string;
  source?: 'google' | 'manual' | string;
  googleAuthenticated?: boolean;
  googleConsentGranted?: boolean;
  hasCycleData?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    res.status(500).json({
      error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured'
    });
    return;
  }

  const body = (req.body || {}) as SyncStatePayload;
  const deviceId = body.deviceId?.trim();

  if (!deviceId) {
    res.status(400).json({ error: 'deviceId is required' });
    return;
  }

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/google_sync_state?on_conflict=device_id`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify([
          {
            device_id: deviceId,
            source: body.source || 'google',
            google_authenticated: Boolean(body.googleAuthenticated),
            google_consent_granted: Boolean(body.googleConsentGranted),
            has_cycle_data: Boolean(body.hasCycleData),
            synced_at: new Date().toISOString()
          }
        ])
      }
    );

    if (!response.ok) {
      const raw = await response.text();
      res.status(response.status).json({
        error: 'Failed to persist sync state',
        message: raw
      });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'Unexpected DB sync error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
