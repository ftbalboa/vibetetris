// audio.js — Web Audio API for WAV playback

const SFX_NAMES = ['move','rotate','soft_drop','hard_drop','lock','line_clear','tetris_clear','level_up','game_over'];
const MUSIC_NAMES = ['theme_a'];

export class Audio {
  constructor() {
    this.ctx = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.buffers = {};     // name → AudioBuffer
    this.musicSource = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.4;
    this.musicGain.connect(this.ctx.destination);

    this.initialized = true;
    this._loadAll();
  }

  async _loadAll() {
    const all = [...SFX_NAMES, ...MUSIC_NAMES];
    await Promise.all(all.map(name => this._loadWAV(name)));
  }

  async _loadWAV(name) {
    try {
      const resp = await fetch(`dist/audio/${name}.wav`);
      const arrayBuf = await resp.arrayBuffer();
      this.buffers[name] = await this.ctx.decodeAudioData(arrayBuf);
    } catch (e) {
      console.warn(`Failed to load audio: ${name}`, e);
    }
  }

  playSFX(name) {
    if (!this.initialized || !this.buffers[name]) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[name];
    source.connect(this.sfxGain);
    source.start(0);
  }

  playMusic(name) {
    if (!this.initialized) return;
    this.stopMusic();
    if (!this.buffers[name]) {
      // Buffer might not be loaded yet, retry after a short delay
      setTimeout(() => this.playMusic(name), 200);
      return;
    }
    this.musicSource = this.ctx.createBufferSource();
    this.musicSource.buffer = this.buffers[name];
    this.musicSource.loop = true;
    this.musicSource.connect(this.musicGain);
    this.musicSource.start(0);
  }

  stopMusic() {
    if (this.musicSource) {
      try { this.musicSource.stop(); } catch (e) { /* already stopped */ }
      this.musicSource = null;
    }
  }

  pauseMusic() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  resumeMusic() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.initialized) {
      this.sfxGain.gain.value = this.muted ? 0 : 0.6;
      this.musicGain.gain.value = this.muted ? 0 : 0.4;
    }
  }
}
