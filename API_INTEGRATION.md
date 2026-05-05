# PhaseFlow API Integration Guide

This document describes the API integrations required for PhaseFlow's cycle-synced fitness app.

## 1. Health App Integration (Data Source Screen)

**Providers:** Apple Health (HealthKit), Google Health (Health Connect / Google Fit)

**Flow:**
1. User selects Apple Health or Google Health from the Data Source screen
2. Request OS-level health permissions for cycle and activity metrics
3. Read authorized cycle data into local app state
4. Store sync status using secure local storage

**Security:** Uses platform permission prompts; no health account passwords are stored

---

## 2. Workout Recommendation (Home Screen)

**Service:** `getWorkoutRecommendation()` in `src/app/services/gemma.ts`

**Parameters:**
```typescript
{
  phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal',
  cycleDay: number,
  energyRating: number (1-5),
  recentWorkouts: WorkoutLog[],
  goals: string[]
}
```

**Returns:** `WorkoutRecommendation` JSON
```typescript
{
  name: string,
  duration: string,
  intensity: string,
  phase: string,
  reason: string,
  exercises: string[],
  warmup?: string
}
```

**Model:**
- API: `gemma-4-it` (cloud-based)
- On-device: `gemma-4-e4b` (LiteRT for privacy)

---

## 3. Workout Log Analysis (Log Screen)

**Service:** `parseWorkoutLog()` in `src/app/services/gemma.ts`

**Parameters:**
```typescript
{
  logText: string,
  phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal',
  cycleDay: number
}
```

**Returns:**
```typescript
{
  energyRating: number (1-5),
  completionPercent: number,
  mood: string,
  adjustment: string
}
```

**Privacy:** Runs on-device by default, never sends data to cloud

---

## 4. Cycle Data Sync (Background)

**Apple Health:** Read cycle tracking samples from HealthKit

**Google Health:** Read cycle tracking records from Health Connect or Google Fit

**Normalized Return Shape:**
```typescript
{
  startDate: string, // ISO 8601
  predictedLength: number,
  currentDay: number,
  phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'
}
```

**Sync frequency:** Daily background refresh, manual refresh available

---

## 5. Gemma Chat Interface (Chat Screen)

**Service:** `sendChatMessage()` in `src/app/services/gemma.ts`

**Parameters:**
```typescript
{
  message: string,
  conversationHistory: Message[],
  userContext: {
    phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal',
    cycleDay: number,
    recentWorkouts: WorkoutLog[],
    goals: string[],
    energyLevel?: number
  }
}
```

**Returns:**
```typescript
{
  response: string,
  suggestions?: string[]
}
```

**Use Cases:**
- General fitness advice
- Exercise form corrections
- Nutrition recommendations
- Workout modifications
- Symptom management
- Real-time coaching during workouts

**Context-Aware:** Chat responses are informed by current cycle phase, recent workout history, and user's stated goals

---

## Data Storage

- **Local (Encrypted):** Expo SecureStore for OAuth tokens
- **Optional Cloud Sync:** Supabase for cross-device sync (opt-in only)
- **Privacy-first:** All AI processing happens on-device when enabled

---

## Backend Integration (Serverless OAuth & Google Fit)

### Overview
PhaseFlow uses a serverless backend (Vercel Functions, AWS Lambda, etc.) to securely handle OAuth token exchange and Google Fit API calls.

### Endpoints

#### `POST /api/google/token`
**Purpose:** Exchange OAuth authorization code for access token

**Request:**
```json
{
  "code": "4/0AY0e-g...",
  "state": "random-state-string"
}
```

**Response (Success):**
```json
{
  "access_token": "ya29.a0AfH6SMB...",
  "refresh_token": "1//0gj...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "success": true
}
```

**Response (Error):**
```json
{
  "error": "Invalid authorization code",
  "message": "Token exchange failed"
}
```

