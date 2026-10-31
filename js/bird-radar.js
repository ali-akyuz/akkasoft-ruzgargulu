/**
 * RüzgarGülü - Yapay Zeka Destekli Kuş Göç Radarı & Otonom Kanat Koruma Sistemi
 * Doppler Radar Katmanı, Hareketli Kuş Sürüsü Simülasyonu ve Otonom Kanat Yavaşlatma (Soft Curtailment)
 */

// Kıbrıs Göç Koridoru & Radar Referans Noktası (Girne – Lapta – Beşparmak Hattı)
const RADAR_CENTER = {
  lat: 35.3350,
  lng: 33.2200,
  name: 'Girne – Lapta Kuş Göç Radarı'
};

// Göçmen Sürü Uçuş Rotası (Kullanıcının tam önünden, Girne sahilinden Alsancak, Lapta ve Çamlıbel'e)
const FLIGHT_PATH = [
  { lat: 35.3520, lng: 33.3600 }, // Girne Doğu Sahili
  { lat: 35.3420, lng: 33.3150 }, // Girne Merkez / Kullanıcının tam konumu!
  { lat: 35.3320, lng: 33.2450 }, // Alsancak / WT-05 koridoru
  { lat: 35.3220, lng: 33.1650 }, // Lapta / WT-04 geçişi
  { lat: 35.3100, lng: 33.0850 }, // Çamlıbel / WT-03 geçişi
  { lat: 35.3280, lng: 33.0300 }  // Kayalar & Akdeniz açıklarına güvenli çıkış
];

// Yakındaki Kritik Türbinler
const NEARBY_TURBINES = [
  { id: 'WT-05', name: 'Alsancak – Karaman', lat: 35.3090, lng: 33.2280 },
  { id: 'WT-04', name: 'Lapta – Selvilitepe', lat: 35.3180, lng: 33.1580 },
  { id: 'WT-03', name: 'Çamlıbel – Hisarköy', lat: 35.3080, lng: 33.0760 }
];

