# PhaseFlow - Cycle-Synced Fitness App

**Tagline:** "Train with your cycle, not against it."

**Team:** Infradian Labs

PhaseFlow is a mobile fitness app that provides personalized workout recommendations based on menstrual cycle phases and energy levels, powered by Gemma 4 AI.

---

## Inclusivity Principles

PhaseFlow is designed for **all menstruators**, regardless of gender identity. Every design decision reflects this commitment:

### Language
- ✅ Use: "menstruators", "people who cycle", "you", "your body"
- ❌ Avoid: "women", "female", "she/her"
- Phase names are clinical and neutral: **Menstrual**, **Follicular**, **Ovulatory**, **Luteal**

### Visual Design
- **No gender-coded imagery**: No pink bows, female silhouettes, or gender symbols
- **Abstract body illustrations**: Geometric shapes and fluid forms representing all body types
- **Inclusive color palette**: Deep sage green, warm terracotta, soft off-white, deep charcoal
- **No stereotypically feminine palettes**: Pink is NOT the primary brand color

### Tone
- **Clinical where accurate** (phase names, medical information)
- **Warm where emotional** (energy check-ins, encouragement)
- **Never cutesy or overly delicate**

---

## Brand Identity

### Color Palette
- **Primary:** Deep sage `#4A7C59` (grounded, natural)
- **Accent:** Warm terracotta `#C0622B` (energy, warmth, strength)
- **Background:** Off-white `#F7F5F1` (warm neutral)
- **Surface:** `#FFFFFF`
- **Text Primary:** `#1C1C1E`
- **Text Secondary:** `#6B6B6B`

### Phase Colors (used sparingly)
- **Menstrual:** `#B84C3A` (warm red)
- **Follicular:** `#4A7C59` (sage, same as primary)
- **Ovulatory:** `#5C4B8A` (deep violet)
- **Luteal:** `#A0722A` (warm amber)

### Typography
- **Heading:** DM Sans Bold (700)
- **Body:** Inter Regular (400)
- **Data/Numeric:** JetBrains Mono (for cycle day numbers and stats)

### Design Aesthetic
Clean, minimal, clinical-warm. Think: high-quality health journal meets modern fitness tracker.
- No gradients
- No decorative flourishes
- Strong white space
- Data-forward but warm

---

## Screens Overview

### Onboarding Flow
1. **Welcome** - Introduction with abstract cycle illustration
2. **Data Source Selection** - Choose between Manual, Apple Health, or Google Health
3. **Cycle Dates** - Enter last cycle start date and typical cycle length
4. **Goals** - Multi-select fitness goals

### Main App
5. **Home (Dashboard)** - Weekly stats, phase card, energy check-in, recommended workout, quick actions
6. **Workouts Library** - Browse all workouts by category (Strength, Cardio, Flexibility, Recovery)
7. **Workout Active** - Live workout with timer, exercise guidance, and controls (play/pause/skip)
8. **Workout Complete** - Post-workout summary with stats and feeling check-in
9. **Gemma Chat** - AI coaching chat for personalized advice on workouts, nutrition, and cycle
10. **Workout Log (Input)** - Natural language workout logging
11. **Workout Log (Result)** - Gemma AI parsed results with energy and completion analysis
12. **Calendar** - Month view with phase colors and logged workouts
13. **Settings** - Data sources, AI privacy settings, about

### Bonus
14. **Component Library** - Showcase of all reusable components with variants

---

## Component Library

### Core Components
- **PhaseCard** - 4 variants (one per phase)
- **WorkoutCard** - default, loading, error states
- **EnergyCheckIn** - 5-button row with all selected states
- **PhaseBadge** - Pill with phase name and color
- **GemmaBadge** - "Powered by Gemma 4" with privacy variant
- **HealthBadge** - Connected state for Apple Health or Google Health
- **CycleProgressBar** - Phase-colored progress indicator
- **PrimaryButton** - default, loading, disabled states
- **GhostButton** - default, hover states
- **InputField** - default, focused, filled, error states
- **PhaseCalendarDay** - 4 phase variants + today + logged states

---

## Tech Stack

- **Framework:** React + TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **AI Integration:** Gemma 4 (planned)
- **Data Sync:** Apple Health / Google Health, Supabase (optional)
- **Mobile:** Optimized for 390×844px (iPhone 14 Pro)

---

## Design System

### Spacing
Uses 8pt grid - all spacing in multiples of 4px:
- 4px, 8px, 12px, 16px, 24px, 32px, 48px

### Border Radius
- Small: `8px`
- Medium: `12px`
- Large: `16px`
- Pill: `100px`

### Touch Targets
All interactive elements: **minimum 44×44px**

### Accessibility
- All text meets **WCAG AA** contrast ratio (4.5:1 minimum)
- Semantic HTML throughout
- Clear focus states

---

## Navigation

Click the **book icon** (top-right corner) to view the **Component Library**.

The app flows through:
1. **Onboarding** (Welcome → Data Source → Cycle Dates → Goals)
2. **Main app** with bottom navigation:
   - **Home** - Dashboard with stats, recommended workout, and quick actions
   - **Workouts** - Browse full workout library by category
   - **Calendar** - View cycle phases and logged workouts
   - **Chat** - Ask Gemma AI for personalized coaching

### Key Flows
- **Start a workout**: Home → Select workout → Active workout screen → Complete screen → Log
- **Chat with AI**: Click Chat icon or "Ask Gemma" from Home → Chat interface
- **Browse workouts**: Workouts tab → Filter by category → Select workout

---

## API Integration

See [API_INTEGRATION.md](./API_INTEGRATION.md) for detailed API documentation.

**Key integrations:**
- Apple Health / Google Health sync for cycle tracking
- Gemma 4 AI for workout recommendations and log parsing
- Optional Supabase for cross-device sync

**Privacy-first approach:**
- AI runs on-device by default
- Health sync permissions stored securely locally
- Cloud sync is opt-in only

---

## Key Features

✅ **Workout Library** - Browse strength, cardio, flexibility, and recovery workouts  
✅ **Live Workout Tracking** - Timer, exercise guidance, and playback controls  
✅ **Gemma AI Chat** - Real-time coaching advice personalized to your cycle  
✅ **Phase-Aware Recommendations** - Workouts tailored to your current phase  
✅ **Progress Stats** - Track workout streak, weekly count, and level  
✅ **Natural Language Logging** - AI parses your workout notes automatically  

## Future Enhancements

- [ ] Real Gemma 4 AI backend integration (currently mock responses)
- [ ] Apple Health sync
- [ ] Google Health sync
- [ ] Workout video demonstrations
- [ ] Advanced progress analytics and insights
- [ ] Community features (optional, privacy-conscious)
- [ ] Nutrition recommendations by phase
- [ ] Symptom tracking and predictions

---

## Credits

**Design & Development:** PhaseFlow Team  
**Organization:** Infradian Labs  
**AI Partner:** Google Gemma 4  
**Cycle Data Partners:** Apple Health, Google Health

---

## License

This is a prototype/demo application. Not for medical use.

For questions or feedback, visit our GitHub repository.
