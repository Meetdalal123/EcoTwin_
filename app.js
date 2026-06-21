/**
 * EcoTwin — Main Application Controller (app.js)
 * ================================================
 * Architecture: Module Object Pattern (vanilla JS, no framework)
 *
 * MODULE MAP:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  App {}              — Core controller: state, session, auth    │
 * │    ├─ init()         — Bootstrap all modules on DOMContentLoaded│
 * │    ├─ Session        — localStorage persistence (loadSession,   │
 * │    │                   saveSession, loadDiagnosticsProfile)      │
 * │    ├─ Auth           — Google OAuth + guest mode login gate      │
 * │    ├─ Navigation     — Scroll-snap section observer & routing   │
 * │    ├─ UI Modules     — Each section's interactive logic:        │
 * │    │    ├─ initDashboardToggles()   (Diet / Energy toggles)     │
 * │    │    ├─ initTradeoffMachine()    (Carbon trade-off scale)    │
 * │    │    ├─ initStreet2080Slider()   (Future climate visualizer) │
 * │    │    ├─ initTimeCapsuleMap()     (Leaflet geolocation map)   │
 * │    │    ├─ initCarbonReceipt()      (PDF receipt generator)     │
 * │    │    ├─ initWeeklyChallenge()    (Gamified daily tasks)      │
 * │    │    └─ initMainChat()           (Scene-level AI chat)       │
 * │    ├─ Gamification   — XP, ranks, badges, achievements          │
 * │    └─ Diagnostics    — 10-step quiz + emissions engine          │
 * │                                                                 │
 * │  EcoAI {}            — Top-level AI drawer (persistent panel)   │
 * │    ├─ Offline engine — IPCC-aligned keyword intelligence        │
 * │    ├─ Context-aware  — Reads live Carbon Twin score from DOM    │
 * │    └─ No API key     — Works entirely client-side               │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Supporting modules (separate files):
 *   calculator.js  — Wizard-based emissions calculator (4 steps)
 *   pledges.js     — Canvas star-wall constellation renderer
 *   dashboard.js   — Chart.js breakdown visualizations
 *   data.js        — ECO_DATA: emission factors, tips, presets
 *   twin.js        — 3D Carbon Twin avatar renderer
 *   scanners.js    — Receipt/barcode scanner module
 *   planet.js      — Animated Earth renderer
 *   hero-earth.js  — Hero section Earth animation
 *
 * Tests: tests/emissions.test.js (run: npm test)
 */

// GOOGLE_CLIENT_ID is defined globally in google-auth.js

