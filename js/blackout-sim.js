/**
 * RüzgarGülü - KIB-TEK Blackout (Şebeke Çöküşü) & Otonom Black Start Simülatörü
 * İzole Ada Şebekesi Frekans Çöküşü, Sentetik Atalet ve Adım Adım Enerjilendirme
 */

// KKTC Ana Trafo Merkezleri & Şebeke Düğümleri
const GRID_NODES = {
  TEKNECIK: { id: 'teknecik', name: 'Teknecik Santrali', lat: 35.3400, lng: 33.5200 },
  LEFKOSA: { id: 'lefkosa', name: 'Lefkoşa Trafo', lat: 35.1850, lng: 33.3600 },
  GIRNE: { id: 'girne', name: 'Girne Şebekesi', lat: 35.3400, lng: 33.3200 },
  GUZELYURT: { id: 'guzelyurt', name: 'Güzelyurt Trafo', lat: 35.2000, lng: 33.0000 },
  MAGUSA: { id: 'magusa', name: 'Gazimağusa Liman', lat: 35.1200, lng: 33.9300 }
};

// 132 kV Yüksek Gerilim İletim Hatları
const TRANSMISSION_LINES = [
  [GRID_NODES.TEKNECIK, GRID_NODES.LEFKOSA],
  [GRID_NODES.LEFKOSA, GRID_NODES.GUZELYURT],
  [GRID_NODES.LEFKOSA, GRID_NODES.MAGUSA],
  [GRID_NODES.TEKNECIK, GRID_NODES.GIRNE],
  // Türbin Hatları
  [{ lat: 35.2360, lng: 33.0350 }, GRID_NODES.GUZELYURT], // WT-07 -> Güzelyurt
  [{ lat: 35.3180, lng: 33.1580 }, GRID_NODES.GIRNE],     // WT-04 -> Girne
  [{ lat: 35.2840, lng: 33.4080 }, GRID_NODES.TEKNECIK]   // WT-11 -> Teknecik
];

class BlackoutSimulator {
  constructor() {
    this.state = 'STANDBY'; // 'STANDBY' | 'BLACKOUT' | 'STARTING' | 'RECOVERED'
    this.map = null;
    this.L = null;
    this.gridLayers = [];
    this.stepInterval = null;
    this.audioCtx = null;
    this.currentHz = 50.00;
    this.currentMW = 52.4;

    this.init();
  }

