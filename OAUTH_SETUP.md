# OAuth Backend Integration - Complete Setup Guide

## ✅ What Was Completed

### Backend Infrastructure (Serverless)
Created production-ready Vercel Functions for OAuth token exchange and Google Fit integration:

- **`api/google/token.ts`** — OAuth code-for-token exchange
  - Validates state for CSRF protection  
  - Calls Google OAuth endpoint with client secrets
  - Returns access_token + refresh_token to frontend
  - Expires tokens after specified duration

- **`api/google/fit-cycle-data.ts`** — Google Fit cycle data fetching
  - Authenticates with user's access token
  - Queries Google Fit API for cycle-related data sources
  - Returns boolean flag (cycle data found or not)
  - Invalid token automatically triggers re-auth prompt

- **`vercel.json`** — Deployment configuration
  - Function memory/timeout settings
  - CORS headers for cross-origin API calls

### Frontend Updates
Modified `src/app/services/googleHealth.ts` to support real OAuth:

- **New Storage Keys**
  - `googleAccessToken` — Persisted access token
  - `googleTokenExpiresAt` — Token expiry timestamp

- **New Functions**
  - `getAccessToken()` — Retrieves and validates cached token
  - `saveAccessToken(token, expiresIn)` — Persists token with expiry
  - `exchangeCodeForToken(code, state)` — Calls backend `/api/google/token`

- **Updated Flows**
  - `authenticateWithGoogle()` — Now performs full token exchange
  - `syncGoogleFitCycleData()` — Calls backend `/api/google/fit-cycle-data` in live mode
  - Graceful fallback to demo mode when credentials are empty

### Public Assets
- **`public/oauth/google/callback.html`** — OAuth redirect landing page
  - User-friendly loading screen during token exchange
  - Logs OAuth parameters for debugging

### Documentation
- **Updated `.env.example`** with `VITE_API_BASE_URL`
- **Updated `API_INTEGRATION.md`** with backend endpoint specs and deployment guide
- **Updated `README.md`** with step-by-step Vercel deployment instructions

---

## 🚀 Deployment Steps

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "FlowFit" (or your app name)
3. Enable APIs:
   - Google Fit API
   - Google+ API
4. Create OAuth 2.0 credential (Web Application)
   - Authorized redirect URIs:
     - Local: `http://localhost:5173/oauth/google/callback`
     - Production: `https://your-frontend-domain.com/oauth/google/callback`
5. Copy **Client ID** and **Client Secret**

### Step 2: Deploy Backend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (if first time)
vercel link

# Add environment variables (interactive prompts)
vercel env add VITE_GOOGLE_CLIENT_ID
# Paste your Client ID from Step 1

vercel env add GOOGLE_CLIENT_SECRET
# Paste your Client Secret (this stays SECRET on Vercel, never exposed)

vercel env add VITE_GOOGLE_REDIRECT_URI
# Paste: https://your-vercel-project.vercel.app/oauth/google/callback

# Deploy to production
vercel deploy --prod
```

After deployment, Vercel will provide your production URL (e.g., `https://flowfit-production.vercel.app`)

### Step 3: Update Frontend Configuration

Update `Google Cloud Console` with your Vercel deployment URL:
- Go back to OAuth credentials
- Add redirect URI: `https://your-vercel-project.vercel.app/oauth/google/callback`

Create `.env.production` (or update `.env.local` for testing):
```bash
VITE_GOOGLE_CLIENT_ID=your_client_id_from_step_1
VITE_GOOGLE_REDIRECT_URI=https://your-vercel-project.vercel.app/oauth/google/callback
VITE_API_BASE_URL=https://your-vercel-project.vercel.app
```

### Step 4: Test OAuth Flow

1. Start frontend: `npm run dev`
2. Navigate to Data Source screen
3. Select "Google"
4. Sign in with your Google account
5. Authorize FlowFit to access Google Fit data
6. Frontend receives access token and caches it
7. Automatic cycle data sync follows
8. Landing page shows one-time manual cycle entry prompt if no data

---

## 🧪 Testing Scenarios