const App = {
  user: {
    name: '',
    isLoggedIn: false,
    level: 1,
    xp: 25,
    rank: 'Carbon Rookie',
    googleProfile: null,
    dashboardInputs: {
      home: null,
      travel: null,
      diet: null,
      energy: null,
    },
  },
  currentBg: 'assets/eco_forest_bg.webp',
  bgState: {
    scrollVal: 0,
    mouseX: 0,
    mouseY: 0,
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.isInitializing = true;
    this.loadSession();

    // Guest Mode Architecture:
    // - First-time visitors see the login gate (sign in with Google OR continue as guest)
    // - The 'Continue as Guest' button in the gate sets isLoggedIn=true and hides the gate
    // - Returning visitors with a saved session bypass the gate automatically
    const hasExistingSession = !!(this.user && this.user.isLoggedIn);
    if (hasExistingSession) {
      // Skip login gate for any returning session — guest or Google
      this.hideGoogleLoginGate();
    } else {
      // Force sign-in gate for first-time visits only
      this.showGoogleLoginGate();
    }

    // Ensure layout styles are correct
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.overflow = '';
      mainContent.style.height = '';
    }
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.style.height = '';
      appContainer.style.overflow = '';
      appContainer.style.pointerEvents = '';
    }

    this.bindLogin();
    this.updateUserProfileUI();

    // Setup header user badge click listener to jump directly to profile tab
    const headerBadge = document.getElementById('header-user-badge');
    if (headerBadge) {
      headerBadge.addEventListener('click', () => {
        const dashboard = document.getElementById('scene-dashboard');
        if (dashboard) {
          dashboard.scrollIntoView({ behavior: 'smooth' });
        }
        const profileTabLink = document.querySelector('.db-nav-item[data-tab="profile"]');
        if (profileTabLink) {
          profileTabLink.click();
        }
      });
    }

    this.initDashboardToggles();
    this.initFoodPills();
    this.initTransportPills();
    this.initEnergyToggle();
    this.initTimelineToggle();
    this.initFlipCards();
    this.updateHomeDietSection();
    this.updateHomeTransportSection();
    this.updateHomeEnergySection();

    // Calculate emissions from restored session state
    this.calculateDashboardEmissions();

    if (this.user.dashboardInputs && this.user.dashboardInputs.quizCompleted) {
      this.calculateDiagnosticsEmissions();
    }
    this.updateDashboardLockState();

    this.updateAchievements();

    // Auto-populate Google Client ID
    const clientIdInput = document.getElementById('google-client-id');
    const actualClientId =
      typeof GOOGLE_CLIENT_ID !== 'undefined' ? GOOGLE_CLIENT_ID : window.GOOGLE_CLIENT_ID || '';
    if (clientIdInput) clientIdInput.value = actualClientId;

    // Dynamic environmental ticking
    this.startGlobalCounter();
    this.startPageCounter();
    this.setupScrollObserver();
    this.setupMouseParallax();

    // Dynamic Scrolling Live feed (Continuous non-repeating look)
    this.startNewsTicker();
    this.bindScrollNavButtons();

    // Initialize Gamified Features
    this.initTradeoffMachine();
    this.initStreet2080Slider();
    this.initTimeCapsuleMap();
    this.initCarbonReceipt();
    this.initMainChat();
    this.initEducationalModal();
    this.initThemeToggle();
    this.initWeeklyChallenge();
    this.renderDiagnosticHistory();
    if (window.EcoDashboard) {
      EcoDashboard.init();
    }
    this.initShareScorecard();

    const resetBtn = document.getElementById('btn-reset-all-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', e => {
        e.preventDefault();
        if (
          confirm(
            'Are you sure you want to reset all your carbon footprint data? This will clear all your progress and saved time capsules.'
          )
        ) {
          Utils.storage.removeItem('eco_user_session');
          Utils.storage.removeItem('eco_diet_calculator');
          Utils.storage.removeItem('eco_time_capsules');
          Utils.storage.removeItem('eco_user_pledges');
          Utils.storage.removeItem('eco_pledges_stars');
          Utils.storage.removeItem('ecotwin_profile');
          window.location.reload();
        }
      });
    }

    const resetProfileBtn = document.getElementById('btn-reset-profile');
    if (resetProfileBtn) {
      resetProfileBtn.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Reset your Carbon Twin profile? This cannot be undone.')) {
          Utils.storage.removeItem('ecotwin_profile');
          Utils.storage.removeItem('eco_user_session');
          Utils.storage.removeItem('eco_diet_calculator');
          Utils.storage.removeItem('eco_time_capsules');
          Utils.storage.removeItem('eco_user_pledges');
          Utils.storage.removeItem('eco_pledges_stars');
          window.location.reload();
        }
      });
    }
    this.isInitializing = false;
  },

  bindScrollNavButtons() {
    const btnUp = document.getElementById('nav-scroll-up-btn');
    const btnDown = document.getElementById('nav-scroll-down-btn');
    const container = document.querySelector('.main-content');
    const sections = document.querySelectorAll('.scroll-section');

    if (!btnUp || !btnDown || !container) return;

    const getActiveSectionIndex = () => {
      let index = 0;
      let minDistance = Infinity;
      sections.forEach((sec, idx) => {
        const rect = sec.getBoundingClientRect();
        const dist = Math.abs(rect.top);
        if (dist < minDistance) {
          minDistance = dist;
          index = idx;
        }
      });
      return index;
    };

    btnUp.addEventListener('click', () => {
      const idx = getActiveSectionIndex();
      if (idx > 0) {
        sections[idx - 1].scrollIntoView({ behavior: 'smooth' });
      }
    });

    btnDown.addEventListener('click', () => {
      const idx = getActiveSectionIndex();
      if (idx < sections.length - 1) {
        sections[idx + 1].scrollIntoView({ behavior: 'smooth' });
      }
    });
  },

  // initEducationalModal moved to features.js
  loadSession() {
    if (window.location.search.includes('reset=true')) {
      Utils.storage.removeItem('eco_user_session');
      Utils.storage.removeItem('eco_diet_calculator');
      Utils.storage.removeItem('eco_time_capsules');
      Utils.storage.removeItem('eco_user_pledges');
      Utils.storage.removeItem('eco_pledges_stars');
      Utils.storage.removeItem('ecotwin_profile');
      window.location.href = window.location.origin + window.location.pathname;
      return;
    }
    const saved = Utils.storage.getItem('eco_user_session');
    if (saved) {
      try {
        const loaded = typeof saved === 'string' ? JSON.parse(saved) : saved;
        let parsedLvl = parseInt(loaded.level);
        let parsedXp = parseInt(loaded.xp);

        if (isNaN(parsedLvl) || parsedLvl <= 0 || parsedLvl > 10) parsedLvl = 1;
        if (isNaN(parsedXp) || parsedXp < 0 || parsedXp > 100) parsedXp = 25;

        this.user = {
          name: loaded.name || '',
          isLoggedIn: !!loaded.isLoggedIn,
          level: parsedLvl,
          xp: parsedXp,
          rank: loaded.rank || 'Carbon Rookie',
          googleProfile: loaded.googleProfile || null,
          dashboardInputs: loaded.dashboardInputs || {
            home: null,
            travel: null,
            diet: null,
            energy: null,
          },
        };
      } catch (e) {
        console.error('Error loading session:', e);
      }
    }

    // Restore from ecotwin_profile if it exists (Improvement 1)
    const ecotwinSaved = Utils.storage.getItem('ecotwin_profile');
    if (ecotwinSaved) {
      try {
        const profileData =
          typeof ecotwinSaved === 'string' ? JSON.parse(ecotwinSaved) : ecotwinSaved;
        if (profileData && profileData.quizAnswers) {
          if (!this.user) {
            this.user = {
              name: '',
              isLoggedIn: false,
              level: 1,
              xp: 25,
              rank: 'Carbon Rookie',
              googleProfile: null,
              dashboardInputs: {},
            };
          }
          this.user.dashboardInputs = profileData.quizAnswers;
          this.user.xp = profileData.xp !== undefined ? parseInt(profileData.xp) : this.user.xp;
          this.user.level =
            profileData.level !== undefined ? parseInt(profileData.level) : this.user.level;

          if (this.user.level >= 5) {
            this.user.rank = 'Net-Zero Legend';
          } else if (this.user.level >= 3) {
            this.user.rank = 'Carbon Specialist';
          } else {
            this.user.rank = 'Carbon Rookie';
          }

          if (this.user.dashboardInputs) {
            this.user.dashboardInputs.quizCompleted = true;
          }
        }
      } catch (e) {
        console.error('Error restoring from ecotwin_profile:', e);
      }
    }

    // Force isLoggedIn to false and reset name if no valid authenticated profile name is loaded
    if (!this.user || !this.user.name || !this.user.isLoggedIn) {
      if (this.user) {
        this.user.isLoggedIn = false;
        this.user.name = '';
        this.user.googleProfile = null;
      }
    }
  },

  saveSession() {
    Utils.storage.setItem('eco_user_session', this.user);
    this.updateUserProfileUI();
    this.updateDashboardLockState();
    if (this.user.dashboardInputs && this.user.dashboardInputs.quizCompleted) {
      this.saveToEcoTwinProfile();
    }
  },

  // saveToEcoTwinProfile moved to features.js
  bindLogin() {
    const loginBtn = document.getElementById('login-trigger-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (this.user.isLoggedIn && this.user.googleProfile) {
          this.signOut();
        } else {
          this.showGoogleLoginGate();
        }
      });
    }

    window.addEventListener('message', e => {
      if (e.data && e.data.type === 'google-login-success') {
        const username = e.data.username || 'Eco Warrior';
        this.user.name = username;
        this.user.isLoggedIn = true;
        this.saveSession();
        this.hideGoogleLoginGate();
        this.showToast(`Welcome, ${username}! 🎉`);
      }
    });
  },

  showGoogleLoginGate() {
    const gate = document.getElementById('google-login-gate');
    if (gate) {
      gate.style.display = 'flex';
      gate.offsetHeight; // force reflow so transition fires
      gate.style.opacity = '1';
      gate.style.visibility = 'visible';
      gate.style.pointerEvents = 'auto';
      gate.style.zIndex = '999999';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // Ensure Google Sign-In / mock button is rendered inside the gate
      if (typeof initGoogleSignIn === 'function') {
        initGoogleSignIn();
      }
    }
  },

  hideGoogleLoginGate() {
    const gate = document.getElementById('google-login-gate');
    if (gate) {
      gate.style.opacity = '0';
      gate.style.visibility = 'hidden';
      setTimeout(() => {
        gate.style.display = 'none';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }, 500);
    }
  },

  startGoogleLoginFlow() {
    // No-op stub
  },

  continueAsGuest() {
    // User chose to explore without signing in — give them a full guest session
    this.user.isLoggedIn = true;
    if (!this.user.name || this.user.name.trim().length === 0) {
      this.user.name = 'Eco Warrior';
    }
    this.saveSession();
    this.hideGoogleLoginGate();
    this.updateUserProfileUI();
    this.showToast('Welcome, Eco Warrior! Explore freely — sign in anytime to save your progress.');
  },

  signOut() {
    if (typeof google !== 'undefined') {
      try {
        google.accounts.id.disableAutoSelect();
      } catch (e) {}
    }
    this.user.isLoggedIn = false;
    this.user.name = '';
    this.user.level = 1;
    this.user.xp = 25;
    this.user.rank = 'Carbon Rookie';
    this.user.googleProfile = null;
    this.saveSession();
    this.updateUserProfileUI();
    this.showGoogleLoginGate();
    const firstSection = document.querySelector('.scroll-section');
    if (firstSection) firstSection.scrollIntoView({ behavior: 'smooth' });
    this.showToast('Signed out successfully.');
  },

  updateUserProfileUI() {
    const uName = document.getElementById('sidebar-user-name');
    const uRank = document.getElementById('sidebar-user-rank');
    const uBadge = document.getElementById('header-user-badge');
    const loginBtn = document.getElementById('login-trigger-btn');

    if (this.user.isLoggedIn) {
      if (uName) uName.textContent = this.user.name;
      if (uRank) {
        uRank.textContent = this.user.rank;
        uRank.style.display = 'inline-block';
      }
      if (uBadge) {
        uBadge.style.display = 'flex';
        uBadge.classList.remove('preview-mode-badge');
        uBadge.style.cursor = 'pointer';
      }
      if (loginBtn) {
        loginBtn.style.display = 'inline-flex';
        loginBtn.textContent = '';
        const icon = document.createElement('i');
        icon.className = 'header-login-icon';
        if (this.user.googleProfile) {
          icon.setAttribute('data-lucide', 'log-out');
          loginBtn.appendChild(icon);
          loginBtn.appendChild(document.createTextNode(' Sign Out'));
        } else {
          icon.setAttribute('data-lucide', 'log-in');
          loginBtn.appendChild(icon);
          loginBtn.appendChild(document.createTextNode(' Sign In'));
        }
      }
      this.hideGoogleLoginGate();
    } else {
      if (uBadge) uBadge.style.display = 'none';
      if (loginBtn) {
        loginBtn.style.display = 'inline-flex';
        loginBtn.textContent = '';
        const icon = document.createElement('i');
        icon.className = 'header-login-icon';
        icon.setAttribute('data-lucide', 'log-in');
        loginBtn.appendChild(icon);
        loginBtn.appendChild(document.createTextNode(' Sign In'));
      }
      // Gate is shown only when user clicks Sign In, not auto-shown on load
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Update avatars securely via DOM manipulation
    this.updateProfileAvatar('db-sidebar-avatar');
    this.updateProfileAvatar('db-profile-avatar-inside');

    // Update internal dashboard profile elements if present
    const pName = document.getElementById('profile-user-name');
    if (pName) pName.textContent = this.user.name || 'Guest User';

    const pRank = document.getElementById('profile-user-rank');
    if (pRank) pRank.textContent = this.user.rank || 'Carbon Rookie';

    const pLevel = document.getElementById('profile-user-level');
    if (pLevel) pLevel.textContent = this.user.level;

    const pXp = document.getElementById('profile-user-xp');
    if (pXp) pXp.textContent = this.user.xp;

    const pXpBar = document.getElementById('profile-xp-bar');
    if (pXpBar) pXpBar.style.width = this.user.xp + '%';
  },

  updateProfileAvatar(elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.textContent = ''; // clear any existing text or image

    if (this.user.isLoggedIn && this.user.googleProfile && this.user.googleProfile.picture) {
      const img = document.createElement('img');
      img.src = this.user.googleProfile.picture;
      img.alt = this.user.name || 'User Profile';
      img.loading = 'lazy';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      container.appendChild(img);
    } else {
      const initial =
        this.user.name && this.user.name.trim().length > 0
          ? this.user.name.trim().charAt(0).toUpperCase()
          : 'U';
      container.textContent = initial;
    }
  },

  // Overlay Page/Feature Manager
  // openFeatureModal moved to features.js

  // initDashboardToggles_calculateEmissions moved to features.js

  // Diagnostics quiz methods moved to diagnostics.js

  // dashboardPillsAndToggles moved to features.js

  // initFlipCards moved to features.js

  // Obsolete addXp removed (handled by gamification.js)

  // counters moved to features.js

  updateDashboardLockState() {
    const isCompleted = !!(this.user.dashboardInputs && this.user.dashboardInputs.quizCompleted);
    const overlay = document.getElementById('profile-lock-overlay');
    if (overlay) {
      overlay.style.display = 'none'; // Always hide overlay
    }

    const ctaContainer = document.getElementById('profile-cta-container');
    if (ctaContainer) {
      ctaContainer.style.display = isCompleted ? 'none' : 'block';
    }

    const types = ['food', 'transport', 'energy', 'shopping'];

    if (!isCompleted) {
      types.forEach(type => {
        const homeProgressEl = document.getElementById(`home-ring-progress-${type}`);
        const homePercentEl = document.getElementById(`home-ring-percent-${type}`);
        const homeValEl = document.getElementById(`home-ring-val-${type}`);

        if (homeProgressEl) {
          homeProgressEl.style.strokeDashoffset = 213;
        }
        if (homePercentEl) {
          homePercentEl.textContent = '0%';
          homePercentEl.classList.remove('blur-metric');
        }
        if (homeValEl) {
          homeValEl.textContent = 'Not Selected';
          homeValEl.classList.remove('blur-metric');
        }
      });

      const profileTotalScore = document.getElementById('profile-total-score');
      if (profileTotalScore) {
        profileTotalScore.textContent = '0 kg CO₂/yr';
        profileTotalScore.classList.remove('blur-metric');
      }
    } else {
      // Completed, remove blur and lock icons
      types.forEach(type => {
        const homePercentEl = document.getElementById(`home-ring-percent-${type}`);
        const homeValEl = document.getElementById(`home-ring-val-${type}`);
        if (homePercentEl) {
          homePercentEl.classList.remove('blur-metric');
        }
        if (homeValEl) {
          homeValEl.classList.remove('blur-metric');
        }
      });
      const profileTotalScore = document.getElementById('profile-total-score');
      if (profileTotalScore) {
        profileTotalScore.classList.remove('blur-metric');
      }
    }
  },

  updateParticlesForSection(sectionId) {
    let container = document.querySelector('.leaf-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'leaf-container';
      document.body.appendChild(container);
    }
    container.textContent = '';

    // Only green leaves and cherry blossoms fall
    const pTypes = ['leaf', 'blossom'];

    const count = 16;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      // Randomly select one of the allowed types for this page
      const type = pTypes[Math.floor(Math.random() * pTypes.length)];
      p.className = type;
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 8}s`;
      // Graceful and smooth floating speed: neither too fast nor too slow (7s to 15s)
      p.style.animationDuration = `${7 + Math.random() * 8}s`;
      container.appendChild(p);
    }
  },

  showToast(msg) {
    const t = document.createElement('div');
    t.setAttribute('role', 'alert');
    t.style.position = 'fixed';
    t.style.bottom = '2rem';
    t.style.right = '2rem';
    t.style.background = 'rgba(16, 185, 129, 0.95)';
    t.style.color = '#fff';
    t.style.padding = '0.75rem 1.5rem';
    t.style.borderRadius = 'var(--radius-md)';
    t.style.border = '1px solid var(--color-green-light)';
    t.style.zIndex = '10000';
    t.style.fontFamily = 'var(--font-heading)';
    t.style.fontWeight = '600';
    t.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
    t.textContent = msg;

    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  },

  fireConfetti() {
    for (let i = 0; i < 30; i++) {
      const c = document.createElement('div');
      c.style.position = 'fixed';
      c.style.left = '50%';
      c.style.top = '50%';
      c.style.width = '8px';
      c.style.height = '8px';
      c.style.backgroundColor = ['#10b981', '#06b6d4', '#fbbf24', '#34d399'][
        Math.floor(Math.random() * 4)
      ];
      c.style.borderRadius = '50%';
      c.style.zIndex = '9999';
      c.style.pointerEvents = 'none';

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      const dx = Math.cos(angle) * speed * 20;
      const dy = Math.sin(angle) * speed * 20;

      document.body.appendChild(c);
      c.animate(
        [
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 },
        ],
        {
          duration: 1000 + Math.random() * 1000,
          easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
        }
      ).onfinish = () => c.remove();
    }
  },

  // mouseParallax moved to features.js

  // startNewsTicker moved to features.js

  scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      // Update nav link active state
      document.querySelectorAll('.header-nav-link').forEach(link => {
        const target = link.getAttribute('data-target');
        const isMatch =
          target === sectionId ||
          (target === 'scene-food' &&
            (sectionId === 'scene-transport' || sectionId === 'scene-energy'));
        if (isMatch) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  },

  setupScrollObserver() {
    if (typeof IntersectionObserver === 'undefined') return;
    const container = document.querySelector('.main-content');
    const sections = document.querySelectorAll('.scroll-section');
    const sectionList = Array.from(sections);
    let lastIndex = 0;

    const backgrounds = {
      'scene-hero': 'assets/eco_forest_bg.webp',
      'scene-dashboard': 'assets/eco_mist_bg.webp',
      'scene-diagnostics': 'assets/eco_stream_bg.webp',
      'scene-achievements': 'assets/eco_bamboo_bg.webp',
      'scene-tradeoff': 'assets/eco_tech_bg.webp',
      'scene-food': 'assets/eco_food_bg.webp',
      'scene-transport': 'assets/eco_transport_bg.webp',
      'scene-energy': 'assets/eco_valley_bg.webp',
      'scene-pledges': 'assets/eco_pledges_bg.webp',
      'scene-street2080': 'assets/eco_waterfall_bg.webp',
      'scene-chat': 'assets/eco_chat_bg.webp',
    };

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;

            // Crossfade background
            const bgImg = backgrounds[sectionId];
            if (bgImg) this.changeBackground(bgImg);

            // Update header navigation active states dynamically on scroll
            document.querySelectorAll('.header-nav-link').forEach(link => {
              const target = link.getAttribute('data-target');
              const isMatch =
                target === sectionId ||
                (target === 'scene-food' &&
                  (sectionId === 'scene-transport' || sectionId === 'scene-energy'));
              if (isMatch) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });

            // Invalidate Leaflet map size on enter to fix rendering issues inside hidden layouts
            if (sectionId === 'scene-pledges' && window.timeCapsuleMapInstance) {
              setTimeout(() => {
                window.timeCapsuleMapInstance.invalidateSize();
              }, 100);
            }

            const newIndex = sectionList.indexOf(entry.target);

            // Remove direction classes from all sections
            sections.forEach(s => {
              s.classList.remove('active', 'from-bottom', 'from-top');
            });

            // Add active and directional classes to current section
            entry.target.classList.add('active');
            if (newIndex > lastIndex) {
              entry.target.classList.add('from-bottom');
            } else if (newIndex < lastIndex) {
              entry.target.classList.add('from-top');
            }

            lastIndex = newIndex;

            // Trigger particle update dynamically
            this.updateParticlesForSection(sectionId);
          }
        });
      },
      {
        root: window.innerWidth <= 768 ? null : container,
        threshold: window.innerWidth <= 768 ? 0.15 : 0.25,
      }
    );

    sections.forEach(s => observer.observe(s));

    // Smooth scroll parallax background tracking
    const handleScrollUpdate = () => {
      const isMobile = window.innerWidth <= 768;
      const scrollSource = isMobile ? window : container;
      const scrolled = isMobile ? window.pageYOffset : container.scrollTop;
      const maxScroll = isMobile
        ? document.documentElement.scrollHeight - window.innerHeight
        : container.scrollHeight - container.clientHeight;

      if (maxScroll > 0) {
        const shiftFraction = scrolled / maxScroll;
        const maxShift = window.innerHeight * 0.05;
        this.bgState.scrollVal = -shiftFraction * maxShift;
      } else {
        this.bgState.scrollVal = 0;
      }
      this.updateBackgroundTransform();
    };

    container.addEventListener('scroll', handleScrollUpdate);
    window.addEventListener('scroll', handleScrollUpdate);
  },

  changeBackground(bgImg) {
    const layer1 = document.getElementById('bg-layer-1');
    const layer2 = document.getElementById('bg-layer-2');
    if (!layer1 || !layer2 || this.currentBg === bgImg) return;

    const o1 = parseFloat(layer1.style.opacity || '1');
    const activeLayer = o1 > 0 ? layer1 : layer2;
    const inactiveLayer = activeLayer === layer1 ? layer2 : layer1;

    inactiveLayer.style.backgroundImage = `url('${bgImg}')`;
    activeLayer.style.opacity = '0';
    inactiveLayer.style.opacity = '1';

    this.currentBg = bgImg;
  },

  // updateAchievements moved to gamification.js

  // updateHomeDietSection moved to features.js

  // ==========================================================================
  // GAMIFIED FEATURES CONTROLLERS (Moved to js/features.js)
  // ==========================================================================

  // initMainChat moved to ai-chat.js

  initThemeToggle() {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('ecotwin_theme', 'dark');
  },

  updateThemeIcon(theme) {},

  // initWeeklyChallenge moved to gamification.js
  // logDiagnosticHistory and renderDiagnosticHistory moved to diagnostics.js

  // shareScorecard moved to features.js

  async initTradeoffMachine() {
    if (
      typeof App.initTradeoffMachine === 'function' &&
      App.initTradeoffMachine !== this.initTradeoffMachine
    ) {
      App.initTradeoffMachine();
      return;
    }
    await import('./features/tradeoff-machine.js');
    if (
      typeof App.initTradeoffMachine === 'function' &&
      App.initTradeoffMachine !== this.initTradeoffMachine
    ) {
      App.initTradeoffMachine();
    }
  },

  async initStreet2080Slider() {
    if (
      typeof App.initStreet2080Slider === 'function' &&
      App.initStreet2080Slider !== this.initStreet2080Slider
    ) {
      App.initStreet2080Slider();
      return;
    }
    await import('./features/street-2080.js');
    if (
      typeof App.initStreet2080Slider === 'function' &&
      App.initStreet2080Slider !== this.initStreet2080Slider
    ) {
      App.initStreet2080Slider();
    }
  },

  async initCarbonReceipt() {
    if (
      typeof App.initCarbonReceipt === 'function' &&
      App.initCarbonReceipt !== this.initCarbonReceipt
    ) {
      App.initCarbonReceipt();
      return;
    }
    await import('./features/receipt.js');
    if (
      typeof App.initCarbonReceipt === 'function' &&
      App.initCarbonReceipt !== this.initCarbonReceipt
    ) {
      App.initCarbonReceipt();
    }
  },
};

if (typeof window !== 'undefined') {
  window.App = App;
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// EcoAI moved to ai-chat.js

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
  global.App = App;
}
