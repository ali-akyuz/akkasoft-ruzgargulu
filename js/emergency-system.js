/**
 * RüzgarGülü - Akıllı Yangın, Kritik Arıza & Acil Durum (Emergency) Sistemi
 * Butonla Tetiklenen Kontrollü Acil Durum Tatbikatı, Çoklu Sensör Füzyonu ve Müdahale Konsolu
 */

import { emergencyAudio } from './emergency-audio.js?v=20261031-1';

const SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  EMERGENCY: 'EMERGENCY'
};

// 19 Türbin için Gerçekçi SCADA Sensör Füzyon Veri Tabanı
const TURBINE_TELEMETRY = {
  'WT-07': {
    id: 'WT-07',
    corridor: 'Güzelyurt – Kalkanlı Rüzgâr Sahası',
    coords: '35.2360° K, 33.0350° D (Rakım: 245 m)',
    generatorTemp: 52.4, // Standby / Normal başlangıç
    nacelleTemp: 42.1,
    cabinetTemp: 38.0,
    smokeDensity: 1.8,   // %
    flameDetected: false,
    sensorHealth: 'online',
    fireExtinguisherReady: true,
    gridIsolated: false,
    rotorBraked: false,
    isSuppressed: false
  }
};

class EmergencySystem {
  constructor() {
    this.activeIncident = null;
    this.isBannerVisible = false;
    this.isModalOpen = false;
    this.audioEngine = emergencyAudio;

    this.init();
  }

