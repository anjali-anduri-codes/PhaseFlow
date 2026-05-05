
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

  For detailed API integration guide, see [API_INTEGRATION.md](API_INTEGRATION.md).
  
  