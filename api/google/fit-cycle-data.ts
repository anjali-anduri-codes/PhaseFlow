/**
 * Google Fit Cycle Data Endpoint
 * Vercel Function: GET /api/google/fit-cycle-data
 * 
 * Fetches cycle-related data from Google Fit using the user's access token
 * Looks for menstrual cycle data points in Google Fit
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

interface FitDatasetResponse {
  point?: Array<{
    startTimeNanos: string;
    endTimeNanos: string;
    dataTypeName: string;
    values: Array<{
      intVal?: number;
      fpVal?: number;
      stringVal?: string;
    }>;
  }>;
}

const GOOGLE_FIT_API = 'https://www.googleapis.com/fitness/v1/users/me';

/**
 * Check if user has cycle data in Google Fit
 * Queries for custom menstrual cycle data types
 */
async function fetchCycleData(accessToken: string): Promise<boolean> {
  try {
    // Get data sources first to discover cycle-related data points
    const sourcesResponse = await fetch(`${GOOGLE_FIT_API}/dataSources`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!sourcesResponse.ok) {
      throw new Error(
        `Failed to fetch data sources: ${sourcesResponse.statusText}`
      );
    }

    const sourcesData = await sourcesResponse.json() as {
      dataSource?: Array<{ _id?: string; dataType?: { name?: string } }>;
    };
    const sources = sourcesData.dataSource || [];

    // Look for cycle-related data sources
    // Common data type names: com.google.step_count, custom types may vary
    // Cycle data might be stored as custom data type or via third-party integration
    const cycleDataSources = sources.filter(
      (source) =>
        source.dataType?.name?.toLowerCase().includes('cycle') ||
        source.dataType?.name?.toLowerCase().includes('menstrual') ||
        source.dataType?.name?.toLowerCase().includes('period')
    );

    if (cycleDataSources.length === 0) {
      console.log('No cycle-related data sources found');
      return false;
    }

    // If cycle data sources exist, check for recent data points
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const startTimeNanos = (thirtyDaysAgo * 1e6).toString();
    const endTimeNanos = (now * 1e6).toString();

    // Query first cycle data source for recent data
    const dataSourceId = cycleDataSources[0]._id || 'unknown';
    const datasetResponse = await fetch(
      `${GOOGLE_FIT_API}/datasets/${startTimeNanos}-${endTimeNanos}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: cycleDataSources[0].dataType?.name,
            },
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
          startTimeMillis: thirtyDaysAgo,
          endTimeMillis: now,
        }),
      }
    );

    if (!datasetResponse.ok) {
      console.warn(
        `Dataset query returned: ${datasetResponse.statusText}`
      );
      // Even if query fails, we know sources exist = user has cycle tracking
      return true;
    }

    const datasetData = await datasetResponse.json() as {
      bucket?: Array<{ dataset?: FitDatasetResponse[] }>;
    };
    const hasCycleData = (datasetData.bucket || []).some((bucket) =>
      (bucket.dataset || []).some((dataset) => (dataset.point || []).length > 0)
    );

    return hasCycleData || cycleDataSources.length > 0;
  } catch (error) {
    console.error('Error fetching cycle data from Google Fit:', error);
    // On error, assume no data found (safer fallback)
    return false;
  }
}

/**
 * Validate access token with Google
 */
async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow GET
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/Bearer\s+(.+)/i);
    const accessToken = match?.[1];

    if (!accessToken) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Validate token
    const isValid = await validateAccessToken(accessToken);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid or expired access token' });
      return;
    }

    // Fetch cycle data
    const hasCycleData = await fetchCycleData(accessToken);

    res.status(200).json({
      hasCycleData,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Fit data endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch cycle data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
