// Web Audio API Synthesizer for Rest Timer and Set Checkmarks
class SoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep(freq = 880, type = 'sine', duration = 0.15, vol = 0.25) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Sound playback prevented:", e);
    }
  }

  playSetCheck() {
    this.playBeep(1046.5, 'sine', 0.1, 0.2); // C6 note
  }

  playTimerDone() {
    // 3 rhythmic energetic high notes (Nike/Hevy style)
    try {
      this.init();
      const notes = [659.25, 880, 1318.5]; // E5, A5, E6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playBeep(freq, 'triangle', 0.22, 0.35);
        }, idx * 160);
      });
    } catch (e) {}
  }
}

export const sounds = new SoundManager();