// V-Formasyonunda Gerçekçi Kanat Çırpan Kuş Sürüsü SVG
const BIRD_FLOCK_SVG = `
  <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="bird-flock-svg">
    <defs>
      <filter id="birdShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>

    <!-- 1. LİDER KUŞ (Merkez - Gerçekçi Kanat Çırpan Turna) -->
    <g class="bird-lead" filter="url(#birdShadow)" transform="translate(50, 24)">
      <!-- Sol Kanat (Omzu 0, 0'da döner) -->
      <g class="wing-left">
        <path d="M0,0 C-10,-10 -25,-16 -42,-14 C-40,-8 -32,2 -24,8 C-20,6 -16,4 -10,3 C-6,3 -3,1 0,2 Z" fill="#0f172a"/>
        <path d="M-1,-4 C-8,-7 -18,-9 -26,-7 C-18,-2 -10,1 -1,1 Z" fill="#10b981" opacity="0.9"/>
      </g>
      <!-- Sağ Kanat (Omzu 0, 0'da döner) -->
      <g class="wing-right">
        <path d="M0,0 C10,-10 25,-16 42,-14 C40,-8 32,2 24,8 C20,6 16,4 10,3 C6,3 3,1 0,2 Z" fill="#0f172a"/>
        <path d="M1,-4 C8,-7 18,-9 26,-7 C18,-2 10,1 1,1 Z" fill="#10b981" opacity="0.9"/>
      </g>
      <!-- Kafa, Gaga, Gövde ve Yelpaze Kuyruk -->
      <g class="bird-torso">
        <polygon points="0,-16 -2.5,-10 2.5,-10" fill="#f59e0b"/>
        <ellipse cx="0" cy="-8" rx="2.5" ry="4" fill="#1e293b"/>
        <ellipse cx="0" cy="0" rx="3.5" ry="8" fill="#0f172a"/>
        <polygon points="0,6 -6,18 0,16 6,18" fill="#1e293b"/>
      </g>
    </g>

    <!-- 2. SOL ARKA KUŞ -->
    <g class="bird-sub" filter="url(#birdShadow)" transform="translate(24, 46) scale(0.68)">
      <g class="wing-left">
        <path d="M0,0 C-10,-10 -25,-16 -42,-14 C-40,-8 -32,2 -24,8 C-20,6 -16,4 -10,3 C-6,3 -3,1 0,2 Z" fill="#1e293b"/>
        <path d="M-1,-4 C-8,-7 -18,-9 -26,-7 C-18,-2 -10,1 -1,1 Z" fill="#34d399" opacity="0.85"/>
      </g>
      <g class="wing-right">
        <path d="M0,0 C10,-10 25,-16 42,-14 C40,-8 32,2 24,8 C20,6 16,4 10,3 C6,3 3,1 0,2 Z" fill="#1e293b"/>
        <path d="M1,-4 C8,-7 18,-9 26,-7 C18,-2 10,1 1,1 Z" fill="#34d399" opacity="0.85"/>
      </g>
      <g class="bird-torso">
        <polygon points="0,-16 -2.5,-10 2.5,-10" fill="#f59e0b"/>
        <ellipse cx="0" cy="-8" rx="2.5" ry="4" fill="#334155"/>
        <ellipse cx="0" cy="0" rx="3.5" ry="8" fill="#1e293b"/>
        <polygon points="0,6 -6,18 0,16 6,18" fill="#334155"/>
      </g>
    </g>

    <!-- 3. SAĞ ARKA KUŞ -->
    <g class="bird-sub" filter="url(#birdShadow)" transform="translate(76, 46) scale(0.68)">
      <g class="wing-left">
        <path d="M0,0 C-10,-10 -25,-16 -42,-14 C-40,-8 -32,2 -24,8 C-20,6 -16,4 -10,3 C-6,3 -3,1 0,2 Z" fill="#1e293b"/>
        <path d="M-1,-4 C-8,-7 -18,-9 -26,-7 C-18,-2 -10,1 -1,1 Z" fill="#34d399" opacity="0.85"/>
      </g>
      <g class="wing-right">
        <path d="M0,0 C10,-10 25,-16 42,-14 C40,-8 32,2 24,8 C20,6 16,4 10,3 C6,3 3,1 0,2 Z" fill="#1e293b"/>
        <path d="M1,-4 C8,-7 18,-9 26,-7 C18,-2 10,1 1,1 Z" fill="#34d399" opacity="0.85"/>
      </g>
      <g class="bird-torso">
        <polygon points="0,-16 -2.5,-10 2.5,-10" fill="#f59e0b"/>
        <ellipse cx="0" cy="-8" rx="2.5" ry="4" fill="#334155"/>
        <ellipse cx="0" cy="0" rx="3.5" ry="8" fill="#1e293b"/>
        <polygon points="0,6 -6,18 0,16 6,18" fill="#334155"/>
      </g>
    </g>
  </svg>
`;

class BirdMigrationRadar {
  constructor() {
    this.isActive = false;
    this.isPaused = false;
    this.isBeepMuted = false;
    this.map = null;
    this.L = null;
    this.radarLayers = [];
    this.flockMarker = null;
    this.corridorLine = null;
    this.curtailBadgeMarker = null;
    this.curtailCircle = null;
    this.animInterval = null;
    this.pathIndex = 0;
    this.pathProgress = 0;
    this.audioCtx = null;
    this.curtailingTurbine = null;

    this.stats = {
      savedBirds: 142,
      preventedFinesEuro: 45000,
      esgScore: 99.8
    };

    this.init();
  }

