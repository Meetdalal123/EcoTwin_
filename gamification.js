/**
 * EcoTwin Gamification Module (gamification.js)
 * ============================================
 * Handles user experience progression, awarding XP, checking level-ups,
 * and unlocking ecological status badges based on lifestyle commitments.
 */

App.addXp = function (amount, Reason) {
  this.user.xp += amount;

  if (!this.user.xpHistory) this.user.xpHistory = [];
  this.user.xpHistory.unshift({
    text: `✅ ${Reason || 'Earned XP'}`,
    timestamp: Date.now(),
  });
  if (this.user.xpHistory.length > 10) {
    this.user.xpHistory.pop();
  }

  this.checkLevelUp();
  this.saveSession();
  this.updateUserProfileUI();
  if (Reason) {
    this.showToast(`+${amount} XP: ${Reason} 🌟`);
  }
};

App.unlockBadge = function (category, title, desc) {
  if (!this.user.unlockedBadges) {
    this.user.unlockedBadges = [];
  }
  if (!this.user.unlockedBadges.includes(title)) {
    this.user.unlockedBadges.push(title);
    this.addXp(50, `Unlocked Badge: ${title}`);
    this.showToast(`🏆 New Badge: ${title}!`);
    this.updateAchievements();
  }
};

App.checkLevelUp = function () {
  const xpNeeded = 100;
  if (this.user.xp >= xpNeeded) {
    this.user.level += 1;
    this.user.xp = this.user.xp - xpNeeded;

    // Assign Ranks dynamically
    if (this.user.level >= 5) {
      this.user.rank = 'Planetary Legend';
    } else if (this.user.level >= 3) {
      this.user.rank = 'Ecosystem Guardian';
    } else {
      this.user.rank = 'Carbon Specialist';
    }

    this.saveSession();
    this.updateUserProfileUI();
    this.fireConfetti();
    this.showToast(`LEVEL UP! You are now Level ${this.user.level} (${this.user.rank})! 🎉`);
  }
};

App.updateAchievements = function () {
  const lvl = this.user.level;
  const inputs = this.user.dashboardInputs;

  // Evaluate badge locks based on user profile selections and calculated status
  const rookieUnlocked = true; // Level 1 (always unlocked)

  // Green Gourmet: Adopt a Vegan or Vegetarian diet
  let isGourmetFromQuiz = false;
  let savedDiet;
  try {
    savedDiet =
      typeof Utils !== 'undefined'
        ? Utils.storage.getItem('eco_diet_calculator')
        : JSON.parse(localStorage.getItem('eco_diet_calculator') || 'null');
  } catch (e) {}
  if (savedDiet) {
    try {
      const parsed = typeof savedDiet === 'string' ? JSON.parse(savedDiet) : savedDiet;
      if (parsed.redMeat === 0 && (parsed.lunch === 0.6 || parsed.lunch === 1.1)) {
        isGourmetFromQuiz = true;
      }
    } catch (e) {}
  }
  const gourmetUnlocked =
    (inputs.quizCompleted && (inputs.quizDiet === 'vegan' || inputs.quizDiet === 'vegetarian')) ||
    inputs.calcMeat === 'never' ||
    isGourmetFromQuiz;

  // Transit Wizard: Opt for low-emission transport (Biking, Walking, or Metro)
  const transitUnlocked =
    (inputs.quizCompleted &&
      (inputs.commuteMode === 'bike' ||
        inputs.commuteMode === 'walk' ||
        inputs.commuteMode === 'metro' ||
        inputs.commuteMode === 'transit' ||
        inputs.commuteMode === 'remote')) ||
    inputs.calcCommute === 'walk' ||
    inputs.calcCommute === 'transit' ||
    inputs.calcCommute === 'remote';

  // Clean Spark: Subscribe to clean utility renewables
  const sparkUnlocked =
    (inputs.quizCompleted && inputs.homeHeating === 'solar') || inputs.calcEnergyClean === true;

  const guardianUnlocked = lvl >= 3;
  const legendUnlocked = lvl >= 5;

  const updateBadgeUI = (id, isUnlocked) => {
    const targets = [id, `card-${id}`];

    targets.forEach(targetId => {
      const badgeCard = document.getElementById(targetId);
      if (!badgeCard) return;

      const tag = badgeCard.querySelector('.badge-status-tag, .credential-card-status');
      const icon = badgeCard.querySelector('.badge-icon-wrapper, .credential-card-icon');

      if (isUnlocked) {
        if (badgeCard.classList.contains('locked')) {
          // Trigger confetti burst and pulse animation on unlock (only if not initial page load)
          if (!this.isInitializing) {
            badgeCard.classList.add('badge-unlock-anim');
            if (typeof confetti === 'function') {
              confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.7 },
              });
            }
            // Remove the animation class after it completes so it can re-trigger if needed
            setTimeout(() => {
              badgeCard.classList.remove('badge-unlock-anim');
            }, 2400);
          }
        }
        badgeCard.classList.remove('locked');
        badgeCard.classList.add('unlocked');
        badgeCard.style.opacity = '1';
        badgeCard.style.filter = 'none';
        if (tag) {
          tag.textContent = 'Unlocked';
          tag.style.color = 'var(--color-green-light)';
          tag.style.background = 'rgba(52, 211, 153, 0.1)';
        }
        if (icon) {
          icon.style.borderColor = 'var(--color-green-light)';
          icon.style.background = 'rgba(52, 211, 153, 0.1)';
          icon.style.filter = 'drop-shadow(0 0 10px rgba(52,211,153,0.3))';
        }
      } else {
        badgeCard.classList.remove('unlocked');
        badgeCard.classList.add('locked');
        badgeCard.style.opacity = '0.45';
        badgeCard.style.filter = 'grayscale(1)';
        if (tag) {
          tag.textContent = 'Locked';
          tag.style.color = 'var(--text-muted)';
          tag.style.background = 'rgba(255, 255, 255, 0.05)';
        }
        if (icon) {
          icon.style.borderColor = 'var(--text-muted)';
          icon.style.background = 'rgba(255, 255, 255, 0.05)';
          icon.style.filter = 'none';
        }
      }
    });
  };

  updateBadgeUI('badge-rookie', rookieUnlocked);
  updateBadgeUI('badge-gourmet', gourmetUnlocked);
  updateBadgeUI('badge-transit', transitUnlocked);
  updateBadgeUI('badge-spark', sparkUnlocked);
  updateBadgeUI('badge-guardian', guardianUnlocked);
  updateBadgeUI('badge-legend', legendUnlocked);
};

