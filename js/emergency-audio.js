/**
 * RüzgarGülü - Endüstriyel Acil Durum Ses Motoru (Web Audio API)
 * Yangın ve Kritik Acil Durumlar için "DINT DINT DINT – DINT DINT DINT" Ritimli Endüstriyel Siren
 */

class EmergencyAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.volume = 0.75;
    this.isPlaying = false;
    this.loopTimer = null;
    this.isUnlocked = false;

    this.initUnlockListener();
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  initUnlockListener() {
    const unlock = () => {
      this.initContext();
      this.isUnlocked = true;
      ['click', 'keydown', 'touchstart'].forEach((evt) => {
        document.removeEventListener(evt, unlock);
      });
    };
    ['click', 'keydown', 'touchstart'].forEach((evt) => {
      document.addEventListener(evt, unlock, { once: true });
    });
  }

  /**
   * "DINT" Tekil Endüstriyel Piezo Vuruşu
   * @param {number} startTime 
   */
  playSingleDint(startTime) {
    if (!this.audioCtx || this.isMuted) return;

    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    // Endüstriyel çift ton: 880 Hz (A5) ve 660 Hz (E5) armonik çan tonu
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(880, startTime);
    osc1.frequency.exponentialRampToValueAtTime(740, startTime + 0.12);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, startTime);
    osc2.frequency.exponentialRampToValueAtTime(580, startTime + 0.12);

    // Keskin vuruş (Attack) ve hızlı sönümleme (Decay)
    const effectiveVol = Math.max(0.001, this.volume * 0.35);
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.linearRampToValueAtTime(effectiveVol, startTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc1.start(startTime);
    osc1.stop(startTime + 0.16);
    osc2.start(startTime);
    osc2.stop(startTime + 0.16);
  }

  /**
   * "DINT DINT DINT – DINT DINT DINT" 3'lü Seri ve Boşluk Döngüsü
   */
  triggerRhythmCycle() {
    if (!this.isPlaying || this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime + 0.05;

    // 1. Grup: DINT - DINT - DINT (0s, 0.22s, 0.44s)
    this.playSingleDint(now + 0.00);
    this.playSingleDint(now + 0.22);
    this.playSingleDint(now + 0.44);

    // Kısa nefes: 0.32s boşluk

    // 2. Grup: DINT - DINT - DINT (0.80s, 1.02s, 1.24s)
    this.playSingleDint(now + 0.80);
    this.playSingleDint(now + 1.02);
    this.playSingleDint(now + 1.24);

    // Toplam periyot 2.2 saniyede bir tekrarlanır
    this.loopTimer = setTimeout(() => {
      if (this.isPlaying) {
        this.triggerRhythmCycle();
      }
    }, 2200);
  }

  startAlarm() {
    if (this.isPlaying) return; // Çift ses çakışmasını engelle
    this.isPlaying = true;
    this.initContext();
    this.triggerRhythmCycle();
  }

  stopAlarm() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.isMuted) {
      this.stopAlarm();
    } else {
      this.startAlarm();
    }
    return this.isMuted;
  }

  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val) || 0));
  }
}

export const emergencyAudio = new EmergencyAudioEngine();