**Environment Variables Required:**
- `VITE_GOOGLE_CLIENT_ID` — OAuth app client ID
- `GOOGLE_CLIENT_SECRET` — OAuth app client secret (server-side only, never exposed to frontend)
- `VITE_GOOGLE_REDIRECT_URI` — Callback URL (must match OAuth app configuration)

---

#### `GET /api/google/fit-cycle-data`
**Purpose:** Fetch user's cycle data from Google Fit

**Request:**
```
Authorization: Bearer {access_token}
Accept: application/json
```

**Response (Success):**
```json
{
  "hasCycleData": true,
  "success": true,
  "timestamp": "2026-05-04T12:00:00Z"
}
```

**Response (Error - Expired Token):**
```json
{
  "error": "Invalid or expired access token",
  "message": "Session expired"
}
```

**Notes:**
- Searches for cycle-related data sources in Google Fit
- Queries last 30 days of data points
- Returns boolean flag (not raw data) to minimize exposure
- Requires `fitness.reproductive_health.read` scope

---

### Deployment (Vercel)

**1. Create Vercel Functions**

```bash
# Project structure
api/
  google/
    token.ts          # OAuth token exchange
    fit-cycle-data.ts # Fetch cycle data
```

**2. Set Environment Variables in Vercel Dashboard**

Go to **Project Settings > Environment Variables** and add:
```
VITE_GOOGLE_CLIENT_ID = your-client-id
GOOGLE_CLIENT_SECRET = your-client-secret (encrypted at rest)
VITE_GOOGLE_REDIRECT_URI = https://yourdomain.com/oauth/google/callback
```

**3. Update Frontend Config**

```bash
# .env.production
VITE_API_BASE_URL=https://yourdomain.com
```

**4. Deploy**

```bash
vercel deploy --prod
```

---

### Local Development

**1. Install Vercel CLI**

```bash
npm install -g vercel
```

**2. Create `.env.local`**

```bash
cp .env.example .env.local
```

Edit with your test OAuth credentials:
```
VITE_GOOGLE_CLIENT_ID=your-test-client-id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback
VITE_API_BASE_URL=http://localhost:3000
```

**3. Run Vercel Functions Locally**

```bash
vercel dev
```

This starts both Vite dev server (localhost:5173) and Vercel Functions (localhost:3000).

---

### Demo Mode (No OAuth Credentials)

When `VITE_GOOGLE_CLIENT_ID` is empty:
- Frontend authenticates in **demo mode** (no real OAuth popup)
- `syncGoogleFitCycleData()` simulates results based on `VITE_GOOGLE_FIT_HAS_CYCLE_DATA`
- App remains fully functional for testing UI/UX flows
- No backend credentials required

---

## Environment Variables

```bash
# Google Health (if using Google Fit OAuth)
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback
VITE_GOOGLE_FIT_HAS_CYCLE_DATA=false

# Gemma AI (if using cloud API)
GEMMA_API_KEY=your_api_key

# Supabase (optional, for cloud sync)
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

---

## Implementation Notes

1. **On-device AI is default** to ensure privacy
2. **Health sync permission state** is encrypted and never leaves the device
3. **Supabase sync** is opt-in and disabled by default
4. All API calls should handle offline gracefully
5. Use exponential backoff for retry logic on failed API calls
6. **Chat messages** are processed with full conversation context for continuity
7. **Workout modifications** can be requested mid-session via chat
8. **Suggested prompts** are dynamically generated based on current phase and recent activity

---

## Mock Implementation (Current)

The prototype currently uses **simulated AI responses** for demonstration purposes:
- Workout recommendations are pre-defined based on phase
- Chat responses cycle through contextual example responses
- Log parsing uses simple text pattern matching

For production, integrate:
- **Gemma 4 API** for cloud-based processing
- **Gemma 4 LiteRT** for on-device inference
- **Apple Health + Google Health APIs** for real cycle data
- **Supabase** for optional cloud sync
