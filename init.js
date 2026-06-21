document.addEventListener('DOMContentLoaded', () => {
  // Boot the App (binds all event listeners including Sign In, Educational Modal, etc.)
  if (window.App && typeof App.init === 'function') {
    App.init();
  }

  // Initialize Google Sign-In button / mock fallback
  if (typeof initGoogleSignIn === 'function') {
    initGoogleSignIn();
  }

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // 1. Navigation Links Scroll
  const navLinks = document.querySelectorAll('.header-nav-link');
  navLinks.forEach(link => {
    link.removeAttribute('onclick');
    link.removeAttribute('onkeydown');
    const targetId =
      link.getAttribute('data-target') || (link.getAttribute('href') || '').replace('#', '');
    link.addEventListener('click', e => {
      e.preventDefault();
      if (window.App && typeof App.scrollToSection === 'function') {
        App.scrollToSection(targetId);
      }
    });
    link.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (window.App && typeof App.scrollToSection === 'function') {
          App.scrollToSection(targetId);
        }
      }
    });
  });

  // 2. Header User Badge
  const badge = document.getElementById('header-user-badge');
  if (badge) {
    badge.removeAttribute('onkeydown');
    badge.addEventListener('click', () => {
      document.getElementById('scene-dashboard')?.scrollIntoView({ behavior: 'smooth' });
      const p = document.querySelector('.db-nav-item[data-tab="profile"]');
      if (p) p.click();
    });
    badge.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.getElementById('scene-dashboard')?.scrollIntoView({ behavior: 'smooth' });
        const p = document.querySelector('.db-nav-item[data-tab="profile"]');
        if (p) p.click();
      }
    });
  }

  // 3. Scroll to Diagnostics buttons
  document
    .querySelectorAll(
      '.hero-btn-primary, #profile-cta-container button, #profile-incomplete-cta button'
    )
    .forEach(btn => {
      btn.removeAttribute('onclick');
      btn.addEventListener('click', () => {
        document.getElementById('scene-diagnostics')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

  // 4. Footprint 101 Modal Show/Hide
  const btnLearnBasics = document.getElementById('btn-learn-basics');
  if (btnLearnBasics) {
    btnLearnBasics.removeAttribute('onclick');
    btnLearnBasics.addEventListener('click', () => {
      window.location.href = 'carbon-footprint-101.html';
    });
  }

  const btnCloseBasics = document.getElementById('btn-close-basics');
  if (btnCloseBasics) {
    btnCloseBasics.removeAttribute('onclick');
    btnCloseBasics.addEventListener('click', () => {
      document.getElementById('basics-modal')?.classList.remove('visible');
    });
  }

  const btnBasicsCta = document.getElementById('btn-basics-cta');
  if (btnBasicsCta) {
    btnBasicsCta.removeAttribute('onclick');
    btnBasicsCta.addEventListener('click', () => {
      document.getElementById('basics-modal')?.classList.remove('visible');
      document.getElementById('scene-diagnostics')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        if (window.App && typeof App.openFeatureModal === 'function') {
          App.openFeatureModal('dashboard');
        }
      }, 800);
    });
  }

  // 5. Modal actions and Feature controls (using Event Delegation)
  document.addEventListener('click', e => {
    // Feature Modals
    const aiChatBtn = e.target.closest('.btn-ai-chat');
    if (aiChatBtn) {
      if (window.App && typeof App.openFeatureModal === 'function') {
        App.openFeatureModal('chat');
      }
    }

    const diagnosticBtn = e.target.closest('#scene-diagnostics .btn');
    if (diagnosticBtn) {
      if (window.App && typeof App.openFeatureModal === 'function') {
        App.openFeatureModal('dashboard');
      }
    }

    const transportBtn = e.target.closest('#scene-transport .btn');
    if (transportBtn) {
      if (window.App && typeof App.openFeatureModal === 'function') {
        App.openFeatureModal('transport');
      }
    }

    const energyBtn = e.target.closest('#scene-energy .btn');
    if (energyBtn) {
      if (window.App && typeof App.openFeatureModal === 'function') {
        App.openFeatureModal('energy');
      }
    }

    const dietBtn = e.target.closest('#scene-food .btn') || e.target.closest('[onclick*="diet"]');
    if (dietBtn) {
      if (window.App && typeof App.openFeatureModal === 'function') {
        App.openFeatureModal('diet');
      }
    }

    const viewDashBtn = e.target.closest('[onclick*="scene-dashboard"]');
    if (viewDashBtn) {
      e.preventDefault();
      document.getElementById('scene-dashboard')?.scrollIntoView({ behavior: 'smooth' });
    }

    const modalClose = e.target.closest('.modal-close-btn');
    if (modalClose) {
      if (window.App && typeof App.closeFeatureModal === 'function') {
        App.closeFeatureModal();
      }
    }

    // Guest Auth
    const guestBtn = e.target.closest('#btn-continue-guest');
    if (guestBtn) {
      if (window.App && typeof App.continueAsGuest === 'function') {
        App.continueAsGuest();
      }
    }

    // AI Drawer Actions
    const overlay = e.target.closest('#ai-drawer-overlay');
    if (overlay) {
      if (window.EcoAI && typeof EcoAI.closeDrawer === 'function') {
        EcoAI.closeDrawer();
      }
    }

    const clearAiBtn = e.target.closest('#btn-clear-ai');
    if (clearAiBtn) {
      if (window.EcoAI && typeof EcoAI.clearChat === 'function') {
        EcoAI.clearChat();
      }
    }

    const closeAiBtn = e.target.closest('#btn-close-ai');
    if (closeAiBtn) {
      if (window.EcoAI && typeof EcoAI.closeDrawer === 'function') {
        EcoAI.closeDrawer();
      }
    }

    const aiSendBtn = e.target.closest('#ai-drawer-send');
    if (aiSendBtn) {
      if (window.EcoAI && typeof EcoAI.send === 'function') {
        EcoAI.send();
      }
    }

    const floatingAiBtn = e.target.closest('#floating-ai-btn');
    if (floatingAiBtn) {
      if (window.EcoAI && typeof EcoAI.toggleDrawer === 'function') {
        EcoAI.toggleDrawer();
      }
    }

    const suggestionChip = e.target.closest('.ai-chip');
    if (suggestionChip) {
      if (window.EcoAI && typeof EcoAI.sendSuggestion === 'function') {
        EcoAI.sendSuggestion(suggestionChip);
      }
    }
  });

  // 6. AI Textarea Keydown and Input resize
  const aiInput = document.getElementById('ai-drawer-input');
  if (aiInput) {
    aiInput.removeAttribute('onkeydown');
    aiInput.removeAttribute('oninput');
    aiInput.addEventListener('keydown', e => {
      if (window.EcoAI && typeof EcoAI.handleKey === 'function') {
        EcoAI.handleKey(e);
      }
    });
    aiInput.addEventListener('input', () => {
      aiInput.style.height = 'auto';
      aiInput.style.height = aiInput.scrollHeight + 'px';
    });
  }

  // Defer background scenery rendering by preloading WebP images as sections approach viewport
  const sections = document.querySelectorAll('.scroll-section');
  if ('IntersectionObserver' in window && sections.length > 0) {
    const bgObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            const bgMap = {
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
            const bgUrl = bgMap[sectionId];
            if (bgUrl) {
              const img = new Image();
              img.src = bgUrl;
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '100px' }
    );
    sections.forEach(sec => bgObserver.observe(sec));
  }

  // Reset Demo button (footer) — clears saved session so the next reload
  // shows the first-time-visitor sign-in gate again. Does not touch any
  // other reset button or storage key beyond what's needed for that.
  const btnResetDemo = document.getElementById('btn-reset-demo');
  if (btnResetDemo) {
    btnResetDemo.addEventListener('click', e => {
      e.preventDefault();
      try {
        localStorage.removeItem('eco_user_session');
      } catch (err) {}
      window.location.reload();
    });
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js')
      .then(reg => console.log('EcoTwin: ServiceWorker registered successfully'))
      .catch(err => console.log('EcoTwin: ServiceWorker registration failed: ', err));
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}
