
  # Create Requested Design

  This is a code bundle for Create Requested Design. The original project is available at https://www.figma.com/design/qPKKCai3UKVy6dRT6dg14g/Create-Requested-Design.

  ## Running the code

  ### Frontend Setup

  ```bash
  npm install
  cp .env.example .env.local
  npm run dev
  ```

  The frontend starts at `http://localhost:5173` in demo mode.

  ### Backend Setup (Production OAuth)

  To enable real Google OAuth token exchange:

  **1. Create OAuth Credentials**
  - Go to [Google Cloud Console](https://console.cloud.google.com/)
  - Create OAuth 2.0 credentials (type: Web App)
  - Add authorized redirect URI: `http://localhost:5173/oauth/google/callback` (local) or your production domain
  - Copy Client ID and Client Secret

  **2. Deploy Backend to Vercel**

  ```bash
  npm install -g vercel
  vercel login
  vercel link         # Link this project to Vercel
  vercel env add VITE_GOOGLE_CLIENT_ID
  vercel env add GOOGLE_CLIENT_SECRET
  vercel env add VITE_GOOGLE_REDIRECT_URI
  vercel env add GEMMA_API_KEY
  vercel env add GEMMA_MODEL
  vercel deploy --prod
  ```

  **3. Update `.env.production`**

  ```
  VITE_API_BASE_URL=https://your-vercel-deployment.vercel.app
  ```

  **4. Test Authorization Flow**
  - On Data Source screen, select "Google"
  - You'll be prompted to sign in with Google
  - Token exchange happens automatically in the background
  - Cycle data sync follows on the next screen

    ## 5) Google Fit / Google Auth (Production Checklist)

    1. In Google Cloud Console, enable APIs:
      - Google Fitness API
      - OAuth consent screen configuration
    2. OAuth Web App redirect URIs must include:
      - `http://localhost:5173/oauth/google/callback`
      - `https://<your-vercel-domain>/oauth/google/callback`
    3. In Vercel env vars, set:
      - `VITE_GOOGLE_CLIENT_ID`
      - `GOOGLE_CLIENT_SECRET`
      - `VITE_GOOGLE_REDIRECT_URI`
    4. Frontend env must point to deployed backend:
      - `VITE_API_BASE_URL=https://<your-vercel-domain>`

    ## 6) Connect Data to Backend DB

    The app now persists Google sync metadata via backend endpoint:

    - `POST /api/google/sync-state`

    This endpoint upserts records into Supabase table `google_sync_state`.

    1. Create the table using [DB_SETUP.md](DB_SETUP.md).
    2. Add Vercel env vars:
      - `SUPABASE_URL`
      - `SUPABASE_SERVICE_ROLE_KEY`
    3. Deploy. Each successful Google Fit sync now writes:
      - `device_id`
      - `google_authenticated`
      - `google_consent_granted`
      - `has_cycle_data`
      - `synced_at`

    ## 7) Where and How to Host (Vercel)

    1. Keep frontend + API functions in this same repo (already configured for Vercel).
    2. Push repo to GitHub.
    3. In Vercel:
      - Create New Project -> Import this repo
      - Add all env vars (Google, Gemma, Supabase)
      - Deploy to Production
    4. In Google Cloud Console, update OAuth redirect URI to your final Vercel domain.
    5. Validate production flow:
      - Google login works
      - `/api/google/fit-cycle-data` returns success
      - `/api/google/sync-state` writes rows in Supabase

  For detailed API integration guide, see [API_INTEGRATION.md](API_INTEGRATION.md).
  
  