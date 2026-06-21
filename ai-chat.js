/**
 * EcoTwin AI Chat Module (ai-chat.js)
 * ====================================
 * Contains local chatbot logic, IPC-aligned query handling rules,
 * status indicator updates, and the persistent EcoAI drawer.
 */

App.initMainChat = function () {
  // The floating AI button now opens the EcoAI drawer (handled by EcoAI module).
  // The scene-chat section still has its own inline chat for users who scroll to it.
  const msgContainer = document.getElementById('main-chat-messages-container');
  const userInput = document.getElementById('main-chat-user-input');
  const sendBtn = document.getElementById('main-chat-send-btn');

  if (!msgContainer || !userInput || !sendBtn) return;

  const appendMsg = (text, sender) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '0.75rem';
    wrapper.style.maxWidth = '85%';

    if (sender === 'user') {
      wrapper.style.alignSelf = 'flex-end';
      wrapper.style.flexDirection = 'row-reverse';
    } else {
      wrapper.style.alignSelf = 'flex-start';
    }

    const avatarImg = document.createElement('img');
    avatarImg.alt = sender === 'user' ? 'User avatar' : 'EcoTwin AI avatar';
    avatarImg.style.width = '32px';
    avatarImg.style.height = '32px';
    avatarImg.style.borderRadius = '50%';
    avatarImg.style.objectFit = 'cover';
    avatarImg.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    avatarImg.style.flexShrink = '0';

    if (sender === 'user') {
      const sidebarAvatarImg = document.querySelector('#db-sidebar-avatar img');
      if (sidebarAvatarImg && sidebarAvatarImg.src) {
        avatarImg.src = sidebarAvatarImg.src;
      } else {
        avatarImg.src =
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2306b6d4" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
      }
    } else {
      avatarImg.src = 'assets/eco_ai_avatar.webp';
    }
    wrapper.appendChild(avatarImg);

    const div = document.createElement('div');
    div.className = `chat-message ${sender}`;
    div.style.cssText = `padding:0.85rem 1.25rem;border-radius:16px;font-size:0.9rem;line-height:1.5;${sender === 'user' ? 'background:rgba(6,182,212,0.07);border:1px solid rgba(6,182,212,0.2);border-top-right-radius:2px;' : 'background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-top-left-radius:2px;'}`;
    div.textContent = text;
    wrapper.appendChild(div);
    msgContainer.appendChild(wrapper);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  };

  const handleSend = () => {
    const query = userInput.value.trim();
    if (!query) return;
    appendMsg(query, 'user');
    userInput.value = '';
    setTimeout(() => {
      appendMsg(EcoAI.getReply(query), 'system');
    }, 850);
  };

  sendBtn.addEventListener('click', handleSend);
  userInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleSend();
  });
};

/* ============================================================
   EcoAI — Top-Level AI Assistant Module
   Persistent slide-in drawer with contextual intelligence
   ============================================================ */
