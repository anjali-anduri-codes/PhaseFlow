# FlowFit API Integration Guide

This document describes the API integrations required for FlowFit's cycle-synced fitness app.

## 1. Flo App OAuth Integration (Data Source Screen)

**Endpoint:** `GET https://partners.flo.health/oauth/authorize`

**Flow:**
1. User initiates OAuth flow from Data Source selection screen
2. Redirect to Flo authorization page
3. On callback: `POST /oauth/token` to exchange code for access_token
4. Store token using Expo SecureStore (encrypted, device-only)

**Security:** No passwords stored, OAuth 2.0 standard flow

---

## 2. Workout Recommendation (Home Screen)

**Service:** `getWorkoutRecommendation()` in `src/services/gemma.ts`

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

**Service:** `parseWorkoutLog()` in `src/services/gemma.ts`

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

## 4. Flo Cycle Data Sync (Background)

**Endpoint:** `GET https://api.flo.health/v1/cycle/current`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Returns:**
```typescript
{
  start_date: string (ISO 8601),
  predicted_length: number,
  current_day: number,
  phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'
}
```

**Sync frequency:** Daily background refresh, manual refresh available

---

## 5. Gemma Chat Interface (Chat Screen)

**Service:** `sendChatMessage()` in `src/services/gemma.ts`

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

## Environment Variables

```bash
# Flo Integration
FLO_CLIENT_ID=your_client_id
FLO_CLIENT_SECRET=your_client_secret
FLO_REDIRECT_URI=flowfit://oauth/callback

# Gemma AI (if using cloud API)
GEMMA_API_KEY=your_api_key

# Supabase (optional, for cloud sync)
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

---

## Implementation Notes

1. **On-device AI is default** to ensure privacy
2. **Flo OAuth tokens** are encrypted and never leave the device
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
- **Flo Health API** for real cycle data
- **Supabase** for optional cloud sync
