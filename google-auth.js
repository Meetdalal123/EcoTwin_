/**
 * google-auth.js
 * --------------
 * Handles Google One-Tap and Button integration.
 * Renders the Google Sign-In button inside the static HTML login gate.
 */

const GOOGLE_CLIENT_ID = (typeof ECOTWIN_CONFIG !== 'undefined' && ECOTWIN_CONFIG.googleClientId)
  ? ECOTWIN_CONFIG.googleClientId
  : ""; // Load from config.js in local environment

let googleSignInInitialized = false;

// ── Init ──────────────────────────────────────────────────────
function initGoogleSignIn() {
  const btnWrapper = document.getElementById("g-button-wrapper");

  // Always restore session first (even if google scripts are blocked or client id is placeholder)
  const saved = typeof Utils !== 'undefined' ? Utils.storage.getItem("eco_user_session") : JSON.parse(localStorage.getItem("eco_user_session"));
  if (saved) {
    try {
      const user = typeof saved === 'string' ? JSON.parse(saved) : saved;
      if (user && user.isLoggedIn) {
        if (typeof App !== 'undefined') {
          App.user.name = user.name;
          App.user.isLoggedIn = true;
          App.user.googleProfile = user.googleProfile || null;
          App.updateUserProfileUI();
        }
      }
    } catch (e) {}
  }

  if (!btnWrapper) return;

  const isPlaceholder = !GOOGLE_CLIENT_ID || 
                        GOOGLE_CLIENT_ID.trim() === "" || 
                        GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID";

  const useMock = isPlaceholder || (typeof google === "undefined");

  if (useMock) {
    if (!btnWrapper.dataset.mockRendered) {
      btnWrapper.dataset.mockRendered = "true";
      btnWrapper.innerHTML = `
        <div class="mock-google-btn">
          <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.81-2.6-2.81-4.53-5.36-4.53z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span class="btn-text">Sign in with Google</span>
        </div>
      `;
      btnWrapper.style.cursor = "pointer";
      btnWrapper.addEventListener("click", () => {
        const mockPayload = {
          name: "Eco Warrior",
          email: "guest@ecotwin.ai",
          picture: "",
        };
        const encodedPayload = btoa(JSON.stringify(mockPayload)).replace(/=/g, "");
        const dummyJwt = `header.${encodedPayload}.signature`;
        handleGoogleCredential({ credential: dummyJwt });
      });
    }
    return;
  }

  if (googleSignInInitialized) return;
  googleSignInInitialized = true;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: false,
  });

  google.accounts.id.renderButton(btnWrapper, {
    theme: "filled_black",
    size: "large",
    shape: "pill",
    text: "signin_with",
    logo_alignment: "left",
    width: 260
  });

  if (!isPlaceholder) {
    google.accounts.id.prompt();
  }
}

// ── JWT decode ────────────────────────────────────────────────
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

// ── On Google sign-in success ─────────────────────────────────
function handleGoogleCredential(response) {
  const payload = parseJwt(response.credential);
  if (!payload) return;

  if (typeof App !== 'undefined') {
    App.user.name = payload.name;
    App.user.isLoggedIn = true;
    App.user.googleProfile = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    };
    App.saveSession();
    App.updateUserProfileUI();
    App.showToast(`Welcome back, ${payload.name}! 🎉`);
  }
}

// ── Sign out ──────────────────────────────────────────────────
function signOut() {
  if (typeof google !== "undefined") {
    try { google.accounts.id.disableAutoSelect(); } catch (e) {}
  }
  if (typeof App !== 'undefined') {
    App.signOut();
  }
}

// Stubs for compatibility with app.js calls
function showLoginModal() {
  if (typeof App !== 'undefined') {
    App.showGoogleLoginGate();
  }
}

function hideLoginModal() {
  if (typeof App !== 'undefined') {
    App.hideGoogleLoginGate();
  }
}

function updateUIAfterLogin() {}
function updateUIAfterLogout() {
  signOut();
}

// Define GOOGLE_CLIENT_ID globally on window and setup robust load listeners
if (typeof window !== "undefined") {
  window.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;

  // 1. Check if the script is loaded/ready immediately (only if DOM is already parsed/interactive)
  const isDomReady = document.readyState === "complete" || document.readyState === "interactive";
  if (isDomReady && typeof google !== "undefined") {
    initGoogleSignIn();
  }

  // 2. Add load listener to the script tag if it exists in the DOM
  const gsiScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
  if (gsiScript) {
    gsiScript.addEventListener('load', () => {
      initGoogleSignIn();
    });
  }

  // 3. Fallback window.onload
  const oldOnload = window.onload;
  window.onload = (e) => {
    if (typeof oldOnload === "function") oldOnload(e);
    if (typeof google !== "undefined") initGoogleSignIn();
  };

  // 4. Fallback DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof google !== "undefined") initGoogleSignIn();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initGoogleSignIn, parseJwt, handleGoogleCredential, signOut };
  global.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
  global.initGoogleSignIn = initGoogleSignIn;
  global.parseJwt = parseJwt;
  global.handleGoogleCredential = handleGoogleCredential;
  global.signOut = signOut;
  global.showLoginModal = showLoginModal;
  global.hideLoginModal = hideLoginModal;
  global.updateUIAfterLogin = updateUIAfterLogin;
  global.updateUIAfterLogout = updateUIAfterLogout;
}
