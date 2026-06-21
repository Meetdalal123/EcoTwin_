/**
 * EcoTwin - Street 2080 Split-Screen Slider Feature
 */

App.initStreet2080Slider = function () {
  const sliderContainer = document.getElementById('street-slider-container');
  const todayImg = document.getElementById('street-img-today');
  const img2080 = document.getElementById('street-img-2080');
  const badge2080 = document.getElementById('street-badge-2080');
  const cityButtons = document.querySelectorAll('#city-selector-group .btn');
  const projButtons = document.querySelectorAll('#projection-selector-group .btn');

  if (!sliderContainer || !todayImg || !img2080) return;

  let activeCity = 'mumbai';
  let activeProj = 'damage';

  const descriptors = {
    mumbai: {
      damage: '2080 (FLOODED)',
      thriving: '2080 (NET ZERO)',
    },
    delhi: {
      damage: '2080 (DESERTIFIED)',
      thriving: '2080 (GREEN CITY)',
    },
    london: {
      damage: '2080 (INUNDATED)',
      thriving: '2080 (RESTORATIVE)',
    },
    tokyo: {
      damage: '2080 (HEAT DROWNED)',
      thriving: '2080 (ECO-TOKYO)',
    },
    newyork: {
      damage: '2080 (SMOG & STORM)',
      thriving: '2080 (GREEN MANHATTAN)',
    },
  };

  const updateImages = () => {
    // Fixed: change extension to .webp to match actual assets
    todayImg.src = `assets/${activeCity}_today.webp`;
    img2080.src = `assets/${activeCity}_2080_${activeProj}.webp`;

    const badgeText = descriptors[activeCity]?.[activeProj] || '2080';
    badge2080.textContent = badgeText;

    // Update alt tags dynamically for accessibility
    const capitalizedCity = activeCity.charAt(0).toUpperCase() + activeCity.slice(1);
    const projLabel =
      activeProj === 'damage'
        ? 'damaged projection with environmental crisis'
        : 'thriving net-zero eco-friendly future';
    todayImg.alt = `${capitalizedCity} today showing current urban landscape`;
    img2080.alt = `${capitalizedCity} in 2080 showing ${projLabel}`;

    if (activeProj === 'damage') {
      badge2080.style.background = 'rgba(244,63,94,0.75)';
      badge2080.style.borderColor = 'rgba(244,63,94,0.35)';
    } else {
      badge2080.style.background = 'rgba(16,185,129,0.75)';
      badge2080.style.borderColor = 'rgba(16,185,129,0.35)';
    }
  };

  cityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      cityButtons.forEach(b => {
        b.classList.remove('active-city-btn');
        b.style.border = '';
        b.style.background = '';
      });
      btn.classList.add('active-city-btn');
      btn.style.border = '1px solid rgba(52, 211, 153, 0.3)';
      btn.style.background = 'rgba(52, 211, 153, 0.1)';
      activeCity = btn.dataset.city;
      updateImages();
    });
  });

  projButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      projButtons.forEach(b => {
        b.classList.remove('active-proj-btn');
        b.style.background = '';
        b.style.borderColor = '';
        b.style.color = '';
      });
      btn.classList.add('active-proj-btn');
      if (btn.dataset.proj === 'damage') {
        btn.style.background = 'linear-gradient(135deg, var(--color-red-light), #be123c)';
        btn.style.borderColor = 'rgba(244,63,94,0.3)';
        btn.style.color = '#fff';
      } else {
        btn.style.background = 'linear-gradient(135deg, var(--color-green-light), #047857)';
        btn.style.borderColor = 'rgba(52,211,153,0.3)';
        btn.style.color = '#fff';
      }
      activeProj = btn.dataset.proj;
      updateImages();
    });
  });

  const updateDimensions = () => {
    const rect = sliderContainer.getBoundingClientRect();
    sliderContainer.style.setProperty('--viewport-width', `${rect.width}px`);
  };

  window.addEventListener('resize', updateDimensions);
  setTimeout(updateDimensions, 100);

  let isDragging = false;
  const handleDrag = e => {
    const rect = sliderContainer.getBoundingClientRect();
    let clientX = e.clientX;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
    }
    let offset = clientX - rect.left;
    offset = Math.max(0, Math.min(rect.width, offset));
    sliderContainer.style.setProperty('--slider-pos', `${offset}px`);
  };

  sliderContainer.addEventListener('mousedown', e => {
    isDragging = true;
    handleDrag(e);
  });

  sliderContainer.addEventListener(
    'touchstart',
    e => {
      isDragging = true;
      handleDrag(e);
    },
    { passive: true }
  );

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    handleDrag(e);
  });

  window.addEventListener(
    'touchmove',
    e => {
      if (!isDragging) return;
      handleDrag(e);
    },
    { passive: true }
  );

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
};
