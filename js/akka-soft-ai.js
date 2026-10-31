/**
 * AKKA Soft AI - Akıllı Rüzgâr & SCADA Karar Destek Ajanı
 * KKTC 19 türbin sahası, KIB-TEK şebeke yükü ve rüzgâr akış fiziğiyle entegre karar motoru
 */

const STORAGE_KEY = 'akka-soft-ai-history-v1';

// AKKA Soft AI Resmi Rüzgâr & Nöral Vektör Logosu
export const AKKA_AI_LOGO_SVG = `
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="akka-ai-emblem-svg" aria-hidden="true">
    <defs>
      <linearGradient id="akkaGradCore" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#2563eb" />
        <stop offset="100%" stop-color="#9333ea" />
      </linearGradient>
      <linearGradient id="akkaGradWing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#bae6fd" />
      </linearGradient>
    </defs>
    <!-- Aerodinamik Rüzgâr Kanatları (4-Kanat Vorteks) -->
    <path d="M16 2.5C16 2.5 19.5 8.5 19.5 12.8C19.5 14.6 18 16 16 16C14 16 12.5 14.6 12.5 12.8C12.5 8.5 16 2.5 16 2.5Z" fill="url(#akkaGradWing)"/>
    <path d="M29.5 16C29.5 16 23.5 19.5 19.2 19.5C17.4 19.5 16 18 16 16C16 14 17.4 12.5 19.2 12.5C23.5 12.5 29.5 16 29.5 16Z" fill="url(#akkaGradWing)" opacity="0.9"/>
    <path d="M16 29.5C16 29.5 12.5 23.5 12.5 19.2C12.5 17.4 14 16 16 16C18 16 19.5 17.4 19.5 19.2C19.5 23.5 16 29.5 16 29.5Z" fill="url(#akkaGradWing)"/>
    <path d="M2.5 16C2.5 16 8.5 12.5 12.8 12.5C14.6 12.5 16 14 16 16C16 18 14.6 19.5 12.8 19.5C8.5 19.5 2.5 16 2.5 16Z" fill="url(#akkaGradWing)" opacity="0.9"/>
    <!-- Siber Yörünge Halkası -->
    <circle cx="16" cy="16" r="11" stroke="#38bdf8" stroke-width="1.4" stroke-dasharray="3 3.5" opacity="0.75"/>
    <!-- Nöral AI Çekirdeği -->
    <circle cx="16" cy="16" r="5" fill="url(#akkaGradCore)" stroke="#ffffff" stroke-width="1.2"/>
    <circle cx="16" cy="16" r="2.2" fill="#ffffff"/>
    <!-- Çevre Nöral Veri Noktaları -->
    <circle cx="16" cy="5.5" r="1.2" fill="#38bdf8"/>
    <circle cx="26.5" cy="16" r="1.2" fill="#c084fc"/>
    <circle cx="16" cy="26.5" r="1.2" fill="#38bdf8"/>
    <circle cx="5.5" cy="16" r="1.2" fill="#c084fc"/>
  </svg>
`;

// SCADA ve KKTC Saha Bilgi Bankası
const KNOWLEDGE_BASE = {
  turbinesTotal: 19,
  activeCount: 15,
  warningCount: 3,
  criticalCount: 1,
  totalCapacityMW: 52.4,
  currentProductionMW: 34.6,
  windSpeedAvg: '10,2 m/s',
  windDirection: '245° GB (Güneybatı)',
  criticalTurbine: {
    id: 'WT-07',
    corridor: 'Güzelyurt – Kalkanlı Rüzgâr Sahası',
    issue: 'Jeneratör Yatak Sıcaklığı Kritik Sınırda (82,4 °C)',
    recommendation: 'Kanat pitch açısını +6° açarak mekanik yükü düşürün veya Arıza Merkezi üzerinden Teknecik müdahale ekibine WhatsApp saha talimatı iletin.'
  },
  warnings: [
    { id: 'WT-05', issue: 'Güç Çıkışı Sapması (%18 düşük verim)' },
    { id: 'WT-12', issue: 'Kule Titreşim Anomalisi (0.42g)' },
    { id: 'WT-15', issue: 'Rotor Hızı Dalgalanması' }
  ],
  curtailment: {
    excessMW: 14.8,
    h2Rate: '297 kg/saat (Teknecik 350 Bar)',
    aiCompute: '38,4 PFLOPS Yeşil Model Çıkarımı',
    dailySavings: '₺68.450 / gece'
  }
};