  ensureStyles() {
    if (!document.querySelector('link[href*="emergency-system.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './css/emergency-system.css?v=20261031-2';
      document.head.appendChild(link);
    }
  }

  init() {
    this.ensureStyles();
    this.renderDomElements();
    this.bindEvents();

    // Sayfa her yenilendiğinde alarm KAPALI (Standby / Normal Gözlem Modu) başlar
    this.setNormalState();
  }

  /**
   * Normal Güvenli Başlangıç Durumu (Sayfa açılışında alarm çalmaz)
   */
  setNormalState() {
    const t = TURBINE_TELEMETRY['WT-07'];
    if (t) {
      t.generatorTemp = 52.4;
      t.nacelleTemp = 42.1;
      t.cabinetTemp = 38.0;
      t.smokeDensity = 1.8;
      t.flameDetected = false;
      t.sensorHealth = 'online';
      t.isSuppressed = false;
      t.rotorBraked = false;
      t.gridIsolated = false;
    }

    this.clearIncident();
    this.updateAudioHud();
  }

  /**
   * Butonla Kontrollü Yangın & Kritik Arıza Tatbikatı Başlatma
   */
  startEmergencyDrill() {
    const t = TURBINE_TELEMETRY['WT-07'];
    if (!t) return;

    // Sensör değerleri yangın eşiğine yükseltilir
    t.generatorTemp = 86.4;
    t.nacelleTemp = 79.5;
    t.smokeDensity = 24.8;
    t.flameDetected = true;
    t.sensorHealth = 'online';
    t.isSuppressed = false;
    t.rotorBraked = false;
    t.gridIsolated = false;

    // Acil durum sistemi ve siren tetiklenir (Önce ana ekranda acil durum bannerı belirir)
    this.evaluateTurbine('WT-07');
  }

  /**
   * Çoklu Sensör Füzyon Mantığı (Multi-Sensor Fusion Verification)
   */
  evaluateTurbine(turbineId) {
    const t = TURBINE_TELEMETRY[turbineId];
    if (!t) return;

    if (t.isSuppressed) {
      this.clearIncident();
      return;
    }

    // Sensör arızası kontrolü
    if (t.sensorHealth !== 'online') {
      this.setIncident({
        severity: SEVERITY.WARNING,
        turbineId: t.id,
        title: 'SENSÖR İLETİŞİM ARIZASI',
        description: 'Yangın ve sıcaklık sensör verisi kesildi veya yanıt vermiyor.',
        verification: 'Sensör arızası doğrulanıyor; yangın koşulu oluşmadı.',
        timestamp: new Date().toLocaleTimeString('tr-TR')
      });
      return;
    }

    // Doğrulanmış Yangın Algılama Koşulu:
    const fireConfirmed =
      (t.flameDetected && (t.generatorTemp > 75 || t.nacelleTemp > 70)) ||
      (t.smokeDensity > 18 && t.generatorTemp > 75);

    if (fireConfirmed) {
      this.setIncident({
        severity: SEVERITY.EMERGENCY,
        turbineId: t.id,
        title: 'YANGIN ALGILANDI!',
        description: `${t.corridor} üzerindeki ${t.id} makine dairesinde doğrulanmış yangın ve termal patlama riski.`,
        verification: `ÇİFT SENSÖRLE DOĞRULANDI (Duman: %${t.smokeDensity.toFixed(1)} + Stator: ${t.generatorTemp.toFixed(1)}°C + UV Alev Dedektörü)`,
        timestamp: new Date().toLocaleTimeString('tr-TR'),
        turbine: t
      });
      return;
    }

    // Kritik Sıcaklık Aşımı (Sıcaklık yüksek ama alev/duman henüz yok)
    if (t.generatorTemp >= 80) {
      this.setIncident({
        severity: SEVERITY.CRITICAL,
        turbineId: t.id,
        title: 'KRİTİK JENERATÖR SICAKLIĞI ALARMI',
        description: `Stator yatak sıcaklığı ${t.generatorTemp.toFixed(1)}°C seviyesine ulaştı.`,
        verification: 'Tekil Sıcaklık Limiti Aşıldı (Duman/Alev yok).',
        timestamp: new Date().toLocaleTimeString('tr-TR'),
        turbine: t
      });
      return;
    }

    this.clearIncident();
  }

  setIncident(incident) {
    this.activeIncident = incident;
    this.updateBanner();
    this.updateAudio();
    this.updateModalContent();
  }

  clearIncident() {
    this.activeIncident = null;
    this.audioEngine.stopAlarm();
    this.hideBanner();
    this.updateAudioHud();
  }

  updateAudio() {
    if (!this.activeIncident) {
      this.audioEngine.stopAlarm();
      this.updateAudioHud();
      return;
    }

    if (
      this.activeIncident.severity === SEVERITY.CRITICAL ||
      this.activeIncident.severity === SEVERITY.EMERGENCY
    ) {
      if (!this.audioEngine.isMuted) {
        this.audioEngine.startAlarm();
      }
    } else {
      this.audioEngine.stopAlarm();
    }
    this.updateAudioHud();
  }

  updateBanner() {
    const banner = document.getElementById('emergencyTopBanner');
    if (!banner || !this.activeIncident) {
      this.hideBanner();
      return;
    }

    const isFire = this.activeIncident.severity === SEVERITY.EMERGENCY;
    banner.classList.toggle('is-fire', isFire);
    banner.classList.add('is-active');

    const badgeEl = banner.querySelector('#emBannerBadge');
    const textEl = banner.querySelector('#emBannerText');

    if (badgeEl) {
      badgeEl.textContent = `${this.activeIncident.severity} · ${this.activeIncident.turbineId}`;
    }
    if (textEl) {
      textEl.textContent = `${this.activeIncident.title} — ${this.activeIncident.verification}`;
    }
  }

  hideBanner() {
    const banner = document.getElementById('emergencyTopBanner');
    banner?.classList.remove('is-active');
  }

  updateAudioHud() {
    const hud = document.getElementById('emergencyAudioHud');
    if (!hud) return;

    const isAlarming =
      this.activeIncident &&
      (this.activeIncident.severity === SEVERITY.CRITICAL ||
        this.activeIncident.severity === SEVERITY.EMERGENCY);

    hud.classList.toggle('is-alarming', Boolean(isAlarming));
    const btn = document.getElementById('emTriggerDrillBtn');
    btn?.classList.toggle('is-alarming', Boolean(isAlarming));

    const label = hud.querySelector('#emAudioHudText');
    if (label) {
      if (isAlarming) {
        label.textContent = '🚨 Acil Durum Aktif · Konsolu Aç';
      } else {
        label.textContent = '🚨 Acil Durum Tatbikatı';
      }
    }
  }

  openModal() {
    this.isModalOpen = true;
    const overlay = document.getElementById('emergencyModalOverlay');
    overlay?.classList.add('is-open');
    this.updateModalContent();
  }

  closeModal() {
    this.isModalOpen = false;
    const overlay = document.getElementById('emergencyModalOverlay');
    overlay?.classList.remove('is-open');
  }

  updateModalContent() {
    const overlay = document.getElementById('emergencyModalOverlay');
    if (!overlay) return;

    const inc = this.activeIncident || {
      severity: 'NORMAL / GÜVENLİ',
      turbineId: 'WT-07',
      title: 'SİSTEM GÜVENLİ DURUMDA',
      description: 'Aktif yangın veya kritik arıza uyarısı bulunmamaktadır.',
      verification: 'Tüm sensörler normal çalışma sınırlarında.',
      timestamp: new Date().toLocaleTimeString('tr-TR')
    };

    const t = TURBINE_TELEMETRY['WT-07'];

    // Header
    const titleEl = overlay.querySelector('#emModalIncidentTitle');
    const subEl = overlay.querySelector('#emModalIncidentSub');
    if (titleEl) titleEl.textContent = `${inc.title} (${inc.turbineId})`;
    if (subEl) subEl.textContent = `${t.corridor} · ${t.coords}`;

    // Meta items
    const timeEl = overlay.querySelector('#emMetaTime');
    const sevEl = overlay.querySelector('#emMetaSeverity');
    const confEl = overlay.querySelector('#emMetaConfidence');
    if (timeEl) timeEl.textContent = inc.timestamp;
    if (sevEl) {
      sevEl.textContent = inc.severity;
      sevEl.className = inc.severity === SEVERITY.EMERGENCY ? 'alert' : 'warn';
    }
    if (confEl) confEl.textContent = inc.severity === SEVERITY.EMERGENCY ? '%99,8 (Çift Doğrulama)' : '%100 (Normal İzleme)';

    // Sensors
    const valGen = overlay.querySelector('#emSensorGen');
    const valNac = overlay.querySelector('#emSensorNac');
    const valSmoke = overlay.querySelector('#emSensorSmoke');
    const valFlame = overlay.querySelector('#emSensorFlame');

    if (valGen) {
      valGen.textContent = `${t.generatorTemp.toFixed(1)} °C`;
      valGen.className = `em-sensor-val ${t.generatorTemp > 80 ? 'alert' : 'ok'}`;
    }
    if (valNac) {
      valNac.textContent = `${t.nacelleTemp.toFixed(1)} °C`;
      valNac.className = `em-sensor-val ${t.nacelleTemp > 70 ? 'alert' : 'ok'}`;
    }
    if (valSmoke) {
      valSmoke.textContent = `%${t.smokeDensity.toFixed(1)}`;
      valSmoke.className = `em-sensor-val ${t.smokeDensity > 15 ? 'alert' : 'ok'}`;
    }
    if (valFlame) {
      valFlame.textContent = t.flameDetected ? 'ALEV ALGILANDI' : 'YOK (NORMAL)';
      valFlame.className = `em-sensor-val ${t.flameDetected ? 'alert' : 'ok'}`;
    }

    // Verification text
    const verifText = overlay.querySelector('#emVerificationText');
    if (verifText) {
      verifText.innerHTML = `<strong>Sistem Doğrulama Algoritması:</strong> ${inc.verification}`;
    }
  }

  triggerAerosolSuppression() {
    const t = TURBINE_TELEMETRY['WT-07'];
    const btn = document.getElementById('emBtnAerosol');
    if (!btn || !t) return;

    btn.disabled = true;
    btn.textContent = '🧯 Aerosol Boşaltılıyor (5s)...';
    btn.className = 'em-action-trigger-btn warning';

    setTimeout(() => {
      t.smokeDensity = 2.1;
      t.flameDetected = false;
      t.generatorTemp = 54.2;
      t.nacelleTemp = 44.0;
      t.isSuppressed = true;

      btn.textContent = '✓ Yangın Söndürüldü (Soğutma Modu)';
      btn.className = 'em-action-trigger-btn success';

      this.audioEngine.stopAlarm();
      this.evaluateTurbine('WT-07');
      this.updateModalContent();

      // 2 saniye sonra banner'ı otomatik kapat
      setTimeout(() => {
        this.hideBanner();
      }, 2000);
    }, 4500);
  }

  triggerRotorBrake() {
    const t = TURBINE_TELEMETRY['WT-07'];
    const btn = document.getElementById('emBtnBrake');
    if (!btn || !t) return;

    t.rotorBraked = true;
    btn.textContent = '✓ Kanat Pitch 90° & Mekanik Kilit Aktif (0 RPM)';
    btn.className = 'em-action-trigger-btn success';
    btn.disabled = true;
  }

  triggerGridIsolate() {
    const t = TURBINE_TELEMETRY['WT-07'];
    const btn = document.getElementById('emBtnIsolate');
    if (!btn || !t) return;

    t.gridIsolated = true;
    btn.textContent = '✓ Trafo ve Şebeke Hattı İzole Edildi';
    btn.className = 'em-action-trigger-btn success';
    btn.disabled = true;
  }

  sendEmergencyDispatch() {
    const t = TURBINE_TELEMETRY['WT-07'];
    const text = encodeURIComponent(
      `🚨 [ACİL DURUM İHBARI - RÜZGARGÜLÜ]\n` +
      `Saha: ${t.corridor}\n` +
      `Türbin: ${t.id} (${t.coords})\n` +
      `Olay: Doğrulanmış Yangın & Yüksek Sıcaklık Uyarısı\n` +
      `Stator Sıcaklığı: ${t.generatorTemp.toFixed(1)}°C | Duman: %${t.smokeDensity.toFixed(1)}\n` +
      `Müdahale Ekipleri Bölgeye Sevk Edilsin.`
    );
    window.open(`https://wa.me/905338000000?text=${text}`, '_blank');
  }

  renderDomElements() {
    if (document.getElementById('emergencyTopBanner')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'emergencySystemRoot';
    wrapper.innerHTML = `
      <!-- Üst Acil Durum Flaşör Bandı (Sadece alarm aktifken açılır) -->
      <aside class="emergency-top-banner" id="emergencyTopBanner" role="alert" aria-live="assertive">
        <div class="em-banner-left" id="emBannerClickableZone" style="cursor: pointer;" title="Detaylı Acil Durum Merkezini Aç">
          <div class="em-strobe-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="em-banner-title">
            <span class="em-banner-badge" id="emBannerBadge">EMERGENCY · WT-07</span>
            <span class="em-banner-text" id="emBannerText">YANGIN ALGILANDI! — Çift Sensör Doğrulaması Aktif</span>
          </div>
        </div>
        <div class="em-banner-right">
          <button class="em-btn primary" id="emOpenModalBtn" type="button">
            🚨 Acil Durum Merkezini Aç
          </button>
          <button class="em-btn secondary" id="emMuteBannerBtn" type="button">
            Alarmı Sustur
          </button>
        </div>
      </aside>

      <!-- Sol Alt Minik Nokta Düğme (Nokta / Pulse Dot) -->
      <div class="em-trigger-dot-wrap" id="emergencyAudioHud">
        <button class="em-trigger-dot" id="emTriggerDrillBtn" type="button" title="Yangın ve Acil Durum Tatbikatını Başlat" aria-label="Acil Durum Tatbikatı">
          <span class="em-dot-pulse"></span>
          <span class="em-dot-core"></span>
          <span class="em-dot-tooltip" id="emAudioHudText">🚨 Acil Durum Tatbikatı</span>
        </button>
      </div>

      <!-- Acil Durum Konsolu Modalı -->
      <div class="em-modal-overlay" id="emergencyModalOverlay" role="dialog" aria-modal="true">
        <div class="em-modal-dialog">
          <div class="em-modal-header">
            <div class="em-modal-title-group">
              <div class="em-modal-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </div>
              <div>
                <h2 id="emModalIncidentTitle">YANGIN VE KRİTİK ARIZA MERKEZİ (WT-07)</h2>
                <p id="emModalIncidentSub">Güzelyurt – Kalkanlı Rüzgâr Sahası (35.2360° K, 33.0350° D)</p>
              </div>
            </div>
            <button class="em-modal-close-btn" id="emModalCloseBtn" type="button" aria-label="Kapat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="em-modal-body">
            <!-- Genel Bilgi Kartı -->
            <div class="em-incident-card">
              <div class="em-meta-item">
                <span>Algılanan Durum</span>
                <strong id="emMetaSeverity" style="color:#ef4444;">EMERGENCY / CONFIRMED FIRE</strong>
              </div>
              <div class="em-meta-item">
                <span>Olay Zaman Damgası</span>
                <strong id="emMetaTime">22:48:15</strong>
              </div>
              <div class="em-meta-item">
                <span>Doğruluk Oranı</span>
                <strong id="emMetaConfidence">%99,8 (Çift Sensör)</strong>
              </div>
            </div>

            <!-- Çoklu Sensör Füzyon Tablosu -->
            <div>
              <div class="em-section-title">
                <span>Çoklu Sensör Füzyon Telemetrisi</span>
                <small style="color:#38bdf8; font-weight:600;">Canlı SCADA</small>
              </div>
              <div class="em-fusion-grid">
                <div class="em-sensor-box is-critical">
                  <div class="em-sensor-top">
                    <span>Jeneratör Stator</span>
                    <span class="em-sensor-status alert">KRİTİK</span>
                  </div>
                  <strong class="em-sensor-val alert" id="emSensorGen">86,4 °C</strong>
                  <small style="color:#94a3b8; font-size:0.68rem;">Eşik: 80,0 °C</small>
                </div>

                <div class="em-sensor-box is-warning">
                  <div class="em-sensor-top">
                    <span>Makine Dairesi (Nacelle)</span>
                    <span class="em-sensor-status warn">UYARI</span>
                  </div>
                  <strong class="em-sensor-val warn" id="emSensorNac">79,5 °C</strong>
                  <small style="color:#94a3b8; font-size:0.68rem;">Eşik: 70,0 °C</small>
                </div>

                <div class="em-sensor-box is-critical">
                  <div class="em-sensor-top">
                    <span>Duman Optik Yoğunluğu</span>
                    <span class="em-sensor-status alert">YÜKSEK</span>
                  </div>
                  <strong class="em-sensor-val alert" id="emSensorSmoke">%24,8</strong>
                  <small style="color:#94a3b8; font-size:0.68rem;">Eşik: %18,0</small>
                </div>

                <div class="em-sensor-box is-critical">
                  <div class="em-sensor-top">
                    <span>UV/IR Alev Sensörü</span>
                    <span class="em-sensor-status alert">POZİTİF</span>
                  </div>
                  <strong class="em-sensor-val alert" id="emSensorFlame">ALEV ALGILANDI</strong>
                  <small style="color:#94a3b8; font-size:0.68rem;">Optik Sensör Doğrulandı</small>
                </div>
              </div>
            </div>

            <!-- Algoritma Çapraz Doğrulama Açıklaması -->
            <div class="em-verification-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div id="emVerificationText">
                <strong>Sistem Doğrulama Algoritması:</strong> Tekil sensör hatası elendi. Duman dedektörü optik yansıması (%24,8) ve jeneratör sıcaklık artışı (86,4 °C) eş zamanlı teyit edildiği için yangın kesinleşti.
              </div>
            </div>

            <!-- Acil Müdahale Prosedürü -->
            <div>
              <div class="em-section-title">
                <span>Standart Acil Müdahale Prosedürleri</span>
                <small style="color:#ef4444; font-weight:700;">Yetkili Aksiyonlar</small>
              </div>
              <div class="em-actions-grid">
                <div class="em-action-card">
                  <div class="em-action-info">
                    <strong>1. Aerosol Söndürmeyi Ateşle</strong>
                    <p>Nacelle içine katı aerosol gazı püskürterek oksijeni keser ve yangını anında söndürür.</p>
                  </div>
                  <button class="em-action-trigger-btn danger" id="emBtnAerosol" type="button">
                    🧯 FirePro Aerosol Sistemini Patlat
                  </button>
                </div>

                <div class="em-action-card">
                  <div class="em-action-info">
                    <strong>2. Aerodinamik Pitch Freni &amp; Kilit</strong>
                    <p>Kanatları rüzgâr yönüne çevirerek (feathering) rotoru sıfır RPM'e kilitler.</p>
                  </div>
                  <button class="em-action-trigger-btn warning" id="emBtnBrake" type="button">
                    🛑 Kanatları Bayrakla &amp; Rotoru Kilitle
                  </button>
                </div>

                <div class="em-action-card">
                  <div class="em-action-info">
                    <strong>3. Trafo ve Şebekeyi İzole Et</strong>
                    <p>KIB-TEK trafo bağlantısını keserek elektriksel ark ve ikincil patlamaları önler.</p>
                  </div>
                  <button class="em-action-trigger-btn warning" id="emBtnIsolate" type="button">
                    ⚡ Elektriksel Şebeke İzolasyonu
                  </button>
                </div>

                <div class="em-action-card">
                  <div class="em-action-info">
                    <strong>4. İtfaiye &amp; Saha Koordinasyonu</strong>
                    <p>KKTC İtfaiye ve Kalkanlı acil servis ekibine doğrulanmış koordinat bildirimi açar.</p>
                  </div>
                  <button class="em-action-trigger-btn danger" id="emBtnDispatch" type="button">
                    📞 WhatsApp Acil Yangın İhbarı
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer / Tatbikatı Bitirme Butonu -->
          <div class="em-modal-footer">
            <div class="em-sim-controls">
              <span>Saha Tatbikatı Kontrolü:</span>
              <button class="em-sim-btn" id="emSimSensorFaultBtn" type="button">⚠️ Sensör Hatası Testi</button>
              <button class="em-sim-btn fire" id="emSimNormalBtn" type="button">✅ Tatbikatı Bitir &amp; Güvenli Moda Dön</button>
            </div>
            <button class="em-btn secondary" id="emModalMuteBtn" type="button">
              Alarm Sesini Sustur
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);
  }

  bindEvents() {
    // Tetikleme Butonu (İstendiğinde Minik Nokta ile Başlatma veya Aktifken Konsolu Açma)
    document.getElementById('emTriggerDrillBtn')?.addEventListener('click', () => {
      if (this.activeIncident) {
        this.openModal();
      } else {
        this.startEmergencyDrill();
      }
    });

    // Modal aç/kapa (Banner'a veya "Acil Durum Merkezini Aç" butonuna basınca detay ekranı açılır)
    document.getElementById('emOpenModalBtn')?.addEventListener('click', () => this.openModal());
    document.getElementById('emBannerClickableZone')?.addEventListener('click', () => this.openModal());
    document.getElementById('emModalCloseBtn')?.addEventListener('click', () => this.closeModal());

    // Mute butonları
    const muteHandler = () => {
      const isMuted = this.audioEngine.toggleMute();
      this.updateAudioHud();
      const muteBannerBtn = document.getElementById('emMuteBannerBtn');
      const muteModalBtn = document.getElementById('emModalMuteBtn');
      if (muteBannerBtn) muteBannerBtn.textContent = isMuted ? 'Alarm Sesini Aç' : 'Alarmı Sustur';
      if (muteModalBtn) muteModalBtn.textContent = isMuted ? 'Alarm Sesini Aç' : 'Alarm Sesini Sustur';
    };

    document.getElementById('emMuteBannerBtn')?.addEventListener('click', muteHandler);
    document.getElementById('emModalMuteBtn')?.addEventListener('click', muteHandler);
    document.getElementById('emAudioToggleBtn')?.addEventListener('click', muteHandler);

    // Müdahale Prosedür Butonları
    document.getElementById('emBtnAerosol')?.addEventListener('click', () => this.triggerAerosolSuppression());
    document.getElementById('emBtnBrake')?.addEventListener('click', () => this.triggerRotorBrake());
    document.getElementById('emBtnIsolate')?.addEventListener('click', () => this.triggerGridIsolate());
    document.getElementById('emBtnDispatch')?.addEventListener('click', () => this.sendEmergencyDispatch());

    // Tatbikatı Bitirme / Güvenli Moda Dönüş Butonu
    document.getElementById('emSimNormalBtn')?.addEventListener('click', () => {
      this.setNormalState();
      this.closeModal();
    });

    // Sensör Arızası Testi
    document.getElementById('emSimSensorFaultBtn')?.addEventListener('click', () => {
      const t = TURBINE_TELEMETRY['WT-07'];
      t.sensorHealth = 'offline';
      this.evaluateTurbine('WT-07');
      this.openModal();
    });
  }
}

// Otomatik Başlatma
export function initEmergencySystem() {
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new EmergencySystem());
    } else {
      new EmergencySystem();
    }
  }
}

initEmergencySystem();
