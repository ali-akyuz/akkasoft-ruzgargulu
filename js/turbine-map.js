const USER_LOCATION_STORAGE_KEY = 'windora-live-user-coords-v1';

// Default fallback coordinates in KKTC (Lapta / Girne Control Center)
const DEFAULT_KKTC_CENTER = {
  lat: 35.3420,
  lng: 33.1780,
  isLive: false,
  label: 'KKTC Merkez Konum (Lapta / Girne)'
};

// Whole Cyprus overview center & zoom
const CYPRUS_OVERVIEW = {
  lat: 35.28,
  lng: 33.48,
  zoom: 9
};

// WT-01 to WT-19: Verified inland/ridge coordinates across KKTC wind corridors, ordered sequentially WT-01 -> WT-19
const KKTC_TURBINES = [
  { id: 'WT-01', lat: 35.3740, lng: 32.9580, altitude: '185 m', accuracyRate: 99.4, corridor: 'Koruçam – Sadrazamköy Platosu', accessRoute: 'Çamlıbel – Koruçam Sahil Anayolu → Sadrazamköy Batı Servis Yolu', power: 2.64, wind: 9.4, rpm: 16.2, temp: 52.1, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-02', lat: 35.3460, lng: 33.0380, altitude: '310 m', accuracyRate: 99.1, corridor: 'Kayalar – Orga Güney Sırtı', accessRoute: 'Geçitköy Baraj Yolu → Kayalar Güney Sırt Erişim Hattı', power: 2.78, wind: 9.8, rpm: 16.8, temp: 53.4, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-03', lat: 35.3080, lng: 33.0760, altitude: '420 m', accuracyRate: 98.7, corridor: 'Çamlıbel – Hisarköy Rüzgâr Geçidi', accessRoute: 'Güzelyurt – Çamlıbel Anayolu → Hisarköy Dağ Geçidi Servis Yolu', power: 1.84, wind: 8.9, rpm: 14.7, temp: 48.2, status: 'active', statusText: 'Aktif (İletişim Senkronize)' },
  { id: 'WT-04', lat: 35.3180, lng: 33.1580, altitude: '890 m', accuracyRate: 99.6, corridor: 'Lapta – Selvilitepe Ana Sırtı', accessRoute: 'Lapta – Kozan Dağ Yolu → Selvilitepe Radar Sırtı Servis Yolu', power: 2.89, wind: 10.2, rpm: 17.1, temp: 54.0, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-05', lat: 35.3090, lng: 33.2280, altitude: '670 m', accuracyRate: 96.4, corridor: 'Alsancak – Karaman Dağ Hattı', accessRoute: 'Girne Batı Çevre Yolu → Karaman (Karmi) Dağ Servis Yolu', power: 1.36, wind: 8.7, rpm: 12.5, temp: 51.1, status: 'warning', statusText: 'Güç Üretimi Sapması (İnceleniyor)' },
  { id: 'WT-06', lat: 35.1560, lng: 32.7520, altitude: '260 m', accuracyRate: 98.9, corridor: 'Yeşilırmak – Vouni Batı Sırtı', accessRoute: 'Lefke – Gemikonağı Sahil Anayolu → Yeşilırmak Vouni Tepe Yolu', power: 2.68, wind: 9.5, rpm: 16.4, temp: 52.8, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-07', lat: 35.2360, lng: 33.0350, altitude: '245 m', accuracyRate: 99.2, corridor: 'Güzelyurt – Kalkanlı Rüzgâr Sahası', accessRoute: 'Güzelyurt – ODTÜ Kalkanlı Bulvarı → Kalkanlı Kuzey Saha Yolu', power: 2.83, wind: 10.6, rpm: 17.4, temp: 82.4, status: 'critical', statusText: 'Kritik: Jeneratör Sıcaklığı (82,4°C)' },
  { id: 'WT-08', lat: 35.1880, lng: 32.9950, altitude: '190 m', accuracyRate: 98.8, corridor: 'Güzelyurt – Mevlevi Tepe Hattı', accessRoute: 'Lefkoşa – Güzelyurt Çift Şerit Anayolu → Mevlevi Tepe Bağlantısı', power: 2.74, wind: 9.7, rpm: 16.6, temp: 53.9, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-09', lat: 35.2380, lng: 33.2150, altitude: '340 m', accuracyRate: 99.0, corridor: 'Yılmazköy – Gönyeli Kuzey Sırtı', accessRoute: 'Lefkoşa – Güzelyurt Anayolu → Yılmazköy Kuzey Yamaç Yolu', power: 2.55, wind: 9.1, rpm: 15.8, temp: 50.6, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-10', lat: 35.2920, lng: 33.2850, altitude: '580 m', accuracyRate: 99.5, corridor: 'Girne – Boğazköy Rüzgâr Geçidi', accessRoute: 'Lefkoşa – Girne Boğaz Anayolu → St. Hilarion Batı Sırt Yolu', power: 2.95, wind: 10.4, rpm: 17.3, temp: 55.2, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-11', lat: 35.2840, lng: 33.4080, altitude: '780 m', accuracyRate: 98.5, corridor: 'Çatalköy – Buffavento Dağ Sırtı', accessRoute: 'Çatalköy – Arapköy Dağ Yolu → Buffavento Sırt Servis Hattı', power: 2.07, wind: 8.4, rpm: 15.8, temp: 44.7, status: 'active', statusText: 'Aktif (Rutin Bakım Tamamlandı)' },
  { id: 'WT-12', lat: 35.2760, lng: 33.5180, altitude: '740 m', accuracyRate: 95.8, corridor: 'Değirmenlik – Alevkayası Sırtı', accessRoute: 'Değirmenlik – Girne Dağ Yolu → Alevkayası Orman Servis Yolu', power: 2.31, wind: 9.6, rpm: 16.1, temp: 62.8, status: 'warning', statusText: 'Uyarı: Anormal Kule Titreşimi' },
  { id: 'WT-13', lat: 35.2650, lng: 33.6150, altitude: '490 m', accuracyRate: 98.6, corridor: 'Serdarlı – Ergenekon Rüzgâr Geçidi', accessRoute: 'Lefkoşa – Geçitkale Anayolu → Serdarlı Kuzey Geçit Yolu', power: 2.28, wind: 8.5, rpm: 14.9, temp: 49.3, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-14', lat: 35.3120, lng: 33.6650, altitude: '520 m', accuracyRate: 99.1, corridor: 'Esentepe – Beşparmak Doğu Sırtı', accessRoute: 'Girne – Esentepe Sahil Anayolu → Beşparmak Doğu Sırt Yolu', power: 2.79, wind: 9.9, rpm: 16.7, temp: 53.1, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-15', lat: 35.3380, lng: 33.7650, altitude: '540 m', accuracyRate: 96.2, corridor: 'Tatlısu – Mersinlik Dağ Sırtı', accessRoute: 'Tatlısu – Geçitkale Bağlantı Yolu → Mersinlik Sırt Servis Yolu', power: 2.12, wind: 9.3, rpm: 18.9, temp: 58.3, status: 'warning', statusText: 'Uyarı: Rotor Hızı Anomalisi' },
  { id: 'WT-16', lat: 35.3120, lng: 33.8680, altitude: '210 m', accuracyRate: 99.0, corridor: 'Yeni İskele – Topçuköy Platosu', accessRoute: 'İskele – Çayırova Anayolu → Topçuköy Plato Erişim Yolu', power: 2.71, wind: 9.6, rpm: 16.3, temp: 52.0, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-17', lat: 35.3880, lng: 33.9220, altitude: '610 m', accuracyRate: 99.3, corridor: 'Kantara Kalesi Yüksek Sırtı', accessRoute: 'Ardahan – Kaplıca Dağ Yolu → Kantara Yüksek Sırt Servis Yolu', power: 2.44, wind: 8.8, rpm: 15.4, temp: 50.1, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-18', lat: 35.4580, lng: 34.0950, altitude: '230 m', accuracyRate: 98.9, corridor: 'Büyükkonuk – Kumyalı Karpaz Sırtı', accessRoute: 'İskele – Karpaz Anayolu → Büyükkonuk Rüzgâr Sırtı Yolu', power: 2.76, wind: 9.7, rpm: 16.5, temp: 52.7, status: 'active', statusText: 'Aktif Üretimde' },
  { id: 'WT-19', lat: 35.5680, lng: 34.3150, altitude: '195 m', accuracyRate: 99.1, corridor: 'Dipkarpaz – Yeni Erenköy Koridoru', accessRoute: 'Yeni Erenköy – Dipkarpaz Anayolu → Karpaz Doğu Saha Yolu', power: 2.22, wind: 8.3, rpm: 14.6, temp: 48.9, status: 'active', statusText: 'Aktif Üretimde' }
];

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function estimateRoadMetrics(airDistanceKm) {
  const roadKm = Math.max(0.8, airDistanceKm * 1.28);
  const driveMinutes = Math.max(3, Math.round((roadKm / 52) * 60 + 4));
  return { roadKm, driveMinutes };
}

function getGoogleMapsDirectionsUrl(originLat, originLng, destLat, destLng) {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat.toFixed(5)},${originLng.toFixed(5)}&destination=${destLat.toFixed(5)},${destLng.toFixed(5)}&travelmode=driving`;
}

function loadLeafletAssets() {
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.dataset.leafletCss = 'true';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Leaflet yüklenemedi'));
    document.head.appendChild(script);
  });
}

function getTargetUrl(pageName) {
  const isLoggedIn = Boolean(localStorage.getItem('windora-demo-user'));
  if (isLoggedIn) {
    return `./${pageName}`;
  }
  return `./login.html?next=${encodeURIComponent(pageName)}`;
}

export async function initTurbineMap() {
  const mapContainer = document.getElementById('turbineMapCanvas');
  if (!mapContainer) return;

  const statusTextEl = document.getElementById('mapLocationStatusText');
  const locateBtn = document.getElementById('locateUserBtn');
  const cyprusViewBtn = document.getElementById('cyprusOverviewBtn');
  const turbineListEl = document.getElementById('mapTurbineList');
  const selectedTitleEl = document.getElementById('mapSelectedTitle');
  const selectedBadgeEl = document.getElementById('mapSelectedBadge');
  const selectedCoordsEl = document.getElementById('mapSelectedCoords');
  const selectedPowerEl = document.getElementById('mapSelectedPower');
  const selectedWindEl = document.getElementById('mapSelectedWind');
  const selectedTempEl = document.getElementById('mapSelectedTemp');
  const selectedDistanceEl = document.getElementById('mapSelectedDistance');
  const selectedRouteInfoEl = document.getElementById('mapSelectedRouteInfo');
  const actionDirectionsEl = document.getElementById('mapActionDirections');
  const actionSimEl = document.getElementById('mapActionSim');
  const actionFaultEl = document.getElementById('mapActionFault');
  const listCountEl = document.getElementById('mapTurbineCountLabel');

  let userCoords = { ...DEFAULT_KKTC_CENTER };
  try {
    const saved = sessionStorage.getItem(USER_LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
        userCoords = {
          lat: parsed.lat,
          lng: parsed.lng,
          accuracy: parsed.accuracy || null,
          isLive: true,
          label: 'Anlık GPS Konumunuz Aktif'
        };
      }
    }
  } catch {
    // ignore storage errors
  }

  let selectedTurbineId = 'WT-03';
  let activeFilter = 'all';
  let mapInstance = null;
  let userMarker = null;
  let routeLine = null;
  let routeMidpointMarker = null;
  let userAccuracyCircle = null;
  const turbineMarkers = new Map();
  let tileLayers = {};

  function getTurbinesWithCoords() {
    return KKTC_TURBINES.map((item) => {
      const distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, item.lat, item.lng);
      const { roadKm, driveMinutes } = estimateRoadMetrics(distanceKm);
      return {
        ...item,
        distanceKm,
        roadKm,
        driveMinutes
      };
    });
  }

  function buildTurbinePopupHtml(turbine) {
    const gmapsUrl = getGoogleMapsDirectionsUrl(userCoords.lat, userCoords.lng, turbine.lat, turbine.lng);
    const detailUrl = getTargetUrl(`turbulence-detail.html?turbine=${encodeURIComponent(turbine.id)}`);
    return `
      <div style="font-family: Inter, sans-serif; min-width: 248px; line-height: 1.45;">
        <strong style="font-size: 13.5px; color: #18344d;">${turbine.id} · ${turbine.corridor}</strong><br/>
        <span style="font-size: 11.5px; color: #527895;">${turbine.statusText}</span>
        <hr style="border: none; border-top: 1px solid #e5edf4; margin: 6px 0;" />
        <div style="font-size: 11.5px; color: #18344d;">
          <b>Koordinat:</b> ${turbine.lat.toFixed(4)}° K, ${turbine.lng.toFixed(4)}° D<br/>
          <b>Rakım:</b> ${turbine.altitude} &nbsp;|&nbsp; <b>Konum Doğruluğu:</b> %${turbine.accuracyRate.toLocaleString('tr-TR')}<br/>
          <b>Üretim:</b> ${turbine.power.toLocaleString('tr-TR')} MW &nbsp;|&nbsp; <b>Rüzgâr:</b> ${turbine.wind.toLocaleString('tr-TR')} m/s<br/>
          <b>Kuş Uçuşu / Karayolu:</b> ${turbine.distanceKm.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km / ~${turbine.roadKm.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km (~${turbine.driveMinutes} dk)<br/>
          <b>Saha Güzergâhı:</b> <span style="color:#1d5f96;">${turbine.accessRoute}</span>
        </div>
        <div class="map-popup-actions">
          <a class="map-popup-btn primary" href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">
            🗺️ Google Maps Yol Tarifi ↗
          </a>
          <a class="map-popup-btn secondary" href="${detailUrl}">
            🔍 Türbin Detayı
          </a>
        </div>
      </div>
    `;
  }

  function buildRoutePopupHtml(turbine, customRoadKm = null, customMinutes = null) {
    const roadKmVal = customRoadKm ?? turbine.roadKm;
    const driveMinVal = customMinutes ?? turbine.driveMinutes;
    const gmapsUrl = getGoogleMapsDirectionsUrl(userCoords.lat, userCoords.lng, turbine.lat, turbine.lng);
    const originTitle = userCoords.isLive ? 'Anlık Konumunuz' : 'KKTC Kontrol Noktası';
    return `
      <div style="font-family: Inter, sans-serif; min-width: 245px; line-height: 1.48;">
        <strong style="font-size: 13px; color: #18344d;">🚗 Saha Ulaşım &amp; Yol Haritası (${turbine.id})</strong>
        <hr style="border: none; border-top: 1px solid #e5edf4; margin: 6px 0;" />
        <div style="font-size: 11.5px; color: #18344d;">
          <b>Başlangıç:</b> ${originTitle} (${userCoords.lat.toFixed(3)}°K, ${userCoords.lng.toFixed(3)}°D)<br/>
          <b>Hedef Türbin:</b> ${turbine.id} · ${turbine.corridor}<br/>
          <b>Kuş Uçuşu Mesafe:</b> ${turbine.distanceKm.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km<br/>
          <b>Karayolu Mesafesi:</b> ~${roadKmVal.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km · <b>~${driveMinVal} dk sürüş</b><br/>
          <b>Önerilen Rota:</b> <span style="color:#1b5c91;">${turbine.accessRoute}</span>
        </div>
        <div class="map-popup-actions">
          <a class="map-popup-btn primary" href="${gmapsUrl}" target="_blank" rel="noopener noreferrer">
            🗺️ Google Maps'te Yol Tarifi Aç ↗
          </a>
        </div>
      </div>
    `;
  }

  function updateStatusBanner() {
    if (!statusTextEl) return;
    if (userCoords.isLive) {
      const accText = userCoords.accuracy ? ` (±${Math.round(userCoords.accuracy)} m doğruluk)` : '';
      statusTextEl.textContent = `Anlık Konumunuz: ${userCoords.lat.toFixed(4)}° K, ${userCoords.lng.toFixed(4)}° D${accText} · WT-01 – WT-19 Doğrulanmış KKTC Konumları`;
    } else {
      statusTextEl.textContent = `KKTC Saha Görünümü · WT-01 – WT-19 Kara & Sırt Koordinatları Doğrulandı`;
    }
  }

  function updateSelectedCard(turbine) {
    if (!turbine) return;
    if (selectedTitleEl) selectedTitleEl.textContent = `${turbine.id} · ${turbine.corridor}`;
    if (selectedBadgeEl) {
      selectedBadgeEl.className = `map-selected-badge ${turbine.status}`;
      selectedBadgeEl.textContent =
        turbine.status === 'critical' ? 'Kritik Arıza' :
        turbine.status === 'warning' ? 'Uyarı / İnceleme' : 'Aktif';
    }
    if (selectedCoordsEl) {
      selectedCoordsEl.textContent = `📍 ${turbine.lat.toFixed(4)}° K, ${turbine.lng.toFixed(4)}° D · Rakım: ${turbine.altitude} · Doğruluk: %${turbine.accuracyRate.toLocaleString('tr-TR')}`;
    }
    if (selectedPowerEl) selectedPowerEl.textContent = `${turbine.power.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} MW`;
    if (selectedWindEl) selectedWindEl.textContent = `${turbine.wind.toLocaleString('tr-TR', { minimumFractionDigits: 1 })} m/s`;
    if (selectedTempEl) selectedTempEl.textContent = `${turbine.temp.toLocaleString('tr-TR', { minimumFractionDigits: 1 })} °C`;
    if (selectedDistanceEl) {
      selectedDistanceEl.textContent = `~${turbine.roadKm.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km · ~${turbine.driveMinutes} dk`;
    }
    if (selectedRouteInfoEl) {
      selectedRouteInfoEl.textContent = `🚗 Güzergâh: ${turbine.accessRoute} (Kuş uçuşu: ${turbine.distanceKm.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km)`;
    }
    if (actionDirectionsEl) {
      actionDirectionsEl.href = getGoogleMapsDirectionsUrl(userCoords.lat, userCoords.lng, turbine.lat, turbine.lng);
    }

    if (actionSimEl) {
      actionSimEl.href = getTargetUrl('simulasyon-merkezi.html');
    }
    if (actionFaultEl) {
      actionFaultEl.href = getTargetUrl(turbine.status === 'active' ? `turbulence-detail.html?turbine=${encodeURIComponent(turbine.id)}` : 'fault-center.html');
      actionFaultEl.textContent = turbine.status === 'active' ? 'Türbin Detayına Git' : 'Arıza Kaydına Git';
    }
  }

  function renderSidebarList(turbines) {
    if (!turbineListEl) return;
    const filtered = turbines.filter((t) => activeFilter === 'all' || t.status === activeFilter);
    if (listCountEl) {
      listCountEl.textContent = `${filtered.length} / ${turbines.length} TÜRBİN (WT-01 → WT-19)`;
    }

    turbineListEl.innerHTML = filtered
      .map((turbine) => {
        const isSelected = turbine.id === selectedTurbineId;
        return `
          <li class="map-turbine-item ${isSelected ? 'is-selected' : ''}" data-turbine-id="${turbine.id}">
            <div class="map-turbine-item-left">
              <span class="map-turbine-dot ${turbine.status}"></span>
              <div class="map-turbine-item-info">
                <strong>${turbine.id} · <span style="font-weight:600; color:#2b86c5;">~${turbine.roadKm.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km</span></strong>
                <small>${turbine.corridor} (${turbine.altitude})</small>
              </div>
            </div>
            <div class="map-turbine-item-right">
              <strong>${turbine.power.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} MW</strong>
              <small>~${turbine.driveMinutes} dk sürüş</small>
            </div>
          </li>
        `;
      })
      .join('');

    turbineListEl.querySelectorAll('[data-turbine-id]').forEach((itemEl) => {
      itemEl.addEventListener('click', () => {
        selectTurbine(itemEl.dataset.turbineId, true);
      });
    });
  }

  function drawRouteToSelected(turbine) {
    if (!mapInstance || !window.L || !turbine) return;
    const L = window.L;
    if (routeLine) {
      mapInstance.removeLayer(routeLine);
      routeLine = null;
    }

    // Draw interactive route line when within Cyprus region (~150 km)
    if (turbine.distanceKm <= 150) {
      const lineColor = turbine.status === 'critical' ? '#dc2626' : turbine.status === 'warning' ? '#d97706' : '#2563eb';
      const popupHtml = buildRoutePopupHtml(turbine);

      routeLine = L.polyline(
        [
          [userCoords.lat, userCoords.lng],
          [turbine.lat, turbine.lng]
        ],
        {
          color: lineColor,
          weight: 3.5,
          dashArray: '8, 6',
          opacity: 0.86
        }
      )
        .addTo(mapInstance)
        .bindPopup(popupHtml);
    }
  }

  function selectTurbine(turbineId, panToMarker = false) {
    selectedTurbineId = turbineId;
    const turbines = getTurbinesWithCoords();
    const target = turbines.find((t) => t.id === turbineId) || turbines[0];
    updateSelectedCard(target);
    renderSidebarList(turbines);
    drawRouteToSelected(target);

    turbineMarkers.forEach((marker, id) => {
      const el = marker.getElement()?.querySelector('.turbine-map-pin');
      if (el) {
        el.classList.toggle('is-selected', id === selectedTurbineId);
      }
    });

    if (panToMarker && mapInstance && target) {
      mapInstance.flyTo([target.lat, target.lng], Math.max(mapInstance.getZoom(), 11), {
        duration: 0.85
      });
      const marker = turbineMarkers.get(target.id);
      if (marker) marker.openPopup();
    }
  }

  function getUserPopupHtml() {
    const title = userCoords.isLive ? '📍 Sizin Anlık Konumunuz' : '📍 KKTC Merkez Kontrol Noktası';
    const sub = userCoords.isLive
      ? `Tarayıcı Konumu Aktif${userCoords.accuracy ? ` (±${Math.round(userCoords.accuracy)} m)` : ''}`
      : 'Lapta / Girne Rüzgâr Kontrol Noktası';
    return `
      <div style="font-family: Inter, sans-serif; line-height: 1.45;">
        <strong style="font-size: 13.5px; color: #18344d;">${title}</strong><br/>
        <span style="font-size: 12px; color: #2563eb; font-weight: 600;">${sub}</span><br/>
        <small style="color: #527895;">${userCoords.lat.toFixed(5)}° K, ${userCoords.lng.toFixed(5)}° D</small>
      </div>
    `;
  }

  function syncMapMarkers() {
    const turbines = getTurbinesWithCoords();
    const selected = turbines.find((t) => t.id === selectedTurbineId) || turbines[0];
    updateSelectedCard(selected);
    renderSidebarList(turbines);
    updateStatusBanner();

    if (!mapInstance || !window.L) return;
    const L = window.L;

    if (userMarker) {
      userMarker.setLatLng([userCoords.lat, userCoords.lng]);
      userMarker.setPopupContent(getUserPopupHtml());
    } else {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div class="user-location-pin"><span class="user-location-pulse"></span><span class="user-location-core"></span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(mapInstance)
        .bindPopup(getUserPopupHtml());
    }

    const circleRadius = userCoords.accuracy && userCoords.accuracy > 50 ? Math.min(userCoords.accuracy, 3000) : 1800;
    if (userAccuracyCircle) {
      userAccuracyCircle.setLatLng([userCoords.lat, userCoords.lng]);
      userAccuracyCircle.setRadius(circleRadius);
    } else {
      userAccuracyCircle = L.circle([userCoords.lat, userCoords.lng], {
        radius: circleRadius,
        color: '#2563eb',
        weight: 1.5,
        fillColor: '#69b9f3',
        fillOpacity: 0.08,
        dashArray: '6, 6'
      }).addTo(mapInstance);
    }

    turbineMarkers.forEach((marker) => mapInstance.removeLayer(marker));
    turbineMarkers.clear();

    turbines.forEach((turbine) => {
      if (activeFilter !== 'all' && turbine.status !== activeFilter) return;

      const pinIcon = L.divIcon({
        className: 'custom-turbine-marker',
        html: `
          <div class="turbine-map-pin ${turbine.id === selectedTurbineId ? 'is-selected' : ''}">
            <div class="turbine-pin-bubble ${turbine.status}">
              <span>${turbine.id}</span>
            </div>
            <div class="turbine-pin-anchor-dot ${turbine.status}"></div>
          </div>
        `,
        iconSize: [56, 28],
        iconAnchor: [28, 26],
        popupAnchor: [0, -24]
      });

      const marker = L.marker([turbine.lat, turbine.lng], { icon: pinIcon })
        .addTo(mapInstance)
        .bindPopup(buildTurbinePopupHtml(turbine));

      marker.on('click', () => {
        selectTurbine(turbine.id, false);
      });

      turbineMarkers.set(turbine.id, marker);
    });

    drawRouteToSelected(selected);
  }

  function requestLiveUserLocation(flyToUser = true) {
    if (!('geolocation' in navigator)) {
      if (statusTextEl) {
        statusTextEl.textContent = 'Tarayıcınız konum servisini desteklemiyor · KKTC saha konumu gösteriliyor';
      }
      return;
    }

    locateBtn?.classList.add('is-loading');
    if (statusTextEl) {
      statusTextEl.textContent = 'Anlık konumunuz ve doğruluk payı hesaplanıyor...';
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        locateBtn?.classList.remove('is-loading');
        userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isLive: true,
          label: 'Anlık GPS Konumunuz Aktif'
        };

        try {
          sessionStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(userCoords));
        } catch {
          // ignore
        }

        syncMapMarkers();
        if (mapInstance && flyToUser) {
          mapInstance.flyTo([userCoords.lat, userCoords.lng], 12, { duration: 1.2 });
          userMarker?.openPopup();
        }
      },
      () => {
        locateBtn?.classList.remove('is-loading');
        updateStatusBanner();
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000
      }
    );
  }

  // Bind Filter & Layer Controls
  document.querySelectorAll('[data-map-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.mapFilter || 'all';
      document.querySelectorAll('[data-map-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      syncMapMarkers();
    });
  });

  locateBtn?.addEventListener('click', () => {
    requestLiveUserLocation(true);
  });

  cyprusViewBtn?.addEventListener('click', () => {
    if (!mapInstance) return;
    mapInstance.flyTo([CYPRUS_OVERVIEW.lat, CYPRUS_OVERVIEW.lng], CYPRUS_OVERVIEW.zoom, { duration: 1.1 });
  });

  syncMapMarkers();

  try {
    const L = await loadLeafletAssets();
    mapInstance = L.map(mapContainer, {
      center: [CYPRUS_OVERVIEW.lat, CYPRUS_OVERVIEW.lng],
      zoom: CYPRUS_OVERVIEW.zoom,
      scrollWheelZoom: true
    });
    window.turbineMapInstance = mapInstance;
    window.L = L;
    window.dispatchEvent(new CustomEvent("turbineMapReady", { detail: { map: mapInstance, L } }));

    tileLayers = {
      street: L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=tr&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '© Google Maps · KKTC Rüzgâr Sahası'
      }),
      satellite: L.tileLayer('https://mt1.google.com/vt/lyrs=y&hl=tr&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '© Google Satellite'
      }),
      topo: L.tileLayer('https://mt1.google.com/vt/lyrs=p&hl=tr&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '© Google Terrain'
      })
    };

    tileLayers.street.addTo(mapInstance);

    document.querySelectorAll('[data-map-layer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const layerKey = btn.dataset.mapLayer;
        if (!tileLayers[layerKey]) return;
        Object.values(tileLayers).forEach((layer) => mapInstance.removeLayer(layer));
        tileLayers[layerKey].addTo(mapInstance);
        document.querySelectorAll('[data-map-layer]').forEach((b) => b.classList.toggle('active', b === btn));
      });
    });

    syncMapMarkers();
    requestLiveUserLocation(false);
  } catch (error) {
    console.warn('Harita kütüphanesi yüklenemedi:', error);
    if (statusTextEl) {
      statusTextEl.textContent = 'KKTC Rüzgâr Sahası · Harita çevrimdışı modda';
    }
  }
}