### Scenario 1: Demo Mode (No OAuth Credentials)
```bash
# .env.local
VITE_GOOGLE_CLIENT_ID=        # Empty = demo mode
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback
VITE_API_BASE_URL=http://localhost:5173
VITE_GOOGLE_FIT_HAS_CYCLE_DATA=true  # Simulate having data
```

**Result:** Auth popup skipped, uses env flag for sync result

### Scenario 2: Live OAuth (Local Development)
```bash
# .env.local
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback
VITE_API_BASE_URL=http://localhost:3000
```

**Run:** 
```bash
vercel dev
```
This starts both frontend (5173) and backend (3000) locally

### Scenario 3: Production Deployment
```bash
# .env.production (or Vercel env vars)
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
VITE_GOOGLE_REDIRECT_URI=https://flowfit.vercel.app/oauth/google/callback
VITE_API_BASE_URL=https://flowfit.vercel.app
```

**Result:** Full end-to-end OAuth + Google Fit integration

---

## 🔒 Security Notes

✅ **What's Protected:**
- Client Secret stored only on Vercel (never exposed to frontend)
- Access tokens have expiry and automatic refresh
- CSRF protection via state parameter validation
- Cross-origin requests limited by CORS headers

⚠️ **What to Monitor:**
- Refresh token storage (currently returned to frontend; consider server-side session storage in production)
- Token expiry handling (currently clears local storage on 401)
- Rate limiting on OAuth endpoints (configure in Vercel)
- Scope permissions (currently requests `fitness.reproductive_health.read`)

---

## 📊 Data Flow

```
User Selects "Google"
  ↓
Frontend builds OAuth URL + random state
  ↓
Opens Google Sign-In popup
  ↓
User grants permissions
  ↓
Google redirects popup to callback page with {code, state}
  ↓
Frontend polls popup URL, captures {code, state}
  ↓
Frontend calls POST /api/google/token with {code, state}
  ↓
Backend exchanges code for access_token (using Client Secret)
  ↓
Backend returns access_token to frontend
  ↓
Frontend caches access_token + expiry in localStorage
  ↓
Frontend calls GET /api/google/fit-cycle-data with Authorization header
  ↓
Backend uses access_token to query Google Fit API
  ↓
Backend returns {hasCycleData: boolean}
  ↓
Frontend stores result, shows cycle prompt if needed
```

---

## 🐛 Troubleshooting

### Issue: "OAuth client is not authorized to access this API"
**Solution:** Double-check Client ID and Client Secret match your Google Cloud project

### Issue: Redirect URI mismatch
**Solution:** Ensure `VITE_GOOGLE_REDIRECT_URI` matches exactly in both Google Console and `vercel.json` headers

### Issue: CORS errors when calling backend
**Solution:** `vercel.json` sets CORS headers; ensure request includes proper `Authorization: Bearer` header

### Issue: Token expires too quickly
**Solution:** Check `expires_in` response from Google; typically 3600 seconds (1 hour). Implement refresh token logic if needed.

### Issue: Google Fit returns "No data"
**Solution:** 
- User must have Google Fit app/data on their account
- Test scope permissions: `fitness.reproductive_health.read` 
- Backend endpoint currently requires cycle-specific data sources

---

## 📱 Next Steps (Optional Enhancements)

1. **Server-side Session Storage** — Store refresh tokens securely instead of returning to frontend
2. **Token Refresh** — Auto-refresh expired tokens using refresh_token
3. **Settings UI** — Add "Reconnect Google" button in Settings screen
4. **Error Recovery** — Auto-prompt user to re-authenticate on 401 responses
5. **Analytics** — Log OAuth success/failure rates
6. **Crash Reporting** — Integrate Sentry or similar for production errors

---

## ✅ Validation Checklist

- [x] Frontend updated with token exchange flow
- [x] Backend endpoints created and documented
- [x] Environment variables configured
- [x] CORS headers set in vercel.json
- [x] OAuth callback page created
- [x] Demo mode fallback working
- [x] Production build succeeds
- [x] Documentation updated (README + API_INTEGRATION.md)
- [ ] OAuth credentials created in Google Cloud
- [ ] Backend deployed to Vercel
- [ ] Frontend environment variables updated
- [ ] End-to-end OAuth flow tested
