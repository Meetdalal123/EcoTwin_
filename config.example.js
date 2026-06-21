/**
 * EcoTwin Configuration File
 * ==========================
 * HOW TO USE:
 * 1. Copy this file: config.example.js  →  config.js
 * 2. Fill in your actual values in config.js
 * 3. config.js is in .gitignore — it will NOT be committed to source control
 * 4. Add <script src="config.js"></script> BEFORE google-auth.js in index.html
 *
 * WHY THIS MATTERS:
 * Keeping credentials out of source code is a security best practice.
 * Even though Google OAuth Client IDs are technically public-facing,
 * they should be domain-restricted in Google Cloud Console and NOT
 * hardcoded inside committed source files.
 */
const ECOTWIN_CONFIG = {
  // Google OAuth 2.0 Client ID
  // Get this from: console.cloud.google.com → APIs & Services → Credentials
  // IMPORTANT: Add your domain to the "Authorized JavaScript origins" list
  googleClientId: "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com",

  // App environment (development | production)
  environment: "development",

  // App version (used for cache-busting)
  version: "1.0.0",

  // Shared Firebase Realtime Database URL for demo Star Wall / Map features
  firebaseDatabaseURL: "https://YOUR_DATABASE_NAME_HERE.firebaseio.com"
};