App.initWeeklyChallenge = function () {
  const challenges = [
    {
      id: 1,
      title: 'Meatless Monday',
      desc: 'Swap all meat meals today for plant-based alternatives to reduce agricultural footprint emissions.',
    },
    {
      id: 2,
      title: 'Walk or Cycle to Commute',
      desc: 'Choose active travel for all trips under 5km instead of driving or ordering ride shares.',
    },
    {
      id: 3,
      title: 'Phantom Draw Shutdown',
      desc: 'Locate and switch off all passive utility standby outlets, power strips, and chargers before bed.',
    },
    {
      id: 4,
      title: 'Line Dry Laundry',
      desc: 'Skip the heating tumble dryer entirely and air-dry all clothes on lines today to save 2kg CO2.',
    },
    {
      id: 5,
      title: 'Zero Food Waste Day',
      desc: 'Plan meals carefully, compost organic scraps, and finish all leftovers to prevent landfill methane gases.',
    },
    {
      id: 6,
      title: 'Cold Water Wash',
      desc: 'Run your washing machine on cold water settings. Heating water consumes 90% of laundry energy.',
    },
    {
      id: 7,
      title: 'Unplug Digital Clutter',
      desc: 'Take a 4-hour digital detox. Keeping servers running for idle video streams carries hidden carbon cost.',
    },
    {
      id: 8,
      title: 'Eco Grocery Trip',
      desc: 'Bring reusable tote bags, choose local seasonal fruits, and select items with minimal plastic packaging.',
    },
  ];

  const titleEl = document.getElementById('challenge-title');
  const descEl = document.getElementById('challenge-desc');
  const btnComplete = document.getElementById('btn-complete-challenge');

  if (!titleEl || !descEl || !btnComplete) return;

  // Select challenge based on current calendar week
  const currentWeekIdx = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % challenges.length;
  const activeChallenge = challenges[currentWeekIdx];

  titleEl.textContent = activeChallenge.title;
  descEl.textContent = activeChallenge.desc;

  // Check if already completed this week
  const lastCompletedWeek =
    typeof Utils !== 'undefined'
      ? Utils.storage.getItem('eco_challenge_completed_week')
      : localStorage.getItem('eco_challenge_completed_week');
  if (lastCompletedWeek === String(currentWeekIdx)) {
    btnComplete.disabled = true;
    btnComplete.textContent = 'Challenge Completed! 🎉';
  }

  btnComplete.addEventListener('click', () => {
    // Award XP
    this.addXp(25, 'Completed Weekly Challenge');

    // Disable button
    btnComplete.disabled = true;
    btnComplete.textContent = 'Challenge Completed! 🎉';
    if (typeof Utils !== 'undefined') {
      Utils.storage.setItem('eco_challenge_completed_week', String(currentWeekIdx));
    } else {
      localStorage.setItem('eco_challenge_completed_week', String(currentWeekIdx));
    }

    // Trigger Confetti
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
      });
    }

    this.showToast('Completed! Earned +25 XP!');
  });
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
  global.App = App;
}