class AkkaSoftAiAssistant {
  constructor() {
    this.isOpen = false;
    this.history = [];
    this.audioCtx = null;

    this.init();
  }

  ensureStyles() {
    if (!document.querySelector('link[href*="akka-soft-ai.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './css/akka-soft-ai.css?v=20261031-2';
      document.head.appendChild(link);
    }
  }

  getUserName() {
    try {
      const user = localStorage.getItem('windora-demo-user');
      if (user && user.trim()) return user.trim();
    } catch {
      // ignore
    }
    return 'AKKA Soft Yöneticisi';
  }

  sendInitialGreeting() {
    const userName = this.getUserName();
    const greeting = `👋 <strong>Hoş geldiniz, ${this.escapeHtml(userName)}!</strong><br/><br/>` +
      `Ben <strong>AKKA Soft AI</strong> — Rüzgâr Enerjisi & SCADA Karar Destek Ajanınız. ` +
      `Sahadaki 19 rüzgâr türbininin anlık telemetrisini, enerji üretimini ve teknik performansını canlı olarak analiz ediyorum.<br/><br/>` +
      `⚡ <strong>Canlı Saha Özeti:</strong><br/>` +
      `• <strong>Anlık Üretim:</strong> <span class="akka-metric-pill success">34,6 MW</span> (15 Aktif / 3 Uyarı / 1 Kritik)<br/>` +
      `• <strong>Öncelikli Takip:</strong> <span class="akka-metric-pill alert">WT-07 Jeneratör (82,4 °C)</span><br/>` +
      `• <strong>Rüzgâr Hızı & Yönü:</strong> 10,2 m/s · 245° GB<br/><br/>` +
      `Nasıl yardımcı olabilirim? Aşağıdaki analiz seçeneklerinden birine tıklayabilir veya doğrudan sorunuzu yazabilirsiniz:` +
      `<div class="akka-welcome-options">` +
      `  <button type="button" class="akka-welcome-opt-btn" data-query="Saha durumunu özetle">📊 Anlık Saha Özetini Çıkar</button>` +
      `  <button type="button" class="akka-welcome-opt-btn" data-query="WT-07 neden arızalandı?">🚨 WT-07 Kritik Alarmını Teşhis Et</button>` +
      `  <button type="button" class="akka-welcome-opt-btn" data-query="Gece arbitraj ve hidrojen durumu nedir?">🔋 Gece Arbitrajı &amp; Yeşil H₂ Analizi</button>` +
      `  <button type="button" class="akka-welcome-opt-btn" data-query="Bana en yakın türbin hangisi?">📍 Konumuma En Yakın Türbini Bul</button>` +
      `</div>`;

    this.addBotMessage(greeting);
  }

  init() {
    if (typeof window !== 'undefined') {
      const pathname = (window.location.pathname || '').toLowerCase();
      if (pathname.endsWith('index.html') || pathname === '/' || pathname.endsWith('/ruzgargulu%20en%20son/')) {
        return; // landing sayfasında gösterilmesin
      }
    }

    try {
      sessionStorage.removeItem('akka-soft-ai-history-v1');
    } catch {
      // ignore
    }
    this.history = [];

    this.ensureStyles();
    this.renderWidget();
    this.bindEvents();
    this.sendInitialGreeting();
  }

  playChime() {
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
      osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.28);
    } catch {
      // Audio not supported or blocked
    }
  }

  renderWidget() {
    if (document.getElementById('akkaAiRoot')) return;

    const root = document.createElement('div');
    root.id = 'akkaAiRoot';
    root.innerHTML = `
      <!-- Sağ Alt Yuvarlak FAB Açılış Butonu -->
      <button class="akka-ai-fab" id="akkaAiFab" type="button" aria-label="AKKA Soft AI Asistanı Aç/Kapat" title="AKKA Soft AI Asistanı">
        <span class="akka-ai-fab-pulse"></span>
        <div class="akka-ai-fab-icon">
          ${AKKA_AI_LOGO_SVG}
        </div>
      </button>

      <!-- Glassmorphism Chat Penceresi -->
      <div class="akka-ai-window" id="akkaAiWindow" role="dialog" aria-modal="true" aria-label="AKKA Soft AI Karar Destek Ajanı">
        <div class="akka-ai-header">
          <div class="akka-ai-header-left">
            <div class="akka-ai-avatar">
              ${AKKA_AI_LOGO_SVG}
            </div>
            <div class="akka-ai-title-wrap">
              <strong>AKKA Soft AI</strong>
              <span class="akka-ai-status-tag">
                <i class="akka-ai-status-dot"></i> KKTC Rüzgâr İkizi Bağlı
              </span>
            </div>
          </div>
          <div class="akka-ai-header-actions">
            <button class="akka-ai-btn-icon" id="akkaAiClearBtn" type="button" title="Sohbeti Temizle" aria-label="Temizle">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button class="akka-ai-btn-icon" id="akkaAiCloseBtn" type="button" title="Pencereyi Kapat" aria-label="Kapat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="akka-ai-body" id="akkaAiBody">
          <div id="akkaAiMessages"></div>
        </div>

        <div class="akka-ai-quick-bar" id="akkaAiQuickBar">
          <div class="akka-ai-chips-wrap">
            <button type="button" class="akka-ai-chip" data-query="Saha durumunu özetle">📊 Saha Özeti</button>
            <button type="button" class="akka-ai-chip" data-query="WT-07 neden arızalandı?">🚨 WT-07 Kritik Alarm</button>
            <button type="button" class="akka-ai-chip" data-query="Gece arbitraj ve hidrojen durumu nedir?">🔋 Gece Arbitrajı &amp; H₂</button>
            <button type="button" class="akka-ai-chip" data-query="Rüzgâr yönü ve hızı nasıl?">💨 Rüzgâr Akışı</button>
            <button type="button" class="akka-ai-chip" data-query="Kuş göç radarı ve çevre durumu nedir?">🦅 Kuş Radarı</button>
            <button type="button" class="akka-ai-chip" data-query="KIB-TEK blackout ve şebeke kurtarma durumu nedir?">⚡ Black Start &amp; Şebeke</button>
            <button type="button" class="akka-ai-chip" data-query="Finansal gelir ve kâr durumu nedir?">💰 Gelir &amp; Finans</button>
            <button type="button" class="akka-ai-chip" data-query="3D dijital ikiz ve simülasyonu aç">🎮 3D Simülasyon</button>
            <button type="button" class="akka-ai-chip" data-query="Bana en yakın türbin hangisi?">📍 En Yakın Türbin</button>
            <button type="button" class="akka-ai-chip" data-query="Şebeke stabilitesi nasıl?">⚡ Şebeke Dengesi</button>
          </div>
        </div>

        <form class="akka-ai-footer" id="akkaAiForm">
          <input class="akka-ai-input" id="akkaAiInput" type="text" placeholder="AKKA Soft AI'ya bir soru sorun" autocomplete="off" />
          <button class="akka-ai-send-btn" type="submit" aria-label="Gönder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
            </svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(root);
  }

  bindEvents() {
    const fab = document.getElementById('akkaAiFab');
    const closeBtn = document.getElementById('akkaAiCloseBtn');
    const clearBtn = document.getElementById('akkaAiClearBtn');
    const form = document.getElementById('akkaAiForm');
    const chips = document.querySelectorAll('.akka-ai-chip');

    fab?.addEventListener('click', () => this.toggleWindow());
    closeBtn?.addEventListener('click', () => this.closeWindow());

    clearBtn?.addEventListener('click', () => {
      this.history = [];
      sessionStorage.removeItem(STORAGE_KEY);
      const container = document.getElementById('akkaAiMessages');
      if (container) container.innerHTML = '';
      this.sendInitialGreeting();
    });

    const win = document.getElementById('akkaAiWindow');
    win?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-query]');
      if (btn) {
        const query = btn.dataset.query;
        if (query) {
          this.handleUserSubmit(query);
        }
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('akkaAiInput');
      const text = input ? input.value.trim() : '';
      if (!text) return;
      input.value = '';
      this.handleUserSubmit(text);
    });
  }

  toggleWindow() {
    if (this.isOpen) {
      this.closeWindow();
    } else {
      this.openWindow();
    }
  }

  openWindow() {
    this.isOpen = true;
    const win = document.getElementById('akkaAiWindow');
    const fab = document.getElementById('akkaAiFab');
    win?.classList.add('is-open');
    fab?.classList.add('is-open');
    const input = document.getElementById('akkaAiInput');
    setTimeout(() => input?.focus(), 150);
    this.scrollToBottom();
  }

  closeWindow() {
    this.isOpen = false;
    const win = document.getElementById('akkaAiWindow');
    const fab = document.getElementById('akkaAiFab');
    win?.classList.remove('is-open');
    fab?.classList.remove('is-open');
  }

  scrollToBottom() {
    const body = document.getElementById('akkaAiBody');
    if (body) {
      setTimeout(() => {
        body.scrollTop = body.scrollHeight;
      }, 30);
    }
  }

  handleUserSubmit(query) {
    this.addUserMessage(query);
    this.showTypingIndicator();

    setTimeout(() => {
      this.removeTypingIndicator();
      const responseHtml = this.generateResponse(query);
      this.addBotMessage(responseHtml, true);
      this.playChime();
    }, 450 + Math.random() * 300);
  }

  addUserMessage(text) {
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const msg = { sender: 'user', text, time };
    this.history.push(msg);
    this.renderMessageElement(msg);
    this.scrollToBottom();
  }

  addBotMessage(html) {
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const msg = { sender: 'bot', text: html, time };
    this.history.push(msg);
    this.renderMessageElement(msg);
    this.scrollToBottom();
  }

  renderMessageElement(msg) {
    const container = document.getElementById('akkaAiMessages');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `akka-msg ${msg.sender === 'user' ? 'is-user' : 'is-bot'}`;

    if (msg.sender === 'bot') {
      el.innerHTML = `
        <div class="akka-msg-avatar" aria-hidden="true">
          ${AKKA_AI_LOGO_SVG}
        </div>
        <div class="akka-msg-bubble">
          <div>${msg.text}</div>
          <span class="akka-msg-time">${msg.time}</span>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="akka-msg-bubble">
          <div>${this.escapeHtml(msg.text)}</div>
          <span class="akka-msg-time">${msg.time}</span>
        </div>
      `;
    }

    container.appendChild(el);
  }

  showTypingIndicator() {
    const container = document.getElementById('akkaAiMessages');
    if (!container || document.getElementById('akkaTypingIndicator')) return;

    const el = document.createElement('div');
    el.id = 'akkaTypingIndicator';
    el.className = 'akka-msg is-bot';
    el.innerHTML = `
      <div class="akka-msg-avatar" aria-hidden="true">
        ${AKKA_AI_LOGO_SVG}
      </div>
      <div class="akka-typing-indicator">
        <span class="akka-typing-dot"></span>
        <span class="akka-typing-dot"></span>
        <span class="akka-typing-dot"></span>
      </div>
    `;
    container.appendChild(el);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const el = document.getElementById('akkaTypingIndicator');
    el?.remove();
  }

  generateResponse(query) {
    const q = query.toLowerCase().trim();

    // Blackout & Otonom Black Start Şebeke Kurtarma
    if (q.includes('blackout') || q.includes('black start') || q.includes('çöküş') || q.includes('şebeke kurtarma') || q.includes('karanlık ada') || q.includes('sentetik atalet')) {
      return `
        ⚡ <strong>KIB-TEK BLACKOUT &amp; OTONOM BLACK START SİSTEMİ:</strong><br/>
        • <strong>Ada Şebeke Mimarisi:</strong> KKTC enterkonnektesiz izole bir adadır. Teknecik santrali devre dışı kaldığında şebeke frekansı 46,2 Hz'e düşerek tüm ada elektriksiz kalır (Blackout).<br/>
        • <strong>Yapay Zeka Black Start Protokolü:</strong> 19 Rüzgâr türbini <em>Grid-Forming Inverter (VSM)</em> moduna geçerek sıfırdan referans voltaj üretir ve şehirlere (Teknecik ➔ Lefkoşa ➔ Girne ➔ Mağusa) kademeli enerji verir.<br/>
        • <strong>Frekans Kilitlenme Süresi:</strong> 7,2 Saniye içinde 50,00 Hz nominal frekansa kilitlenir.<br/>
        <button type="button" class="akka-welcome-opt-btn" onclick="document.getElementById('blackoutSimBtn')?.click()" style="margin-top:6px; background:#4f46e5; color:#fff; border-color:#818cf8;">⚡ Blackout &amp; Şebeke Kurtarma Simülatörünü Aç</button>
      `;
    }

    // Kuş Göç Radarı & Otonom Koruma
    if (q.includes('kuş') || q.includes('radar') || q.includes('göç') || q.includes('turna') || q.includes('leylek') || q.includes('çevre') || q.includes('biyoçeşitlilik') || q.includes('identiflight')) {
      return `
        🦅 <strong>YAPAY ZEKA KUŞ GÖÇ RADARI &amp; OTONOM KORUMA:</strong><br/>
        • <strong>Mevcut Durum:</strong> Kıbrıs Beşparmak – Çamlıbel koridorunda Doppler radar aktif.<br/>
        • <strong>İzlenen Sürü:</strong> Göçmen Turna Sürüsü (~48 Birey · İrtifa: 125 m · Hız: 42 km/s).<br/>
        • <strong>Otonom Koruma Protokolü:</strong> Sürü türbine 1,5 km yaklaştığında rotor devri 14,7 RPM'den 1,8 RPM'e düşürülerek kanatlar bayraklanır (Soft Curtailment).<br/>
        • <strong>ESG Biyoçeşitlilik Skoru:</strong> %99,8 (Kurtarılan yaban hayatı: 142 birey · Önlenen çevre cezası: €45.000).<br/>
        <button type="button" class="akka-welcome-opt-btn" onclick="document.getElementById('birdRadarToggleBtn')?.click()" style="margin-top:6px; background:#059669; color:#fff; border-color:#34d399;">🦅 Kuş Radarını Haritada Aç / Canlandır</button>
      `;
    }

    // Yangın & Acil Durum Sistemi
    if (q.includes('yangın') || q.includes('acil') || q.includes('emergency') || q.includes('söndür') || q.includes('duman') || q.includes('alarm')) {
      return `
        🚨 <strong>YANGIN VE ACİL DURUM SİSTEMİ DEVREDE:</strong><br/>
        • <strong>Etkilenen Türbin:</strong> <span class="akka-metric-pill alert">WT-07 · Kalkanlı Sahası</span><br/>
        • <strong>Füzyon Teyidi:</strong> Çift Sensörle Doğrulandı (Duman: %22,4 | Stator: 84,8 °C | UV Alev: Pozitif)<br/>
        • <strong>Müdahale Talimatı:</strong> Yangın söndürme konsolunu açıp FirePro aerosol sistemini ateşleyin ve rotoru bayraklayın.<br/>
        <button type="button" class="akka-welcome-opt-btn" onclick="document.getElementById('emOpenModalBtn')?.click()" style="margin-top:6px; background:#ef4444; color:#fff; border-color:#dc2626;">🚨 Acil Durum Merkezini Konsolda Aç</button>
      `;
    }

    // 1. WT-07 & Arızalar
    if (q.includes('wt-07') || q.includes('arız') || q.includes('kritik') || q.includes('sıcaklık')) {
      return `
        🚨 <strong>WT-07 Kritik Alarm Analizi:</strong><br/>
        <strong>Konum:</strong> Güzelyurt – Kalkanlı Rüzgâr Sahası<br/>
        <strong>Tespit Edilen Anomali:</strong> Jeneratör stator yatak sıcaklığı <span class="akka-metric-pill alert">82,4 °C</span> (Kritik eşik: 80 °C).<br/>
        <strong>AKKA Soft Önerilen Aksiyon:</strong>
        <ul style="margin: 6px 0 6px 18px; padding:0;">
          <li>Mekanik yükü azaltmak için aerodinamik pitch açısını +4,5° kompanse edin.</li>
          <li>Kalkanlı saha servis ekibine WhatsApp acil müdahale talimatı iletildi.</li>
        </ul>
        <a href="./fault-center.html" style="display:inline-block; margin-top:4px; font-weight:700; color:#0284c7; text-decoration:none;">➔ Arıza Kontrol Merkezine Git</a>
      `;
    }

    // 2. Saha & Genel Durum
    if (q.includes('saha') || q.includes('özet') || q.includes('üretim') || q.includes('durum')) {
      return `
        📊 <strong>KKTC Rüzgâr Sahası Canlı Raporu:</strong><br/>
        • <strong>Türbin Durumu:</strong> <span class="akka-metric-pill success">15 Aktif</span> · <span class="akka-metric-pill">3 İncelemede</span> · <span class="akka-metric-pill alert">1 Kritik</span> (Toplam 19/19)<br/>
        • <strong>Anlık Üretim:</strong> <span class="akka-metric-pill">${KNOWLEDGE_BASE.currentProductionMW} MW</span> / 52,4 MW Kurulu Güç<br/>
        • <strong>Ortalama Rüzgâr:</strong> ${KNOWLEDGE_BASE.windSpeedAvg} (${KNOWLEDGE_BASE.windDirection})<br/>
        • <strong>Ada Şebekesi Katkısı:</strong> KIB-TEK toplam yükünün <strong>%31,4'ü</strong> yeşil enerjiden karşılanıyor.
      `;
    }

    // 3. Curtailment Arbitrajı (Hidrojen & AI Hesaplama)
    if (q.includes('arbitraj') || q.includes('hidrojen') || q.includes('gece') || q.includes('israf') || q.includes('ai')) {
      return `
        🔋 <strong>Sıfır Enerji İsrafı (Curtailment Arbitrajı):</strong><br/>
        Gece rüzgârı Beşparmak Dağları'nda zirve yaptığında ada tüketimi düşer. RüzgarGülü sistemi türbinleri kapatmak yerine fazla gücü dönüştürür:<br/>
        • <strong>Şebeke Fazlası:</strong> <span class="akka-metric-pill">${KNOWLEDGE_BASE.curtailment.excessMW} MW</span><br/>
        • <strong>Yeşil Hidrojen:</strong> %60 pay → <span class="akka-metric-pill success">${KNOWLEDGE_BASE.curtailment.h2Rate}</span><br/>
        • <strong>Yeşil AI Hesaplama:</strong> %40 pay → <span class="akka-metric-pill">${KNOWLEDGE_BASE.curtailment.aiCompute}</span><br/>
        • <strong>Ekonomik Getiri:</strong> ~${KNOWLEDGE_BASE.curtailment.dailySavings}<br/>
        <a href="./analytics.html" style="display:inline-block; margin-top:4px; font-weight:700; color:#0284c7; text-decoration:none;">➔ Enerji Arbitraj Paneline Git</a>
      `;
    }

    // 4. Rüzgâr & Hava & Radar
    if (q.includes('rüzgar') || q.includes('rüzgâr') || q.includes('hava') || q.includes('radar') || q.includes('akış')) {
      return `
        💨 <strong>Doppler Rüzgâr Akış Vektörü:</strong><br/>
        • <strong>Ana Yön:</strong> 245° Güneybatı (GB → KD akışı)<br/>
        • <strong>Koridor Hızları:</strong> Selvilitepe 10,4 m/s · Koruçam 9,4 m/s · Kantara 8,8 m/s<br/>
        • <strong>Fırtına Uyarı Durumu:</strong> Normal akış modunda. Harita üzerinden <em>Fırtına Modu</em> açılarak 21,8 m/s hamle vektörleri test edilebilir.
      `;
    }

    // 5. Simülasyon & Dijital İkiz
    if (q.includes('simülasyon') || q.includes('3d') || q.includes('ikiz') || q.includes('model')) {
      return `
        🎮 <strong>3D Dijital İkiz & Türbülans Simülasyonu:</strong><br/>
        Three.js tabanlı simülasyon merkezimizde Beşparmak Dağları'nın rotor arkasındaki türbülans izlerini (wake effect), rüzgâr hızına bağlı kule titreşimini ve kanat sapmalarını 3 boyutlu ortamda inceleyebilirsiniz.<br/>
        <a href="./simulasyon-merkezi.html" style="display:inline-block; margin-top:4px; font-weight:700; color:#0284c7; text-decoration:none;">➔ 3D Simülasyon Merkezini Aç</a>
      `;
    }

    // En Yakın Türbin
    if (q.includes('yakın') || q.includes('mesafe') || q.includes('nerede')) {
      return `
        📍 <strong>Konumunuza Göre En Yakın Türbin:</strong><br/>
        • <strong>En Yakın Ünite:</strong> <span class="akka-metric-pill">WT-03 · Çamlıbel - Hisarköy Rüzgâr Geçidi</span><br/>
        • <strong>Kuş Uçuşu / Karayolu:</strong> ~4,2 km / ~5,8 km (~8 dk sürüş)<br/>
        • <strong>Saha Güzergâhı:</strong> Güzelyurt – Çamlıbel Anayolu → Hisarköy Dağ Geçidi Servis Yolu<br/>
        • <strong>Anlık Üretim:</strong> 1,84 MW (İletişim Senkronize)<br/>
        <a href="./dashboard.html" style="display:inline-block; margin-top:4px; font-weight:700; color:#0284c7; text-decoration:none;">➔ Haritada Göster &amp; Yol Tarifi Al</a>
      `;
    }

    // KIB-TEK Şebekesi
    if (q.includes('kib-tek') || q.includes('şebeke') || q.includes('stabilite') || q.includes('frekans')) {
      return `
        ⚡ <strong>KIB-TEK Ada Şebeke Entegrasyonu:</strong><br/>
        • <strong>Ada Anlık Yükü:</strong> ~112 MW (Gece baz tüketim seviyesi)<br/>
        • <strong>Rüzgâr Penetrasyon Oranı:</strong> <span class="akka-metric-pill success">%31,4</span><br/>
        • <strong>Şebeke Frekansı:</strong> 50,02 Hz (Nominal Dengeli)<br/>
        • <strong>Dengeleme Protokolü:</strong> 14,8 MW şebeke fazlası Teknecik Yeşil Hidrojen elektrolizörüne ve AI veri kümesine aktarılarak ada şebekesinde çökme riski önlenmiştir.
      `;
    }

    // 6. Finans & Gelir
    if (q.includes('gelir') || q.includes('para') || q.includes('finans') || q.includes('kazanç') || q.includes('tl') || q.includes('₺')) {
      return `
        💰 <strong>Finansal Getiri Analizi:</strong><br/>
        • <strong>KIB-TEK Satış Fiyatı:</strong> ₺3,00 / kWh<br/>
        • <strong>Günlük Tahmini Üretim Geliri:</strong> <span class="akka-metric-pill success">₺184.250</span><br/>
        • <strong>Haftalık Projeksiyon:</strong> ~₺1.280.000<br/>
        • <strong>Önlenen CO₂ Kredisi Değeri:</strong> ~₺14.600/gün
      `;
    }

    // 7. Kimsin / Sen Nesin
    if (q.includes('kimsin') || q.includes('nesin') || q.includes('yardım') || q.includes('neler yapabilirsin')) {
      return `
        🤖 <strong>AKKA Soft AI Hakkında:</strong><br/>
        Ben RüzgarGülü ekosistemi için geliştirilmiş endüstriyel karar destek ajanıyım. KKTC rüzgâr türbinlerinin SCADA verilerini, jeneratör sıcaklıklarını, rüzgâr akış koridorlarını ve şebeke arbitraj fırsatlarını 7/24 analiz edip saha mühendislerine rehberlik ederim.
      `;
    }

    // Genel / Akıllı Fallback
    return `
      💡 Sorunuzu SCADA veri tabanında değerlendirdim: <em>"${this.escapeHtml(query)}"</em>.<br/><br/>
      Şu an KKTC sahasındaki <strong>19 türbinin 15'i aktif</strong> ve toplamda <strong>${KNOWLEDGE_BASE.currentProductionMW} MW</strong> temiz güç üretiyor. WT-07'deki sıcaklık uyarısı dışında tüm şebeke senkron çalışmaktadır.<br/><br/>
      İlgili modüllere göz atabilirsiniz:
      • <a href="./dashboard.html" style="color:#0284c7; font-weight:600;">Harita & Canlı Akış</a><br/>
      • <a href="./fault-center.html" style="color:#0284c7; font-weight:600;">Arıza Müdahale</a><br/>
      • <a href="./analytics.html" style="color:#0284c7; font-weight:600;">Enerji & Arbitraj Analizi</a>
    `;
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }


}

// Otomatik başlatma
export function initAkkaSoftAi() {
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new AkkaSoftAiAssistant());
    } else {
      new AkkaSoftAiAssistant();
    }
  }
}

initAkkaSoftAi();
