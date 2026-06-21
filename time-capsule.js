/**
 * EcoTwin - Time Capsule Map Feature
 */

App.initTimeCapsuleMap = function () {
  const composer = document.getElementById('time-capsule-composer');
  const sealBtn = document.getElementById('btn-seal-capsule');

  const capNameInput = document.getElementById('capsule-name');
  const capMsgInput = document.getElementById('capsule-message');
  const capPledgeSelect = document.getElementById('capsule-pledge');
  const capCitySelect = document.getElementById('capsule-city');

  const popup = document.getElementById('map-capsule-popup');
  const popupName = document.getElementById('popup-name');
  const popupCity = document.getElementById('popup-city');
  const popupMsg = document.getElementById('popup-message');
  const popupPledge = document.getElementById('popup-pledge');

  if (!sealBtn) return;

  // Define all predefined city coordinates
  const cityCoords = {
    // India
    mumbai: [19.076, 72.8777],
    delhi: [28.6139, 77.209],
    bengaluru: [12.9716, 77.5946],
    pune: [18.5204, 73.8567],
    // East Asia
    tokyo: [35.6762, 139.6503],
    shanghai: [31.2304, 121.4737],
    seoul: [37.5665, 126.978],
    // Europe
    london: [51.5074, -0.1278],
    berlin: [52.52, 13.405],
    paris: [48.8566, 2.3522],
    stockholm: [59.3293, 18.0686],
    // Americas
    newyork: [40.7128, -74.006],
    toronto: [43.6532, -79.3832],
    rio: [-22.9068, -43.1729],
    // Oceania
    sydney: [-33.8688, 151.2093],
    // Africa & Middle East
    nairobi: [-1.2921, 36.8219],
    dubai: [25.2048, 55.2708],
    cairo: [30.0444, 31.2357],
  };

  // Community seed data
  const capsules = {
    mumbai: [
      {
        name: 'Aarav M.',
        message: 'Pledged to offset 1.2t this year via public transit',
        pledge: 'Cycling or taking electric transit only',
        year: 2080,
      },
    ],
    delhi: [
      {
        name: 'Rohan K.',
        message: 'Solar panels installed — zero grid power bill',
        pledge: 'Powering household grid with clean solar mix',
        year: 2080,
      },
    ],
    bengaluru: [
      {
        name: 'Priya S.',
        message: 'Planted 50 trees this monsoon season',
        pledge: 'Switching to 100% plant-based / veg meals',
        year: 2080,
      },
      {
        name: 'Kiran J.',
        message: 'Composting 100% of kitchen waste at home',
        pledge: 'Reaching zero landfill waste through recycling',
        year: 2080,
      },
    ],
    pune: [
      {
        name: 'Sneha P.',
        message: 'Cycled 1,000 km this year instead of driving',
        pledge: 'Cycling or taking electric transit only',
        year: 2080,
      },
    ],
    tokyo: [
      {
        name: 'Yuki T.',
        message: 'Subway + solar home. My grid bill is now zero.',
        pledge: 'Powering household grid with clean solar mix',
        year: 2080,
      },
    ],
    shanghai: [
      {
        name: 'Chen L.',
        message: 'Smart thermostat dropped my heating bill 40%',
        pledge: 'Powering household grid with clean solar mix',
        year: 2080,
      },
    ],
    seoul: [
      {
        name: 'Jin-ho K.',
        message: 'Repaired 3 appliances instead of buying new ones',
        pledge: 'Reaching zero landfill waste through recycling',
        year: 2080,
      },
    ],
    london: [
      {
        name: 'Oliver G.',
        message: 'Zero single-use plastic at home for 6 months',
        pledge: 'Reaching zero landfill waste through recycling',
        year: 2080,
      },
    ],
    berlin: [
      {
        name: 'Emma W.',
        message: 'Fully plant-based since January — feel great!',
        pledge: 'Switching to 100% plant-based / veg meals',
        year: 2080,
      },
    ],
    paris: [
      {
        name: 'Pierre D.',
        message: 'Train-only travel across Europe this year',
        pledge: 'Cycling or taking electric transit only',
        year: 2080,
      },
    ],
    stockholm: [
      {
        name: 'Lars K.',
        message: 'Geothermal heating installed — no more gas',
        pledge: 'Powering household grid with clean solar mix',
        year: 2080,
      },
    ],
    newyork: [
      {
        name: 'Sarah B.',
        message: 'EV + 100% renewable electricity. Net zero at home.',
        pledge: 'Cycling or taking electric transit only',
        year: 2080,
      },
    ],
    toronto: [
      {
        name: 'Maya T.',
        message: 'Green energy plan activated — saving $80/month',
        pledge: 'Powering household grid with clean solar mix',
        year: 2080,
      },
    ],
    rio: [
      {
        name: 'Isabella S.',
        message: 'Restoring Atlantic Forest corridor near the hills',
        pledge: 'Switching to 100% plant-based / veg meals',
        year: 2080,
      },
    ],
    sydney: [
      {
        name: 'Liam W.',
        message: 'Local organic produce only — no imported food',
        pledge: 'Switching to 100% plant-based / veg meals',
        year: 2080,
      },
    ],
    nairobi: [
      {
        name: 'Amara D.',
        message: 'Community solar microgrid serving 40 households',
        pledge: 'Powering household grid with clean solar mix',
        year: 2080,
      },
    ],
    dubai: [
      {
        name: 'Fatima A.',
        message: 'Solar panels: 80% of home power now renewable',
        pledge: 'Powering household grid with clean solar mix',
        year: 2080,
      },
    ],
    cairo: [
      {
        name: 'Leila H.',
        message: 'Thrift-store only clothing for the whole year',
        pledge: 'Reaching zero landfill waste through recycling',
        year: 2080,
      },
    ],
  };

  // Integrity/Expiry LocalStorage wrapper replacement
  const savedCapsules =
    typeof Utils !== 'undefined'
      ? Utils.storage.getItem('eco_time_capsules')
      : JSON.parse(localStorage.getItem('eco_time_capsules'));
  if (savedCapsules) {
    try {
      const parsed = typeof savedCapsules === 'string' ? JSON.parse(savedCapsules) : savedCapsules;
      Object.keys(parsed).forEach(city => {
        if (!capsules[city]) capsules[city] = [];
        const val = parsed[city];
        if (Array.isArray(val)) {
          val.forEach(item => {
            const exists = capsules[city].some(
              c => c.message === item.message && c.name === item.name
            );
            if (!exists) capsules[city].push(item);
          });
        } else if (val && val.message) {
          const exists = capsules[city].some(c => c.message === val.message && c.name === val.name);
          if (!exists) capsules[city].push(val);
        }

        // If custom coordinate key, register in cityCoords
        if (city.startsWith('custom_')) {
          const parts = city.split('_');
          if (parts.length === 3) {
            const lat = parseFloat(parts[1]);
            const lng = parseFloat(parts[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
              cityCoords[city] = [lat, lng];
            }
          }
        }
      });
    } catch (e) {
      console.error('Error parsing saved capsules:', e);
    }
  }

  const updateLiveCounter = () => {
    const sealedCountEl = document.getElementById('capsules-sealed-count');
    const citiesCountEl = document.getElementById('cities-sealed-count');
    if (sealedCountEl && citiesCountEl) {
      let totalCapsules = 0;
      let totalCities = 0;
      Object.keys(capsules).forEach(city => {
        if (capsules[city].length > 0) {
          totalCapsules += capsules[city].length;
          totalCities++;
        }
      });
      sealedCountEl.textContent = totalCapsules;
      citiesCountEl.textContent = totalCities;
    }
  };
  updateLiveCounter();

  const showPopupForCity = cityKey => {
    const caps = capsules[cityKey];
    if (caps && caps.length > 0) {
      const cap = caps[caps.length - 1];

      // Sanitize fields before injection
      popupName.textContent = cap.name;

      let displayName;
      if (cityKey.startsWith('custom_')) {
        const parts = cityKey.split('_');
        displayName = `Custom (${parseFloat(parts[1]).toFixed(2)}, ${parseFloat(parts[2]).toFixed(2)})`;
      } else {
        displayName = cityKey.replace(/^\w/, c => c.toUpperCase());
      }

      popupCity.textContent = displayName;
      popupMsg.textContent = `"${cap.message}"`;
      popupPledge.textContent = cap.pledge;
      popup.classList.add('active');
    }
  };

  // Initialize Leaflet Map (if Leaflet is loaded)
  if (typeof L === 'undefined') return;

  const map = L.map('time-capsule-leaflet-map', {
    center: [20, 0],
    zoom: 2,
    minZoom: 1,
    maxZoom: 18,
    zoomControl: true,
    attributionControl: true,
  });

  // Save map instance globally for resize adjustments
  window.timeCapsuleMapInstance = map;

  // CartoDB Dark Matter tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map);

  const mapMarkers = {};
  let tempMarker = null;
  let selectedCustomCoords = null;

  const addOrUpdateMarker = (cityKey, coords) => {
    if (mapMarkers[cityKey]) {
      map.removeLayer(mapMarkers[cityKey]);
    }

    const isCustom = cityKey.startsWith('custom');
    const dataCityAttr = isCustom ? 'custom' : cityKey;

    const htmlContent = `<div class="map-node node-active" id="node-${cityKey}" data-city="${dataCityAttr}">
               <span class="map-dot-pulse"></span>
               <div class="map-dot-core"></div>
             </div>`;

    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: typeof Utils !== 'undefined' ? Utils.sanitizeHTML(htmlContent) : htmlContent,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker(coords, { icon: customIcon }).addTo(map);
    mapMarkers[cityKey] = marker;

    // Popup hover events
    marker.on('mouseover', () => {
      showPopupForCity(cityKey);
    });
    marker.on('click', () => {
      showPopupForCity(cityKey);
      if (isCustom) {
        capCitySelect.value = 'custom';
        document.getElementById('custom-lat').textContent = coords[0].toFixed(4);
        document.getElementById('custom-lng').textContent = coords[1].toFixed(4);
        document.getElementById('custom-coords-display').style.display = 'flex';
        selectedCustomCoords = coords;
        if (tempMarker) {
          map.removeLayer(tempMarker);
          tempMarker = null;
        }
      } else {
        capCitySelect.value = cityKey;
        document.getElementById('custom-coords-display').style.display = 'none';
      }
    });
    marker.on('mouseout', () => {
      popup.classList.remove('active');
    });
  };

  // Plot all default & saved custom markers
  Object.keys(cityCoords).forEach(cityKey => {
    addOrUpdateMarker(cityKey, cityCoords[cityKey]);
  });

  // Hook up Firebase live sync for Time Capsules
  if (window.EcoDb && window.EcoDb.firebaseEnabled) {
    window.EcoDb.syncCapsules(firebaseCapsules => {
      Object.keys(firebaseCapsules).forEach(city => {
        if (!capsules[city]) capsules[city] = [];

        const items = Object.values(firebaseCapsules[city]);
        items.forEach(item => {
          const exists = capsules[city].some(
            c => c.message === item.message && c.name === item.name
          );
          if (!exists) capsules[city].push(item);
        });

        // If custom key, register it in cityCoords
        if (city.startsWith('custom_')) {
          const parts = city.split('_');
          if (parts.length === 3) {
            const lat = parseFloat(parts[1]);
            const lng = parseFloat(parts[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
              cityCoords[city] = [lat, lng];
            }
          }
        }
      });

      // Re-plot updated markers and refresh counters
      updateLiveCounter();
      Object.keys(capsules).forEach(cityKey => {
        if (capsules[cityKey].length > 0 && cityCoords[cityKey]) {
          addOrUpdateMarker(cityKey, cityCoords[cityKey]);
        }
      });
    });
  }

  // Capture clicks on the map for custom locations
  map.on('click', e => {
    const { lat, lng } = e.latlng;
    selectedCustomCoords = [lat, lng];

    // Update dropdown selection
    capCitySelect.value = 'custom';
    document.getElementById('custom-lat').textContent = lat.toFixed(4);
    document.getElementById('custom-lng').textContent = lng.toFixed(4);
    document.getElementById('custom-coords-display').style.display = 'flex';

    // Drop a temporary custom coordinates marker
    if (tempMarker) {
      map.removeLayer(tempMarker);
    }

    const tempHtml = `<div class="map-node node-active" data-city="custom">
               <span class="map-dot-pulse"></span>
               <div class="map-dot-core"></div>
             </div>`;

    const tempIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: typeof Utils !== 'undefined' ? Utils.sanitizeHTML(tempHtml) : tempHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    tempMarker = L.marker(selectedCustomCoords, { icon: tempIcon }).addTo(map);
    map.panTo(selectedCustomCoords);
  });

  // Global location search box logic
  const searchInput = document.getElementById('map-search-input');
  const searchBtn = document.getElementById('btn-map-search');

  const searchFallbackDict = {
    kolkata: [22.5726, 88.3639],
    chennai: [13.0827, 80.2707],
    hyderabad: [17.385, 78.4867],
    bangalore: [12.9716, 77.5946],
    bengaluru: [12.9716, 77.5946],
    mumbai: [19.076, 72.8777],
    delhi: [28.6139, 77.209],
    pune: [18.5204, 73.8567],
    tokyo: [35.6762, 139.6503],
    london: [51.5074, -0.1278],
    newyork: [40.7128, -74.006],
    sydney: [-33.8688, 151.2093],
    rio: [-22.9068, -43.1729],
    paris: [48.8566, 2.3522],
    berlin: [52.52, 13.405],
    cairo: [30.0444, 31.2357],
    moscow: [55.7558, 37.6173],
    beijing: [39.9042, 116.4074],
    capetown: [-33.9249, 18.4241],
  };

  const performSearch = () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    // Check local dictionary fallback first
    const normalizedQuery = query.replace(/\s+/g, '');
    if (searchFallbackDict[normalizedQuery]) {
      const coords = searchFallbackDict[normalizedQuery];
      selectedCustomCoords = coords;
      capCitySelect.value = 'custom';
      document.getElementById('custom-lat').textContent = coords[0].toFixed(4);
      document.getElementById('custom-lng').textContent = coords[1].toFixed(4);
      document.getElementById('custom-coords-display').style.display = 'flex';

      if (tempMarker) {
        map.removeLayer(tempMarker);
      }

      const tempHtml = `<div class="map-node node-active" data-city="custom">
                 <span class="map-dot-pulse"></span>
                 <div class="map-dot-core"></div>
               </div>`;

      const tempIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: typeof Utils !== 'undefined' ? Utils.sanitizeHTML(tempHtml) : tempHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      tempMarker = L.marker(selectedCustomCoords, { icon: tempIcon }).addTo(map);
      map.flyTo(selectedCustomCoords, 6, { duration: 1.5 });
      this.showToast(`📍 Found location: ${searchInput.value.trim()}`);
      return;
    }

    // Query OpenStreetMap Nominatim geocoder API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          selectedCustomCoords = [lat, lon];

          capCitySelect.value = 'custom';
          document.getElementById('custom-lat').textContent = lat.toFixed(4);
          document.getElementById('custom-lng').textContent = lon.toFixed(4);
          document.getElementById('custom-coords-display').style.display = 'flex';

          if (tempMarker) {
            map.removeLayer(tempMarker);
          }

          const tempHtml = `<div class="map-node node-active" data-city="custom">
                     <span class="map-dot-pulse"></span>
                     <div class="map-dot-core"></div>
                   </div>`;

          const tempIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: typeof Utils !== 'undefined' ? Utils.sanitizeHTML(tempHtml) : tempHtml,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          tempMarker = L.marker(selectedCustomCoords, { icon: tempIcon }).addTo(map);
          map.flyTo(selectedCustomCoords, 6, { duration: 1.5 });
          this.showToast(`📍 Found location: ${data[0].display_name.split(',')[0]}`);
        } else {
          this.showToast(`❌ Could not find location: "${searchInput.value.trim()}"`);
        }
      })
      .catch(err => {
        console.error('Geocoding failed:', err);
        this.showToast('❌ Search failed. Check connection or try a different spelling.');
      });
  };

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }

  // Reset button for custom coordinates selection
  const resetCustomCoordsBtn = document.getElementById('btn-reset-custom-coords');
  if (resetCustomCoordsBtn) {
    resetCustomCoordsBtn.addEventListener('click', () => {
      if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
      }
      selectedCustomCoords = null;
      capCitySelect.value = 'mumbai';
      document.getElementById('custom-coords-display').style.display = 'none';
    });
  }

  // Dropdown change listener to sync map view and markers
  capCitySelect.addEventListener('change', () => {
    const val = capCitySelect.value;
    if (val !== 'custom') {
      if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
      }
      selectedCustomCoords = null;
      document.getElementById('custom-coords-display').style.display = 'none';

      if (cityCoords[val]) {
        map.flyTo(cityCoords[val], 4, { duration: 1.2 });
      }
    }
  });

  // Seal and Launch Time Capsule logic
  sealBtn.addEventListener('click', () => {
    const name = capNameInput.value.trim();
    const message = capMsgInput.value.trim();
    const pledge = capPledgeSelect.value;
    const citySelection = capCitySelect.value;

    if (!name || !message || !pledge || !citySelection) {
      this.showToast('Please fill out all fields to seal your time capsule!');
      return;
    }

    let cityKey = citySelection;
    let coords = cityCoords[citySelection];

    if (citySelection === 'custom') {
      if (!selectedCustomCoords) {
        this.showToast('Please click on the map first to select coordinates!');
        return;
      }
      coords = selectedCustomCoords;
      cityKey = `custom_${coords[0].toFixed(4)}_${coords[1].toFixed(4)}`;
      cityCoords[cityKey] = coords;
    }

    if (!capsules[cityKey]) capsules[cityKey] = [];
    const newCap = { name, message, pledge, year: 2080 };
    capsules[cityKey].push(newCap);

    if (typeof Utils !== 'undefined') {
      Utils.storage.setItem('eco_time_capsules', capsules);
    } else {
      localStorage.setItem('eco_time_capsules', JSON.stringify(capsules));
    }

    // Sync new capsule to Firebase if enabled
    if (window.EcoDb && window.EcoDb.firebaseEnabled) {
      window.EcoDb.uploadCapsule(cityKey, newCap);
    }

    composer.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    composer.style.transform = 'scale(0.95)';
    composer.style.opacity = '0.7';

    setTimeout(() => {
      composer.style.transform = '';
      composer.style.opacity = '';

      capNameInput.value = '';
      capMsgInput.value = '';
      capPledgeSelect.value = '';

      // Plot the permanent marker
      addOrUpdateMarker(cityKey, coords);

      // Remove temporary selection marker
      if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
      }

      // Reset display
      selectedCustomCoords = null;
      capCitySelect.value = 'mumbai';
      document.getElementById('custom-coords-display').style.display = 'none';

      this.showToast('🌟 Time Capsule sealed and launched to 2050! Node updated on map.');
      this.addXp(15, 'Time Capsule Sealed');

      // Pan/Fly to the coordinate and trigger the ripple burst
      map.flyTo(coords, 5, { duration: 1.5 });

      setTimeout(() => {
        const marker = mapMarkers[cityKey];
        if (marker) {
          const element = marker.getElement();
          if (element) {
            const node = element.querySelector('.map-node');
            if (node) {
              node.style.transform = 'scale(2.5)';
              node.classList.add('ripple-burst-active');
              setTimeout(() => {
                node.style.transform = '';
                node.classList.remove('ripple-burst-active');
              }, 1200);
            }
          }
        }
      }, 1600);

      updateLiveCounter();
    }, 800);
  });

  // Invalidate map size after initial setup
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
};
