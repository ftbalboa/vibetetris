// main.js — Game loop + state machine

import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Audio } from './audio.js';

// States: menu → playing → gameover → menu
//                ↕ paused
const STATES = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover' };

class Main {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.audio = new Audio();
    this.game = new Game();
    this.state = STATES.MENU;
    this.lastTime = 0;
  }

  async init() {
    await this.renderer.loadSprites();
    this.input.attach();
    requestAnimationFrame(t => this.loop(t));
  }

  loop(timestamp) {
    const dt = this.lastTime ? Math.min(timestamp - this.lastTime, 50) : 0; // cap at 50ms
    this.lastTime = timestamp;

    this.input.update(dt);
    const actions = this.input.drain();

    this._handleActions(actions);

    if (this.state === STATES.PLAYING) {
      const events = this.game.update(dt);
      this._handleEvents(events);

      // Update line clear animation
      if (this.game.clearingLines) {
        const progress = this.game.clearTimer / 400;
        this.renderer.setClearAnimation(this.game.clearingLines, progress);
      } else {
        this.renderer.clearClearAnimation();
      }
    }

    this.renderer.render(this.game, this.state);
    requestAnimationFrame(t => this.loop(t));
  }

  _handleActions(actions) {
    for (const action of actions) {
      switch (this.state) {
        case STATES.MENU:
          if (action === 'start') {
            this.game.reset();
            this.state = STATES.PLAYING;
            this.audio.init();
            this.audio.playMusic('theme_a');
          }
          break;

        case STATES.PLAYING:
          this._handlePlayingAction(action);
          break;

        case STATES.PAUSED:
          if (action === 'pause') {
            this.state = STATES.PLAYING;
            this.audio.resumeMusic();
          }
          if (action === 'mute') {
            this.audio.toggleMute();
          }
          break;

        case STATES.GAMEOVER:
          if (action === 'start') {
            this.game.reset();
            this.state = STATES.PLAYING;
            this.audio.playMusic('theme_a');
          }
          break;
      }
    }
  }

  _handlePlayingAction(action) {
    switch (action) {
      case 'left':
        if (this.game.moveLeft()) this.audio.playSFX('move');
        break;
      case 'right':
        if (this.game.moveRight()) this.audio.playSFX('move');
        break;
      case 'soft_drop':
        if (this.game.softDrop()) this.audio.playSFX('soft_drop');
        break;
      case 'hard_drop': {
        const events = this.game.hardDrop();
        this.audio.playSFX('hard_drop');
        this._handleEvents(events);
        break;
      }
      case 'rotate_cw':
        if (this.game.rotateCW()) this.audio.playSFX('rotate');
        break;
      case 'rotate_ccw':
        if (this.game.rotateCCW()) this.audio.playSFX('rotate');
        break;
      case 'pause':
        this.state = STATES.PAUSED;
        this.audio.pauseMusic();
        break;
      case 'mute':
        this.audio.toggleMute();
        break;
    }
  }

  _handleEvents(events) {
    for (const event of events) {
      switch (event) {
        case 'lock':
          this.audio.playSFX('lock');
          break;
        case 'clear':
          this.audio.playSFX('line_clear');
          break;
        case 'tetris':
          this.audio.playSFX('tetris_clear');
          break;
        case 'level_up':
          this.audio.playSFX('level_up');
          break;
        case 'gameover':
          this.state = STATES.GAMEOVER;
          this.audio.stopMusic();
          this.audio.playSFX('game_over');
          break;
      }
    }
  }
}

const app = new Main();
app.init().catch(err => console.error('Failed to init:', err));
