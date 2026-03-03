// input.js — Keyboard handler with DAS (Delayed Auto Shift)

const DAS_DELAY = 170;  // ms before auto-repeat starts
const DAS_RATE = 50;    // ms between auto-repeats

// Action mappings
const KEY_MAP = {
  'ArrowLeft':  'left',
  'ArrowRight': 'right',
  'ArrowDown':  'soft_drop',
  'ArrowUp':    'rotate_cw',
  'a':          'left',
  'd':          'right',
  's':          'soft_drop',
  'w':          'rotate_cw',
  'z':          'rotate_ccw',
  ' ':          'hard_drop',
  'Escape':     'pause',
  'Enter':      'start',
  'm':          'mute'
};

// Actions that repeat with DAS
const REPEATABLE = new Set(['left', 'right', 'soft_drop']);

export class Input {
  constructor() {
    this.actions = [];         // queue consumed by main.js each frame
    this.held = {};            // key → { action, timer, repeating }
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    const action = KEY_MAP[e.key];
    if (!action) return;
    e.preventDefault();

    if (!this.held[e.key]) {
      this.actions.push(action);
      this.held[e.key] = { action, timer: 0, repeating: false };
    }
  }

  _onKeyUp(e) {
    delete this.held[e.key];
  }

  update(dt) {
    for (const key in this.held) {
      const h = this.held[key];
      if (!REPEATABLE.has(h.action)) continue;

      h.timer += dt;
      if (!h.repeating) {
        if (h.timer >= DAS_DELAY) {
          h.repeating = true;
          h.timer -= DAS_DELAY;
          this.actions.push(h.action);
        }
      } else {
        while (h.timer >= DAS_RATE) {
          h.timer -= DAS_RATE;
          this.actions.push(h.action);
        }
      }
    }
  }

  drain() {
    const a = this.actions;
    this.actions = [];
    return a;
  }
}
