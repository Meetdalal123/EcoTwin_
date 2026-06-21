const fs = require('fs');
const path = require('path');

describe('Gamification Module', () => {
  let htmlContent;

  beforeAll(() => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  beforeEach(() => {
    jest.resetModules();

    // Set up mock DOM
    document.body.innerHTML = htmlContent;

    // Define window.confetti
    window.confetti = jest.fn();

    // Set up global App object
    global.App = {
      user: {
        xp: 0,
        level: 1,
        rank: 'Carbon Rookie',
        dashboardInputs: {
          quizCompleted: true,
          quizDiet: 'vegan',
          commuteMode: 'bike',
          homeHeating: 'solar',
        },
        xpHistory: [],
        unlockedBadges: [],
      },
      saveSession: jest.fn(),
      updateUserProfileUI: jest.fn(),
      showToast: jest.fn(),
      fireConfetti: jest.fn(),
      isInitializing: false,
    };

    // Load gamification.js
    require('../js/gamification.js');
  });

  test('App.addXp should award XP, save session, update UI and show toast', () => {
    App.addXp(40, 'Completed Quiz');
    expect(App.user.xp).toBe(40);
    expect(App.user.xpHistory[0].text).toBe('✅ Completed Quiz');
    expect(App.saveSession).toHaveBeenCalled();
    expect(App.updateUserProfileUI).toHaveBeenCalled();
    expect(App.showToast).toHaveBeenCalledWith('+40 XP: Completed Quiz 🌟');
  });

  test('App.addXp history limits to 10 entries', () => {
    for (let i = 0; i < 15; i++) {
      App.addXp(5, `Reason ${i}`);
    }
    expect(App.user.xpHistory.length).toBe(10);
    expect(App.user.xpHistory[0].text).toBe('✅ Reason 14');
  });

  test('App.checkLevelUp should level up and update rank when XP >= 100', () => {
    App.addXp(120, 'Big Reward');
    expect(App.user.level).toBe(2);
    expect(App.user.xp).toBe(20);
    expect(App.user.rank).toBe('Carbon Specialist');
    expect(App.fireConfetti).toHaveBeenCalled();
  });

  test('App.checkLevelUp sets Planetary Legend rank for level >= 5', () => {
    App.user.xp = 90;
    App.user.level = 4;
    App.addXp(20, 'Level up to 5');
    expect(App.user.level).toBe(5);
    expect(App.user.rank).toBe('Planetary Legend');
  });

  test('App.checkLevelUp sets Ecosystem Guardian rank for level 3 or 4', () => {
    App.user.xp = 90;
    App.user.level = 2;
    App.addXp(20, 'Level up to 3');
    expect(App.user.level).toBe(3);
    expect(App.user.rank).toBe('Ecosystem Guardian');
  });

  test('App.unlockBadge should add badge and trigger XP award', () => {
    App.unlockBadge('diet', 'Eco Eater', 'Eat plant-based');
    expect(App.user.unlockedBadges).toContain('Eco Eater');
    expect(App.user.xp).toBe(50); // Unlocking badge awards 50 XP
  });

  test('App.unlockBadge initializes unlockedBadges if undefined', () => {
    App.user.unlockedBadges = undefined;
    App.unlockBadge('diet', 'Eco Eater', 'Eat plant-based');
    expect(App.user.unlockedBadges).toContain('Eco Eater');
  });

  test('App.unlockBadge should not duplicate existing badges', () => {
    App.user.unlockedBadges = ['Eco Eater'];
    App.unlockBadge('diet', 'Eco Eater', 'Eat plant-based');
    expect(App.user.xp).toBe(0); // No XP awarded since already unlocked
  });

  test('App.updateAchievements should unlock badges dynamically based on user state', () => {
    // gourmetUnlocked, transitUnlocked, sparkUnlocked should be true based on beforeEach inputs
    App.updateAchievements();

    const badgeRookie = document.getElementById('card-badge-rookie');
    const badgeGourmet = document.getElementById('card-badge-gourmet');
    const badgeTransit = document.getElementById('card-badge-transit');
    const badgeSpark = document.getElementById('card-badge-spark');

    expect(badgeRookie.classList.contains('unlocked')).toBe(true);
    expect(badgeGourmet.classList.contains('unlocked')).toBe(true);
    expect(badgeTransit.classList.contains('unlocked')).toBe(true);
    expect(badgeSpark.classList.contains('unlocked')).toBe(true);
  });

  test('App.updateAchievements lock evaluation is working', () => {
    App.user.dashboardInputs = {
      quizCompleted: true,
      quizDiet: 'meat-lover', // locks gourmet
      commuteMode: 'car', // locks transit
      homeHeating: 'gas', // locks spark
    };
    App.user.level = 1; // locks guardian & legend
    App.updateAchievements();

    const badgeGourmet = document.getElementById('card-badge-gourmet');
    const badgeTransit = document.getElementById('card-badge-transit');
    const badgeSpark = document.getElementById('card-badge-spark');
    const badgeGuardian = document.getElementById('card-badge-guardian');
    const badgeLegend = document.getElementById('card-badge-legend');

    expect(badgeGourmet.classList.contains('locked')).toBe(true);
    expect(badgeTransit.classList.contains('locked')).toBe(true);
    expect(badgeSpark.classList.contains('locked')).toBe(true);
    expect(badgeGuardian.classList.contains('locked')).toBe(true);
    expect(badgeLegend.classList.contains('locked')).toBe(true);
  });

  test('App.updateAchievements checks savedDiet gourmet locks options', () => {
    // gourmetUnlocked via savedDiet
    localStorage.setItem(
      'eco_diet_calculator',
      JSON.stringify({
        redMeat: 0,
        lunch: 0.6,
      })
    );

    App.user.dashboardInputs = {
      quizCompleted: false,
    };

    App.updateAchievements();
    const badgeGourmet = document.getElementById('card-badge-gourmet');
    expect(badgeGourmet.classList.contains('unlocked')).toBe(true);

    // gourmetUnlocked fails if redMeat > 0
    localStorage.setItem(
      'eco_diet_calculator',
      JSON.stringify({
        redMeat: 2,
        lunch: 0.6,
      })
    );
    App.updateAchievements();
    expect(document.getElementById('card-badge-gourmet').classList.contains('locked')).toBe(true);

    // gourmetUnlocked fails if savedDiet is invalid json
    localStorage.setItem('eco_diet_calculator', 'invalid-json');
    expect(() => App.updateAchievements()).not.toThrow();
  });

  test('App.updateAchievements triggers animation timeout and confetti', () => {
    jest.useFakeTimers();

    // Rookie card starts as locked
    const rookieCard = document.getElementById('card-badge-rookie');
    rookieCard.className = 'badge-card locked';

    App.isInitializing = false;
    App.updateAchievements();

    expect(rookieCard.classList.contains('badge-unlock-anim')).toBe(true);
    expect(window.confetti).toHaveBeenCalled();

    // Fast-forward animation timeout
    jest.advanceTimersByTime(2500);
    expect(rookieCard.classList.contains('badge-unlock-anim')).toBe(false);

    jest.useRealTimers();
  });

  test('App.initWeeklyChallenge should populate title, desc and handle clicks', () => {
    const titleEl = document.getElementById('challenge-title');
    const descEl = document.getElementById('challenge-desc');
    const btnComplete = document.getElementById('btn-complete-challenge');

    expect(titleEl).not.toBeNull();
    expect(descEl).not.toBeNull();
    expect(btnComplete).not.toBeNull();

    App.initWeeklyChallenge();

    expect(titleEl.textContent).not.toBe('');
    expect(descEl.textContent).not.toBe('');

    // Simulate click
    btnComplete.click();

    expect(App.user.xp).toBe(25);
    expect(btnComplete.disabled).toBe(true);
    expect(btnComplete.textContent).toBe('Challenge Completed! 🎉');
  });

  test('App.initWeeklyChallenge handles completed week check with and without global.Utils defined', () => {
    const btnComplete = document.getElementById('btn-complete-challenge');

    // Setup Utils mock
    global.Utils = {
      storage: {
        getItem: jest.fn(() => '0'),
        setItem: jest.fn(),
      },
    };

    // Force week calculation to 0 by mocking Date.now
    const realDateNow = Date.now;
    Date.now = () => 0;

    App.initWeeklyChallenge();
    expect(btnComplete.disabled).toBe(true);
    expect(global.Utils.storage.getItem).toHaveBeenCalledWith('eco_challenge_completed_week');

    // Simulate click calls setItem
    btnComplete.disabled = false;
    btnComplete.click();
    expect(global.Utils.storage.setItem).toHaveBeenCalledWith('eco_challenge_completed_week', '0');

    // Restore
    Date.now = realDateNow;
    delete global.Utils;
  });

  test('App.addXp awards XP and uses fallback text when Reason is missing/falsy', () => {
    // Call without reason
    App.addXp(10);
    expect(App.user.xp).toBe(10);
    expect(App.user.xpHistory[0].text).toBe('✅ Earned XP');
    expect(App.showToast).not.toHaveBeenCalled();

    // Call with empty reason
    App.addXp(10, '');
    expect(App.user.xp).toBe(20);
    expect(App.user.xpHistory[0].text).toBe('✅ Earned XP');
  });

  test('App.updateAchievements handles undefined confetti gracefully', () => {
    const originalConfetti = window.confetti;
    delete window.confetti;
    global.confetti = undefined;

    // Trigger unlock of rookie badge (lock first, then run update)
    const rookieCard = document.getElementById('card-badge-rookie');
    if (rookieCard) rookieCard.className = 'badge-card locked';

    App.isInitializing = false;
    expect(() => App.updateAchievements()).not.toThrow();

    window.confetti = originalConfetti;
    global.confetti = originalConfetti;
  });

  test('App.initWeeklyChallenge handles undefined confetti gracefully', () => {
    const originalConfetti = window.confetti;
    delete window.confetti;
    global.confetti = undefined;

    const btnComplete = document.getElementById('btn-complete-challenge');
    btnComplete.disabled = false;
    expect(() => btnComplete.click()).not.toThrow();

    window.confetti = originalConfetti;
    global.confetti = originalConfetti;
  });

  test('App.updateAchievements handles missing status tag and icon elements gracefully', () => {
    // Empty the status tags and icons from cards to test null branch
    const rookieCard = document.getElementById('card-badge-rookie');
    if (rookieCard) {
      rookieCard.innerHTML = ''; // strip all children
    }

    App.isInitializing = false;
    expect(() => App.updateAchievements()).not.toThrow();
  });

  test('App.updateAchievements handles missing badgeCard element in DOM', () => {
    // Remove rookie badge cards completely
    const card1 = document.getElementById('badge-rookie');
    if (card1) card1.parentNode.removeChild(card1);
    const card2 = document.getElementById('card-badge-rookie');
    if (card2) card2.parentNode.removeChild(card2);

    expect(() => App.updateAchievements()).not.toThrow();
  });
});
