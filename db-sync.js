/**
 * EcoTwin Firebase Sync Engine
 * ----------------------------
 * Connects the local Star Wall (Pledges) and Time Capsule Map features to a live,
 * shared Firebase Realtime Database. Falling back gracefully to localStorage if offline.
 */

const EcoDb = {
  db: null,
  firebaseEnabled: false,

  init(databaseURL) {
    // Check if Firebase compatibility scripts loaded successfully
    if (typeof firebase !== 'undefined') {
      const url =
        databaseURL || (window.ECOTWIN_CONFIG && window.ECOTWIN_CONFIG.firebaseDatabaseURL);
      if (!url || url.includes('YOUR_')) {
        console.log(
          '[EcoDb] Firebase Database URL is not configured or is placeholder. Running in local standalone mode.'
        );
        return;
      }
      try {
        const firebaseConfig = {
          databaseURL: url,
        };
        firebase.initializeApp(firebaseConfig);
        this.db = firebase.database();
        this.firebaseEnabled = true;
        console.log('[EcoDb] Connected to shared Firebase Realtime Database backend successfully.');
      } catch (e) {
        console.warn(
          '[EcoDb] Firebase initialization failed. Falling back to Local Storage mode:',
          e
        );
      }
    } else {
      console.log('[EcoDb] Firebase not loaded. Running in local standalone mode.');
    }
  },

  // ── Synchronize Pledges ─────────────────────────────────────
  async syncPledges(callback) {
    if (!this.firebaseEnabled) return;

    try {
      const ref = this.db.ref('pledges');

      // Initial fetch + real-time listening
      ref.on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
          // Convert object format back to array
          const list = Object.values(data);
          callback(list);
        }
      });
    } catch (e) {
      console.error('[EcoDb] Error syncing pledges from Firebase:', e);
    }
  },

  async uploadPledge(pledge) {
    if (!this.firebaseEnabled) return;
    try {
      const ref = this.db.ref('pledges');
      await ref.push(pledge);
      console.log('[EcoDb] Synchronized new pledge to shared Firebase backend.');
    } catch (e) {
      console.error('[EcoDb] Failed to send pledge to Firebase:', e);
    }
  },

  // ── Synchronize Time Capsules ────────────────────────────────
  async syncCapsules(callback) {
    if (!this.firebaseEnabled) return;

    try {
      const ref = this.db.ref('capsules');

      // Listen for updates dynamically
      ref.on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
          callback(data);
        }
      });
    } catch (e) {
      console.error('[EcoDb] Error syncing capsules from Firebase:', e);
    }
  },

  async uploadCapsule(cityKey, capsule) {
    if (!this.firebaseEnabled) return;
    try {
      // Structure: capsules/cityKey/uniqueId -> capsule
      const ref = this.db.ref(`capsules/${cityKey}`);
      await ref.push(capsule);
      console.log('[EcoDb] Synchronized new time capsule to shared Firebase backend.');
    } catch (e) {
      console.error('[EcoDb] Failed to send capsule to Firebase:', e);
    }
  },
};

// Auto initialize
if (typeof ECOTWIN_CONFIG !== 'undefined' && ECOTWIN_CONFIG.firebaseDatabaseURL) {
  EcoDb.init(ECOTWIN_CONFIG.firebaseDatabaseURL);
} else if (window.ECOTWIN_CONFIG && window.ECOTWIN_CONFIG.firebaseDatabaseURL) {
  EcoDb.init(window.ECOTWIN_CONFIG.firebaseDatabaseURL);
} else {
  EcoDb.init();
}
window.EcoDb = EcoDb;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoDb;
  global.EcoDb = EcoDb;
}