const EcoAI = {
  isOpen: false,
  history: [],
  firstOpen: true,

  init() {
    // Re-initialise Lucide icons for the drawer elements
    if (typeof lucide !== 'undefined') lucide.createIcons();
    this._injectWelcome();
  },

  // ── Drawer Control ────────────────────────────────────────
  toggleDrawer() {
    this.isOpen ? this.closeDrawer() : this.openDrawer();
  },

  openDrawer() {
    const drawer = document.getElementById('ai-drawer');
    const overlay = document.getElementById('ai-drawer-overlay');
    const fab = document.getElementById('floating-ai-btn');
    const unreadDot = document.getElementById('fab-unread-dot');
    if (!drawer) return;
    drawer.classList.add('open');
    overlay.classList.add('open');
    if (unreadDot) unreadDot.style.display = 'none';
    if (fab) fab.style.animation = 'none'; // stop pulsing when open
    this.isOpen = true;
    this._updateContextBanner();
    // Focus input
    setTimeout(() => {
      const inp = document.getElementById('ai-drawer-input');
      if (inp) inp.focus();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 420);
  },

  closeDrawer() {
    const drawer = document.getElementById('ai-drawer');
    const overlay = document.getElementById('ai-drawer-overlay');
    const fab = document.getElementById('floating-ai-btn');
    if (!drawer) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    if (fab) fab.style.animation = 'aiPulseRing 2.5s ease-in-out infinite';
    this.isOpen = false;
  },

  clearChat() {
    const messages = document.getElementById('ai-drawer-messages');
    if (messages) messages.textContent = '';
    this.history = [];
    this._injectWelcome();
    const suggestions = document.getElementById('ai-suggestions');
    if (suggestions) suggestions.style.display = 'flex';
  },

  // ── Message Handling ──────────────────────────────────────
  send() {
    const inp = document.getElementById('ai-drawer-input');
    if (!inp) return;
    const query = inp.value.trim();
    if (!query) return;
    inp.value = '';
    inp.style.height = 'auto';

    // Hide suggestion chips after first send
    const suggestions = document.getElementById('ai-suggestions');
    if (suggestions) suggestions.style.display = 'none';

    this._appendMsg(query, 'user');
    this._showTyping();

    const delay = 700 + Math.random() * 600;
    setTimeout(() => {
      this._hideTyping();
      const reply = this.getReply(query);
      this._appendMsg(reply, 'ai');
    }, delay);
  },

  handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  },

  sendSuggestion(btn) {
    const inp = document.getElementById('ai-drawer-input');
    if (!inp) return;
    inp.value = btn.textContent.replace(/^[\p{Emoji}\s]+/u, '').trim();
    this.send();
  },

  // ── Intelligence Engine ───────────────────────────────────
  getReply(query) {
    const q = query.toLowerCase();

    // Live data from page
    const scoreEl = document.getElementById('profile-total-score');
    const score = scoreEl ? scoreEl.textContent.trim() : null;
    const hasScore = score && score !== '---' && score !== '';

    // Diet / food
    if (/\b(diet|food|vegan|meat|eat|beef|plant)s?\b/i.test(q)) {
      return '🥩 Food production drives ~26% of global greenhouse gases. Red meat emits ~27 kg CO₂ per kg produced, while lentils or tofu are under 1 kg. Shifting to plant-forward meals 3–4 days a week can slash your dietary footprint by up to 60%. Try pledging a Meatless Monday on the Star Wall — every pledge counts!';
    }

    // Travel
    if (/\b(travel|car|flight|plane|ev|commute|drive|train)s?\b/i.test(q)) {
      return '🚗 Transport Insight: Petrol cars emit ~180 g CO₂/km. Switching to cycling or walking for trips under 5 km removes this entirely. EVs charged from renewable sources drop to ~15–20 g/km. Rail produces ~90% less CO₂ per passenger-mile than short-haul flights — a powerful swap for distances under 600 km.';
    }

    // Energy
    if (/\b(solar|energy|electricity|power|utility|home|heating|cooling|led)s?\b/i.test(q)) {
      return '⚡ Energy Transition: Your home electricity and heating can account for 20–30% of your total footprint. Switching to a certified 100% renewable utility removes grid-carbon dependency by up to 95%. Add smart-thermostat scheduling and LED bulbs to trim demand by another 15–20%, compounding your savings year-on-year.';
    }

    // Score / footprint
    if (/\b(score|footprint|my\s+emissions?|twin|result|total|tonne)s?\b/i.test(q)) {
      if (hasScore) {
        return `📊 Your Carbon Twin score is currently ${score} of CO₂ equivalent per year. The global average is ~4 tonnes; the sustainable target is under 2 tonnes by 2030. Review your Diagnostics breakdown to identify your highest-impact category and tackle it first.`;
      } else {
        return '📊 I don\'t see a completed profile yet. Head to the Diagnostics section (press "Begin" from the Hero screen) to calculate your full Carbon Twin score, then come back and I can give you tailored reduction advice!';
      }
    }

    // Pledges / Star Wall
    if (/\b(pledge|star|wall|constellation|commit)s?\b/i.test(q)) {
      return '🌌 Star Wall: Every pledge you submit pins a star to the live Constellation Map, representing an average 0.8 tonnes of CO₂ saved annually. Collective pledges from the EcoTwin community have already mapped hundreds of tonnes of committed reductions. Make your mark!';
    }

    // Climate policy / targets
    if (/\b(kyoto|paris|cop|target|1\.5|net\s+zero|2050|agreement)s?\b/i.test(q)) {
      return '🌍 Climate Targets: The Paris Agreement sets a ceiling of 1.5°C warming above pre-industrial levels. To stay on track, global emissions must peak before 2025 and fall 43% by 2030, reaching net-zero by 2050. Current national pledges put us on track for 2.5–3°C — which is why individual action like yours genuinely matters.';
    }

    // Shopping / consumption
    if (/\b(shop|buy|cloth|fashion|product|plastic|recycle|waste)s?\b/i.test(q)) {
      return '🛍️ Consumption Footprint: Manufacturing and shipping consumer goods accounts for ~13% of global emissions. Fast fashion alone produces 10% of global CO₂. Choosing second-hand, repairing items, and avoiding single-use plastics can cut your consumption footprint by up to 40%. Quality over quantity is the sustainable mantra.';
    }

    // Water
    if (/\b(water|shower|bath)s?\b/i.test(q)) {
      return '💧 Water Usage: Heating water accounts for ~18% of home energy use. Cutting shower time from 10 to 5 minutes saves ~25 kg CO₂ per month. Installing a low-flow showerhead reduces water heating demand by 25–50%, paying for itself within months while lowering your emissions simultaneously.';
    }

    // Greetings
    if (/\b(hello|hi|hey|help)s?\b/i.test(q) || q.includes('what can you do')) {
      return "👋 Hi there! I'm EcoTwin AI — your personal climate intelligence assistant. I can analyse your carbon score, give you science-backed reduction tips, explain international climate targets, or walk you through any section of this platform. What would you like to explore?";
    }

    // Identity
    if (
      q.includes('who are you') ||
      q.includes('what are you') ||
      q.includes('about you') ||
      q.includes('ecotwin ai')
    ) {
      return "🌱 I'm EcoTwin AI, your embedded Planetary Intelligence Advisor. I synthesise your diagnostic inputs — diet, transport, energy usage, household size — and cross-reference them with IPCC-aligned climate datasets to generate tailored, actionable reduction strategies. Think of me as your always-on sustainability co-pilot.";
    }

    // Default — richer fallback
    const suggestions = [
      'your carbon score',
      'diet and food choices',
      'cleaner transport options',
      'home energy savings',
      'climate targets',
      'pledging on the Star Wall',
    ];
    const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
    return `🌱 Interesting question! For the most impactful results, focus on the highest-emission areas of your lifestyle. Try asking me about ${pick} — or run the full Diagnostics quiz for a personalised breakdown.`;
  },

  // ── Rendering ─────────────────────────────────────────────
  _appendMsg(text, sender) {
    const container = document.getElementById('ai-drawer-messages');
    if (!container) return;

    this.history.push({ sender, text, ts: Date.now() });

    const row = document.createElement('div');
    row.className = 'ai-msg-bubble';
    row.style.cssText = `display:flex; gap:0.6rem; align-items:flex-end; ${
      sender === 'user'
        ? 'flex-direction:row-reverse; align-self:flex-end;'
        : 'align-self:flex-start;'
    } max-width: 88%;`;

    // Avatar
    const av = document.createElement('img');
    av.alt = sender === 'user' ? 'User avatar' : 'EcoTwin AI avatar';
    av.style.cssText =
      'width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,0.1);';
    if (sender === 'user') {
      const sidebarAvatarImg = document.querySelector('#db-sidebar-avatar img');
      av.src =
        sidebarAvatarImg && sidebarAvatarImg.src
          ? sidebarAvatarImg.src
          : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2306b6d4" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    } else {
      av.src = 'assets/eco_ai_avatar.webp';
      av.style.border = '1px solid rgba(52,211,153,0.35)';
    }
    row.appendChild(av);

    // Bubble
    const bubble = document.createElement('div');
    bubble.style.cssText = `padding:0.75rem 1rem; border-radius:16px; font-size:0.855rem; line-height:1.6; white-space:pre-wrap; ${
      sender === 'user'
        ? 'background:rgba(6,182,212,0.09);border:1px solid rgba(6,182,212,0.22);border-top-right-radius:3px;color:#e2f8ff;'
        : 'background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.2);border-top-left-radius:3px;color:#f0faf5;'
    }`;
    bubble.textContent = text;
    row.appendChild(bubble);

    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  },

  _injectWelcome() {
    setTimeout(() => {
      this._appendMsg(
        "Hello! 👋 I'm EcoTwin AI — your personal climate intelligence assistant.\n\nI run entirely offline using IPCC-aligned climate data built into this platform — no internet connection or API key required. I can analyse your carbon profile, give science-backed reduction tips, and answer questions about climate science.\n\nTry one of the suggested prompts below, or ask me anything!",
        'ai'
      );
    }, 120);
  },

  _showTyping() {
    const t = document.getElementById('ai-typing-indicator');
    if (t) t.style.display = 'block';
    const container = document.getElementById('ai-drawer-messages');
    if (container) container.scrollTop = container.scrollHeight;
  },

  _hideTyping() {
    const t = document.getElementById('ai-typing-indicator');
    if (t) t.style.display = 'none';
  },

  _updateContextBanner() {
    const banner = document.getElementById('ai-context-banner');
    const bannerText = document.getElementById('ai-context-text');
    if (!banner || !bannerText) return;

    const scoreEl = document.getElementById('profile-total-score');
    const score = scoreEl ? scoreEl.textContent.trim() : null;
    const hasScore = score && score !== '---' && score !== '';

    if (hasScore) {
      bannerText.textContent = `Context loaded: your Carbon Twin score is ${score}`;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  },
};

window.EcoAI = EcoAI;
document.addEventListener('DOMContentLoaded', () => EcoAI.init());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EcoAI;
  global.EcoAI = EcoAI;
  global.App = App;
}
