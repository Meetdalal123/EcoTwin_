/**
 * EcoTwin Runtime Configuration
 * ================================
 * Copy this file as config.js and fill in your credentials.
 * config.js is listed in .gitignore — never commit real secrets.
 *
 * Environment Variable Setup (for CI / Cloudflare Pages / Vercel):
 *   ECOTWIN_GOOGLE_CLIENT_ID   — Google OAuth 2.0 Client ID
 *   ECOTWIN_FIREBASE_DB_URL    — Firebase Realtime Database URL
 *
 * See README.md → "Configuration" for detailed setup instructions.
 */
const ECOTWIN_CONFIG = {
  /**
   * Google OAuth 2.0 Client ID
   * Get from: console.cloud.google.com → APIs & Services → Credentials
   * Add your domain to "Authorized JavaScript origins"
   * Env var: ECOTWIN_GOOGLE_CLIENT_ID
   */
  googleClientId: (typeof process !== 'undefined' && process.env && process.env.ECOTWIN_GOOGLE_CLIENT_ID)
    ? process.env.ECOTWIN_GOOGLE_CLIENT_ID
    : "644549070899-jfgvvq2i9crbaqtjn306av99f23vq9s0.apps.googleusercontent.com",

  /** App environment: "development" | "production" */
  environment: (typeof process !== 'undefined' && process.env && process.env.NODE_ENV)
    ? process.env.NODE_ENV
    : "development",

  /** App version for cache-busting */
  version: "1.0.0",

  /**
   * Firebase Realtime Database URL for shared Star Wall / Map features
   * Get from: console.firebase.google.com → Realtime Database → Data tab
   * Env var: ECOTWIN_FIREBASE_DB_URL
   */
  firebaseDatabaseURL: (typeof process !== 'undefined' && process.env && process.env.ECOTWIN_FIREBASE_DB_URL)
    ? process.env.ECOTWIN_FIREBASE_DB_URL
    : "YOUR_FIREBASE_DATABASE_URL"
};