  ensureStyles() {
    if (!document.querySelector('link[href*="bird-radar.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './css/bird-radar.css?v=20261101-1';
      document.head.appendChild(link);
    }
  }

  init() {
    this.ensureStyles();
    this.bindToggleButton();
    this.injectHudCard();

    // Leaflet haritasını yakala
    if (window.turbineMapInstance && window.L) {
      this.attachMap(window.turbineMapInstance, window.L);
    } else {
      window.addEventListener('turbineMapReady', (e) => {
        if (e.detail?.map && e.detail?.L) {
          this.attachMap(e.detail.map, e.detail.L);
        }
      });
    }
  }

  attachMap(map, L) {
    this.map = map;
    this.L = L;
  }

  bindToggleButton() {
    let btn = document.getElementById('birdRadarToggleBtn');
    if (!btn) {
      const controls = document.querySelector('.site-map-controls');
      btn = document.createElement('button');
      btn.className = 'bird-radar-toggle-btn';
      btn.id = 'birdRadarToggleBtn';
      btn.type = 'button';
      btn.title = 'Yapay Zeka Destekli Kuş Göç Radarı & Otonom Kanat Koruma';
      btn.innerHTML = `
        <span class="bird-radar-dot"></span>
        <span>🦅 Kuş Göç Radarı</span>
        <span class="bird-radar-badge">AI Koruma</span>
      `;
      if (controls) {
        controls.appendChild(btn);
      } else {
        document.body.appendChild(btn);
      }
    }

    btn.onclick = (e) => {
      e.preventDefault();
      this.toggleRadar();
    };
  }

  injectHudCard() {
    if (document.getElementById('birdRadarHud')) return;

    const wrap = document.querySelector('.site-map-canvas-wrap') || document.body;
    const hud = document.createElement('div');
    hud.className = 'bird-radar-hud';
    hud.id = 'birdRadarHud';
    hud.innerHTML = `
      <div class="bird-radar-hud-header">
        <div class="bird-radar-hud-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Doppler Kuş Radarı (Girne Hattı)</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="bird-radar-live-pill">Canlı Takip</span>
          <button class="bird-close-hud-btn" id="birdCloseHudBtn" type="button" title="Paneli Gizle">✕</button>
        </div>
      </div>

      <!-- Telemetri Grid -->
      <div class="bird-telemetry-grid">
        <div class="bird-telemetry-box">
          <span class="bird-telemetry-label">Algılanan Sürü</span>
          <span class="bird-telemetry-val highlight">Turna (Grus grus)</span>
        </div>
        <div class="bird-telemetry-box">
          <span class="bird-telemetry-label">Sürü Büyüklüğü</span>
          <span class="bird-telemetry-val">~48 Birey</span>
        </div>
        <div class="bird-telemetry-box">
          <span class="bird-telemetry-label">Hız &amp; İrtifa</span>
          <span class="bird-telemetry-val">42 km/s · 125 m</span>
        </div>
        <div class="bird-telemetry-box">
          <span class="bird-telemetry-label">Türbin Devir Durumu</span>
          <span class="bird-telemetry-val alert" id="birdTargetTurbine">WT-05 (16.2 RPM)</span>
        </div>
      </div>

      <!-- Otonom Müdahale Durumu -->
      <div class="bird-action-status-card" id="birdActionCard">
        <div class="bird-action-badge" id="birdActionBadge">
          <span>● RADAR İZLEMEDE</span>
        </div>
        <p class="bird-action-desc" id="birdActionDesc">
          Kuş sürüsü Girne sahil koridorunda izleniyor. Türbin kanatları normal devirde (16.2 RPM).
        </p>
      </div>

      <!-- ESG Biyoçeşitlilik Sayacı -->
      <div class="bird-esg-row">
        <div class="bird-esg-item">Kurtarılan Kuş: <strong id="birdSavedCount">142 Birey</strong></div>
        <div class="bird-esg-item">Önlenen Ceza: <strong id="birdFinesSaved">€45.000</strong></div>
      </div>

      <!-- Butonlar -->
      <div class="bird-hud-actions">
        <button class="bird-sim-btn primary" id="birdFocusBtn" type="button">
          📍 Sürüye Odaklan
        </button>
        <button class="bird-sim-btn" id="birdReplayBtn" type="button">
          ▶️ Yeniden Başlat
        </button>
        <button class="bird-sim-btn" id="birdPauseBtn" type="button">
          ⏸️ Duraklat
        </button>
        <button class="bird-sim-btn" id="birdMuteBeepBtn" type="button">
          🔊 Ses
        </button>
      </div>
    `;

    wrap.appendChild(hud);

    // Leaflet click & scroll propagation'ı engelle
    if (window.L && window.L.DomEvent) {
      window.L.DomEvent.disableClickPropagation(hud);
      window.L.DomEvent.disableScrollPropagation(hud);
    }
    hud.addEventListener('click', (e) => e.stopPropagation());
    hud.addEventListener('mousedown', (e) => e.stopPropagation());

    // 1. Kapat Butonu
    document.getElementById('birdCloseHudBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      hud.classList.remove('is-visible');
    });

    // 2. Sürüye Odaklan Butonu
    const focusBtn = document.getElementById('birdFocusBtn');
    focusBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.focusOnFlock();
      focusBtn.classList.add('is-active');
      const oldHtml = focusBtn.innerHTML;
      focusBtn.innerHTML = '<span>✓ Odaklandı</span>';
      setTimeout(() => {
        focusBtn.classList.remove('is-active');
        focusBtn.innerHTML = oldHtml;
      }, 1200);
    });

    // 3. Yeniden Başlat Butonu
    const replayBtn = document.getElementById('birdReplayBtn');
    replayBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetSimulation();
      this.startFlightSimulation();
      this.focusOnFlock();
      replayBtn.classList.add('is-active');
      const oldHtml = replayBtn.innerHTML;
      replayBtn.innerHTML = '<span>✓ Başlatıldı</span>';
      setTimeout(() => {
        replayBtn.classList.remove('is-active');
        replayBtn.innerHTML = oldHtml;
      }, 1200);
    });

    // 4. Duraklat / Devam Et Butonu
    const pauseBtn = document.getElementById('birdPauseBtn');
    pauseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.stopFlightSimulation();
        pauseBtn.innerHTML = '<span>▶️ Devam Et</span>';
        pauseBtn.classList.add('is-active');
      } else {
        this.animInterval = setInterval(() => this.advanceFlight(), 70);
        pauseBtn.innerHTML = '<span>⏸️ Duraklat</span>';
        pauseBtn.classList.remove('is-active');
      }
    });

    // 5. Ses Butonu
    const muteBtn = document.getElementById('birdMuteBeepBtn');
    muteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isBeepMuted = !this.isBeepMuted;
      muteBtn.textContent = this.isBeepMuted ? '🔇 Sessiz' : '🔊 Ses';
      if (!this.isBeepMuted) {
        this.playRadarBeep(880, 0.12);
      }
    });
  }

  focusOnFlock() {
    if (!this.map) {
      this.map = window.turbineMapInstance;
      this.L = window.L;
    }
    if (!this.map) return;

    const pos = this.flockMarker ? this.flockMarker.getLatLng() : [35.3430, 33.3150];
    this.map.flyTo([pos.lat, pos.lng], 13, { duration: 1.0 });

    if (this.flockMarker) {
      setTimeout(() => {
        try {
          this.flockMarker.openPopup();
        } catch {
          // ignore
        }
      }, 550);
    }
  }

  toggleRadar() {
    if (!this.map) {
      this.map = window.turbineMapInstance;
      this.L = window.L;
    }

    this.isActive = !this.isActive;
    const btn = document.getElementById('birdRadarToggleBtn');
    btn?.classList.toggle('is-active', this.isActive);

    const hud = document.getElementById('birdRadarHud');

    if (this.isActive) {
      hud?.classList.add('is-visible');
      this.enableRadarLayers();
      this.startFlightSimulation();
      this.playRadarBeep(880, 0.08);

      const mapCanvas = document.getElementById('turbineMapCanvas');
      mapCanvas?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => this.focusOnFlock(), 300);
    } else {
      hud?.classList.remove('is-visible');
      this.disableRadarLayers();
      this.stopFlightSimulation();
    }
  }

  enableRadarLayers() {
    if (!this.map) {
      this.map = window.turbineMapInstance;
      this.L = window.L;
    }
    if (!this.map || !this.L) return;

    this.disableRadarLayers();

    // 1. Doppler Radar Menzil Halkaları
    const rings = [
      { radius: 12000, color: '#10b981', weight: 1.2, dash: '4, 8', opacity: 0.35, label: '12 km Dış Erken Uyarı' },
      { radius: 6000, color: '#34d399', weight: 1.5, dash: '3, 6', opacity: 0.5, label: '6 km Radar Yaklaşım' },
      { radius: 2500, color: '#f59e0b', weight: 2, dash: '2, 4', opacity: 0.8, label: '2.5 km Otonom Kanat Müdahale Alanı' }
    ];

    rings.forEach((r) => {
      const circle = this.L.circle([RADAR_CENTER.lat, RADAR_CENTER.lng], {
        radius: r.radius,
        color: r.color,
        dashArray: r.dash,
        weight: r.weight,
        fillColor: r.color,
        fillOpacity: 0.03,
        interactive: false
      }).addTo(this.map);
      this.radarLayers.push(circle);
    });

    // 2. Radar İstasyon Noktası
    const radarCenterMarker = this.L.circleMarker([RADAR_CENTER.lat, RADAR_CENTER.lng], {
      radius: 7,
      color: '#10b981',
      fillColor: '#34d399',
      fillOpacity: 0.95,
      weight: 2.5
    }).addTo(this.map);
    radarCenterMarker.bindTooltip('🦅 Girne – Lapta Kuş Göç Radarı (Doppler Aktif)', { direction: 'top' });
    this.radarLayers.push(radarCenterMarker);

    // 3. Göç Uçuş Koridoru Çizgisi (Yeşil Dalga)
    this.corridorLine = this.L.polyline(FLIGHT_PATH.map((p) => [p.lat, p.lng]), {
      color: '#10b981',
      weight: 3.5,
      opacity: 0.75,
      dashArray: '8, 8',
      className: 'bird-corridor-line'
    }).addTo(this.map);
    this.radarLayers.push(this.corridorLine);

    // 4. Uçan Kuş Sürüsü Özel Leaflet Markerı (Kanat Çırpan Gerçekçi Turna)
    const flockIcon = this.L.divIcon({
      className: 'bird-flock-leaflet-icon',
      html: `
        <div class="bird-flock-svg-wrap">
          <div class="bird-sonar-pulse"></div>
          ${BIRD_FLOCK_SVG}
          <span class="bird-flock-label">🦅 Turna Sürüsü (~48)</span>
        </div>
      `,
      iconSize: [88, 76],
      iconAnchor: [44, 38]
    });

    const startPos = FLIGHT_PATH[0];
    this.flockMarker = this.L.marker([startPos.lat, startPos.lng], { icon: flockIcon, zIndexOffset: 2000 }).addTo(this.map);
    this.flockMarker.bindPopup(`
      <div style="font-family:sans-serif; min-width:200px; padding:4px;">
        <strong style="color:#059669; font-size:0.9rem;">🦅 Göçmen Turna Sürüsü (Grus grus)</strong><br/>
        <small style="color:#64748b;">IUCN Kırmızı Liste · Koruma Altında</small>
        <hr style="border:none; border-top:1px solid #e2e8f0; margin:6px 0;"/>
        <div style="font-size:0.78rem; line-height:1.6;">
          • <strong>Birey:</strong> ~48 Kuş<br/>
          • <strong>Hız:</strong> 42 km/saat<br/>
          • <strong>İrtifa:</strong> 125 metre (Kanat yüksekliği)<br/>
          • <strong>AI Çarpışma Önleme:</strong> Aktif (Türbin Yavaşlatma)
        </div>
      </div>
    `);
    this.radarLayers.push(this.flockMarker);
  }

  disableRadarLayers() {
    this.radarLayers.forEach((layer) => {
      try {
        this.map?.removeLayer(layer);
      } catch {
        // ignore
      }
    });
    this.radarLayers = [];
    this.flockMarker = null;
    this.corridorLine = null;
    this.clearCurtailMarker();
  }

  startFlightSimulation() {
    this.stopFlightSimulation();
    this.pathIndex = 0;
    this.pathProgress = 0;
    this.isPaused = false;

    this.animInterval = setInterval(() => {
      this.advanceFlight();
    }, 70);
  }

  stopFlightSimulation() {
    if (this.animInterval) {
      clearInterval(this.animInterval);
      this.animInterval = null;
    }
  }

  resetSimulation() {
    this.stopFlightSimulation();
    this.pathIndex = 0;
    this.pathProgress = 0;
    this.isPaused = false;
    this.restoreTurbineNormal();

    // Kuşu başlangıç koordinatına al
    if (this.flockMarker) {
      this.flockMarker.setLatLng([FLIGHT_PATH[0].lat, FLIGHT_PATH[0].lng]);
    }
  }

  advanceFlight() {
    if (!this.flockMarker || !this.map) return;

    this.pathProgress += 0.012;
    if (this.pathProgress >= 1) {
      this.pathProgress = 0;
      this.pathIndex++;
      if (this.pathIndex >= FLIGHT_PATH.length - 1) {
        this.pathIndex = 0;
        this.onFlockSafePassed();
      }
    }

    const p1 = FLIGHT_PATH[this.pathIndex];
    const p2 = FLIGHT_PATH[this.pathIndex + 1];
    if (!p1 || !p2) return;

    const currentLat = p1.lat + (p2.lat - p1.lat) * this.pathProgress;
    const currentLng = p1.lng + (p2.lng - p1.lng) * this.pathProgress;

    this.flockMarker.setLatLng([currentLat, currentLng]);

    // En yakın türbini bul
    let nearestTurbine = null;
    let minDist = 999;

    NEARBY_TURBINES.forEach((t) => {
      const d = this.getDistanceKm(currentLat, currentLng, t.lat, t.lng);
      if (d < minDist) {
        minDist = d;
        nearestTurbine = t;
      }
    });

    this.handleProximity(nearestTurbine, minDist);
  }

  getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  handleProximity(turbine, distKm) {
    const actionCard = document.getElementById('birdActionCard');
    const badge = document.getElementById('birdActionBadge');
    const desc = document.getElementById('birdActionDesc');
    const target = document.getElementById('birdTargetTurbine');

    // Türbine 1.8 km yaklaştığında Otonom Kanat Yavaşlatma başlar
    if (distKm <= 1.8 && turbine) {
      if (this.curtailingTurbine !== turbine.id) {
        this.curtailingTurbine = turbine.id;
        this.playRadarBeep(659.25, 0.15); // E5 Beep

        // Harita üzerine türbin yavaşlama rozeti koy
        this.showTurbineCurtailOnMap(turbine);
      }

      actionCard?.classList.add('is-curtailing');
      if (badge) {
        badge.innerHTML = `<span>⚠️ ${turbine.id} OTONOM YAVAŞLATILDI (SOFT CURTAILMENT)</span>`;
      }
      if (desc) {
        const meters = Math.round(distKm * 1000);
        desc.innerHTML = `
          <strong>${turbine.id} (${turbine.name}) Mesafesi: ${meters}m</strong>.<br/>
          🛑 <strong>TÜRBİN YAVAŞLADI:</strong> Rotor devri <strong>16.2 RPM ➔ 1.8 RPM</strong>'e düşürüldü (%89 frenleme). Kanat açısı: <strong>+84° Bayraklandı</strong>. Kuş sürüsü güvenle geçiyor.
        `;
      }
      if (target) {
        target.innerHTML = `<span style="color:#ef4444; font-weight:800;">🛑 ${turbine.id}: 1.8 RPM</span>`;
      }
    } else if (distKm > 1.8 && this.curtailingTurbine) {
      this.restoreTurbineNormal();
    }
  }

  showTurbineCurtailOnMap(turbine) {
    if (!this.map || !this.L) return;

    this.clearCurtailMarker();

    // 1. Türbin üstü animasyonlu rozet
    const slowBadge = this.L.divIcon({
      className: 'turbine-curtailed-leaflet-badge',
      html: `
        <div class="turbine-curtail-hud-pill">
          <span class="curtail-icon">🛑</span>
          <div class="curtail-text">
            <strong>${turbine.id} YAVAŞLATILDI</strong>
            <small>16.2 RPM ➔ 1.8 RPM (Kuş Geçişi)</small>
          </div>
        </div>
      `,
      iconSize: [170, 42],
      iconAnchor: [85, 45]
    });

    this.curtailBadgeMarker = this.L.marker([turbine.lat, turbine.lng], { icon: slowBadge, zIndexOffset: 2500 }).addTo(this.map);

    // 2. Türbin etrafı güvenlik halkası
    this.curtailCircle = this.L.circle([turbine.lat, turbine.lng], {
      radius: 1200,
      color: '#f59e0b',
      dashArray: '5, 5',
      weight: 2,
      fillColor: '#fbbf24',
      fillOpacity: 0.16
    }).addTo(this.map);
  }

  clearCurtailMarker() {
    if (this.curtailBadgeMarker && this.map) {
      try { this.map.removeLayer(this.curtailBadgeMarker); } catch {}
      this.curtailBadgeMarker = null;
    }
    if (this.curtailCircle && this.map) {
      try { this.map.removeLayer(this.curtailCircle); } catch {}
      this.curtailCircle = null;
    }
  }

  restoreTurbineNormal() {
    this.curtailingTurbine = null;
    this.clearCurtailMarker();

    const actionCard = document.getElementById('birdActionCard');
    const badge = document.getElementById('birdActionBadge');
    const desc = document.getElementById('birdActionDesc');
    const target = document.getElementById('birdTargetTurbine');

    actionCard?.classList.remove('is-curtailing');
    if (badge) {
      badge.innerHTML = `<span>✅ SÜRÜ GÜVENLİ BÖLGEDE (ÇARPIŞMA SIFIR)</span>`;
    }
    if (desc) {
      desc.innerHTML = `
        Kuş sürüsü türbin koridorunu hasarsız geçti. Türbinler otomatik olarak normal üretim devrine (<strong>16.2 RPM</strong>) hızlanıyor.
      `;
    }
    if (target) {
      target.innerHTML = `<span style="color:#10b981; font-weight:800;">🟢 Türbinler: 16.2 RPM</span>`;
    }
  }

  onFlockSafePassed() {
    this.stats.savedBirds += 48;
    this.stats.preventedFinesEuro += 18000;

    const countEl = document.getElementById('birdSavedCount');
    const finesEl = document.getElementById('birdFinesSaved');

    if (countEl) countEl.textContent = `${this.stats.savedBirds} Birey`;
    if (finesEl) finesEl.textContent = `€${this.stats.preventedFinesEuro.toLocaleString('tr-TR')}`;
  }

  playRadarBeep(freq = 880, duration = 0.1) {
    if (this.isBeepMuted) return;
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // ignore
    }
  }
}

// Global başlatma
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.birdRadarInstance = new BirdMigrationRadar();
  });
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.birdRadarInstance = new BirdMigrationRadar();
  }
}

export { BirdMigrationRadar };