  ensureStyles() {
    if (!document.querySelector('link[href*="blackout-sim.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './css/blackout-sim.css?v=20261101-1';
      document.head.appendChild(link);
    }
  }

  init() {
    this.ensureStyles();
    this.bindToggleButton();
    this.injectHud();

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
    let btn = document.getElementById('blackoutSimBtn');
    if (!btn) {
      const controls = document.querySelector('.site-map-controls');
      btn = document.createElement('button');
      btn.className = 'blackout-toggle-btn';
      btn.id = 'blackoutSimBtn';
      btn.type = 'button';
      btn.title = 'KIB-TEK Blackout & Otonom Black Start Simülatörü';
      btn.innerHTML = `
        <span class="blackout-dot"></span>
        <span>⚡ Blackout &amp; Şebeke Kurtarma</span>
      `;
      if (controls) {
        controls.appendChild(btn);
      } else {
        document.body.appendChild(btn);
      }
    }

    btn.onclick = (e) => {
      e.preventDefault();
      this.toggleBlackoutSession();
    };
  }

  injectHud() {
    if (document.getElementById('blackoutHud')) return;

    const wrap = document.querySelector('.site-map-canvas-wrap') || document.body;
    const hud = document.createElement('div');
    hud.className = 'blackout-hud';
    hud.id = 'blackoutHud';
    hud.innerHTML = `
      <div class="blackout-hud-header">
        <div class="blackout-hud-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>KIB-TEK Ada Şebeke &amp; Black Start</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="blackout-state-tag" id="blackoutStateTag">SİSTEM STANDBY</span>
          <button class="bird-close-hud-btn" id="blackoutCloseHudBtn" type="button" title="Paneli Gizle">✕</button>
        </div>
      </div>

      <!-- Telemetri Sayaçları -->
      <div class="blackout-telemetry-row">
        <div class="blackout-telemetry-box">
          <span class="blackout-telemetry-label">Ada Şebeke Frekansı</span>
          <div class="blackout-telemetry-val" id="blackoutHzVal">
            50.00 <small>Hz</small>
          </div>
        </div>
        <div class="blackout-telemetry-box">
          <span class="blackout-telemetry-label">Üretilen Güç (MW)</span>
          <div class="blackout-telemetry-val nominal" id="blackoutMWVal">
            52.4 <small>MW</small>
          </div>
        </div>
      </div>

      <!-- Durum Kartı -->
      <div class="blackout-status-card" id="blackoutStatusCard">
        <div class="blackout-status-header" id="blackoutStatusHeader">
          <span>● Şebeke Normal Frekansta</span>
        </div>
        <p class="blackout-status-desc" id="blackoutStatusDesc">
          KIB-TEK enterkonnektesiz izole ada şebekesi senkron çalışıyor. Blackout testi başlatılabilir.
        </p>
        <div class="blackout-progress-track">
          <div class="blackout-progress-fill" id="blackoutProgressFill"></div>
        </div>
      </div>

      <!-- Şehir Düğümleri Durumu -->
      <div class="blackout-nodes-row">
        <div class="blackout-node-pill is-powered" id="nodeTeknecik">Teknecik</div>
        <div class="blackout-node-pill is-powered" id="nodeLefkosa">Lefkoşa</div>
        <div class="blackout-node-pill is-powered" id="nodeGirne">Girne</div>
        <div class="blackout-node-pill is-powered" id="nodeGuzelyurt">Güzelyurt</div>
        <div class="blackout-node-pill is-powered" id="nodeMagusa">Mağusa</div>
      </div>

      <!-- Butonlar -->
      <div class="blackout-hud-actions" id="blackoutActions">
        <button class="blackout-btn danger" id="blackoutTriggerBtn" type="button">
          💥 Şebeke Çöküşünü Simüle Et (Blackout)
        </button>
      </div>
    `;

    wrap.appendChild(hud);

    // Leaflet click & scroll propagation'ı izole et
    if (window.L && window.L.DomEvent) {
      window.L.DomEvent.disableClickPropagation(hud);
      window.L.DomEvent.disableScrollPropagation(hud);
    }
    hud.addEventListener('click', (e) => e.stopPropagation());
    hud.addEventListener('mousedown', (e) => e.stopPropagation());

    document.getElementById('blackoutCloseHudBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      hud.classList.remove('is-visible');
    });

    document.getElementById('blackoutTriggerBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerBlackout();
    });
  }

  toggleBlackoutSession() {
    const hud = document.getElementById('blackoutHud');
    const btn = document.getElementById('blackoutSimBtn');

    if (hud?.classList.contains('is-visible')) {
      hud.classList.remove('is-visible');
      btn?.classList.remove('is-active');
      this.resetToNormal();
    } else {
      hud?.classList.add('is-visible');
      btn?.classList.add('is-active');
      // Haritayı merkeze al
      const mapCanvas = document.getElementById('turbineMapCanvas');
      mapCanvas?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (this.map) {
        this.map.flyTo([35.2500, 33.3500], 10, { duration: 1.1 });
      }
    }
  }

  /**
   * 1. AŞAMA: ŞEBEKE ÇÖKÜŞÜ (BLACKOUT)
   */
  triggerBlackout() {
    this.state = 'BLACKOUT';
    const mapCanvas = document.getElementById('turbineMapCanvas');
    mapCanvas?.classList.add('is-blackout');

    // Ses efekti: Frekans düşüşü ve kapanma
    this.playAudioPitchDrop();

    // Düğüm ışıklarını söndür
    document.querySelectorAll('.blackout-node-pill').forEach((el) => {
      el.classList.remove('is-powered');
    });

    const hzEl = document.getElementById('blackoutHzVal');
    const mwEl = document.getElementById('blackoutMWVal');
    const tagEl = document.getElementById('blackoutStateTag');
    const cardEl = document.getElementById('blackoutStatusCard');
    const headerEl = document.getElementById('blackoutStatusHeader');
    const descEl = document.getElementById('blackoutStatusDesc');
    const progEl = document.getElementById('blackoutProgressFill');
    const actionsEl = document.getElementById('blackoutActions');

    if (hzEl) hzEl.innerHTML = `46.12 <small>Hz (ÇÖKTÜ)</small>`;
    if (mwEl) mwEl.innerHTML = `0.0 <small>MW</small>`;
    if (tagEl) {
      tagEl.textContent = 'ŞEBEKE ÇÖKTÜ';
      tagEl.className = 'blackout-state-tag';
    }
    if (cardEl) {
      cardEl.className = 'blackout-status-card';
    }
    if (headerEl) {
      headerEl.innerHTML = `<span>🚨 KIB-TEK ADA FREKANSI ÇÖKTÜ</span>`;
    }
    if (descEl) {
      descEl.innerHTML = `
        Teknecik santrali devre dışı kaldı. Frekans 46.12 Hz'e düşerek ada genelinde <strong>tam elektrik kesintisi (Blackout)</strong> oluştu.
      `;
    }
    if (progEl) progEl.style.width = '0%';

    // Butonları güncelle: Otonom Black Start Başlatma
    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="blackout-btn primary" id="blackoutStartBtn" type="button">
          🚀 Otonom Black Start Başlat (Grid-Forming)
        </button>
        <button class="blackout-btn secondary" id="blackoutResetBtn" type="button">
          Normale Dön
        </button>
      `;

      document.getElementById('blackoutStartBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startBlackStartRestoration();
      });

      document.getElementById('blackoutResetBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetToNormal();
      });
    }
  }

  /**
   * 2. AŞAMA: OTONOM BLACK START YENİDEN BAŞLATMA
   */
  startBlackStartRestoration() {
    this.state = 'STARTING';
    const tagEl = document.getElementById('blackoutStateTag');
    const cardEl = document.getElementById('blackoutStatusCard');
    const headerEl = document.getElementById('blackoutStatusHeader');
    const descEl = document.getElementById('blackoutStatusDesc');
    const progEl = document.getElementById('blackoutProgressFill');
    const actionsEl = document.getElementById('blackoutActions');
    const hzEl = document.getElementById('blackoutHzVal');
    const mwEl = document.getElementById('blackoutMWVal');

    if (tagEl) {
      tagEl.textContent = 'BLACK START DEVREDE';
      tagEl.className = 'blackout-state-tag active';
    }
    if (cardEl) cardEl.className = 'blackout-status-card is-recovering';

    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="blackout-btn secondary" disabled style="opacity:0.7;">
          ⚡ Yeniden Enerjilendirme Sürüyor...
        </button>
      `;
    }

    // 132 kV İletim Hatlarını Haritada Çiz (Neon elektrik akımı)
    this.drawTransmissionGrid();

    let step = 1;
    this.playRestoreChime(523.25); // C5

    this.stepInterval = setInterval(() => {
      if (step === 1) {
        // Adım 1: Teknecik & İletim Hatları
        document.getElementById('nodeTeknecik')?.classList.add('is-powered');
        this.addCityGlowNode(GRID_NODES.TEKNECIK);
        if (hzEl) hzEl.innerHTML = `47.85 <small>Hz</small>`;
        if (mwEl) mwEl.innerHTML = `12.4 <small>MW</small>`;
        if (headerEl) headerEl.innerHTML = `<span>⚡ 1. Adım: Teknecik & Trafo Hattı Enerjilendi</span>`;
        if (descEl) descEl.textContent = '19 Rüzgâr türbini Grid-Forming VSM moduna geçti. Yüksek gerilim hatlarına ilk referans voltajı basıldı.';
        if (progEl) progEl.style.width = '25%';
        this.playRestoreChime(587.33); // D5
      } else if (step === 2) {
        // Adım 2: Lefkoşa & Kritik Hastaneler
        document.getElementById('nodeLefkosa')?.classList.add('is-powered');
        this.addCityGlowNode(GRID_NODES.LEFKOSA);
        if (hzEl) hzEl.innerHTML = `48.90 <small>Hz</small>`;
        if (mwEl) mwEl.innerHTML = `24.8 <small>MW</small>`;
        if (headerEl) headerEl.innerHTML = `<span>⚡ 2. Adım: Lefkoşa Trafo & Hastaneler Devrede</span>`;
        if (descEl) descEl.textContent = 'Başkent Lefkoşa ana trafosu ve kritik altyapı senkronize edildi. Frekans 48.90 Hz seviyesine yükseldi.';
        if (progEl) progEl.style.width = '55%';
        this.playRestoreChime(659.25); // E5
      } else if (step === 3) {
        // Adım 3: Girne & Güzelyurt
        document.getElementById('nodeGirne')?.classList.add('is-powered');
        document.getElementById('nodeGuzelyurt')?.classList.add('is-powered');
        this.addCityGlowNode(GRID_NODES.GIRNE);
        this.addCityGlowNode(GRID_NODES.GUZELYURT);
        if (hzEl) hzEl.innerHTML = `49.75 <small>Hz</small>`;
        if (mwEl) mwEl.innerHTML = `39.6 <small>MW</small>`;
        if (headerEl) headerEl.innerHTML = `<span>⚡ 3. Adım: Girne & Güzelyurt Şebekesi Senkronize</span>`;
        if (descEl) descEl.textContent = 'Kuzey ve batı rüzgâr koridoru türbinleri yükü paylaştı. Sentetik ataletsel dengeleme devrede.';
        if (progEl) progEl.style.width = '80%';
        this.playRestoreChime(783.99); // G5
      } else if (step === 4) {
        // Adım 4: Gazimağusa & Tam Zafer
        document.getElementById('nodeMagusa')?.classList.add('is-powered');
        this.addCityGlowNode(GRID_NODES.MAGUSA);
        clearInterval(this.stepInterval);
        this.onBlackStartCompleted();
      }
      step++;
    }, 1800);
  }

  /**
   * 3. AŞAMA: ZAFER - TAM KURTARMA
   */
  onBlackStartCompleted() {
    this.state = 'RECOVERED';
    const mapCanvas = document.getElementById('turbineMapCanvas');
    mapCanvas?.classList.remove('is-blackout');

    const hzEl = document.getElementById('blackoutHzVal');
    const mwEl = document.getElementById('blackoutMWVal');
    const tagEl = document.getElementById('blackoutStateTag');
    const cardEl = document.getElementById('blackoutStatusCard');
    const headerEl = document.getElementById('blackoutStatusHeader');
    const descEl = document.getElementById('blackoutStatusDesc');
    const progEl = document.getElementById('blackoutProgressFill');
    const actionsEl = document.getElementById('blackoutActions');

    if (hzEl) hzEl.innerHTML = `<span style="color:#10b981;">50.00</span> <small>Hz (SENKRON)</small>`;
    if (mwEl) mwEl.innerHTML = `<span style="color:#10b981;">52.4</span> <small>MW (TAM GÜÇ)</small>`;
    if (tagEl) {
      tagEl.textContent = 'ŞEBEKE KURTARILDI';
      tagEl.className = 'blackout-state-tag success';
    }
    if (cardEl) cardEl.className = 'blackout-status-card is-recovered';
    if (headerEl) {
      headerEl.innerHTML = `<span>🏆 KKTC ŞEBEKESİ BAŞARIYLA KURTARILDI</span>`;
    }
    if (descEl) {
      descEl.innerHTML = `
        19 Rüzgâr türbini sıfırdan adayı ayağa kaldırdı. Frekans <strong>50.00 Hz</strong> nominal sınıra kilitlendi. Kurtarma süresi: <strong>7.2 saniye</strong>.
      `;
    }
    if (progEl) progEl.style.width = '100%';

    this.playVictoryFanfare();

    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="blackout-btn primary" id="blackoutResetBtn" type="button">
          ✅ Simülasyonu Tamamla &amp; Normale Dön
        </button>
      `;

      document.getElementById('blackoutResetBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetToNormal();
      });
    }
  }

  drawTransmissionGrid() {
    if (!this.map || !this.L) return;

    this.clearGridLayers();

    TRANSMISSION_LINES.forEach(([p1, p2]) => {
      const line = this.L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '8, 8',
        className: 'blackout-grid-line'
      }).addTo(this.map);
      this.gridLayers.push(line);
    });
  }

  addCityGlowNode(node) {
    if (!this.map || !this.L) return;

    const icon = this.L.divIcon({
      className: 'blackout-city-marker',
      html: `
        <div class="blackout-city-glow-wrap">
          <div class="blackout-city-core"></div>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    const marker = this.L.marker([node.lat, node.lng], { icon, zIndexOffset: 2200 }).addTo(this.map);
    marker.bindTooltip(`⚡ ${node.name} Enerjilendi!`, { permanent: true, direction: 'top' });
    this.gridLayers.push(marker);
  }

  clearGridLayers() {
    this.gridLayers.forEach((layer) => {
      try { this.map?.removeLayer(layer); } catch {}
    });
    this.gridLayers = [];
  }

  resetToNormal() {
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }

    this.state = 'STANDBY';
    const mapCanvas = document.getElementById('turbineMapCanvas');
    mapCanvas?.classList.remove('is-blackout');

    this.clearGridLayers();

    // Düğümleri tekrar normale getir
    document.querySelectorAll('.blackout-node-pill').forEach((el) => {
      el.classList.add('is-powered');
    });

    const hzEl = document.getElementById('blackoutHzVal');
    const mwEl = document.getElementById('blackoutMWVal');
    const tagEl = document.getElementById('blackoutStateTag');
    const cardEl = document.getElementById('blackoutStatusCard');
    const headerEl = document.getElementById('blackoutStatusHeader');
    const descEl = document.getElementById('blackoutStatusDesc');
    const progEl = document.getElementById('blackoutProgressFill');
    const actionsEl = document.getElementById('blackoutActions');

    if (hzEl) hzEl.innerHTML = `50.00 <small>Hz</small>`;
    if (mwEl) mwEl.innerHTML = `52.4 <small>MW</small>`;
    if (tagEl) {
      tagEl.textContent = 'SİSTEM STANDBY';
      tagEl.className = 'blackout-state-tag';
    }
    if (cardEl) cardEl.className = 'blackout-status-card is-recovered';
    if (headerEl) headerEl.innerHTML = `<span>● Şebeke Normal Frekansta</span>`;
    if (descEl) descEl.textContent = 'KIB-TEK enterkonnektesiz izole ada şebekesi senkron çalışıyor. Blackout testi başlatılabilir.';
    if (progEl) progEl.style.width = '0%';

    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="blackout-btn danger" id="blackoutTriggerBtn" type="button">
          💥 Şebeke Çöküşünü Simüle Et (Blackout)
        </button>
      `;

      document.getElementById('blackoutTriggerBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.triggerBlackout();
      });
    }
  }

  // Web Audio API Ses Efektleri
  playAudioPitchDrop() {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.audioCtx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.09, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 1.2);
    } catch {}
  }

  playRestoreChime(freq) {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.6);
    } catch {}
  }

  playVictoryFanfare() {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.playRestoreChime(freq), i * 140);
    });
  }
}

// Global başlatma
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.blackoutSimInstance = new BlackoutSimulator();
  });
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.blackoutSimInstance = new BlackoutSimulator();
  }
}

export { BlackoutSimulator };

