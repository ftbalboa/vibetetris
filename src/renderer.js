// renderer.js — Canvas rendering with PNG sprites

import { COLS, VISIBLE_ROWS, PIECES } from './game.js';

const CELL = 32;   // 8px sprite × 4 scale
const PAD = 16;
const GAP = 16;
const BOARD_W = COLS * CELL;          // 320
const BOARD_H = VISIBLE_ROWS * CELL;  // 640
const PANEL_W = 112;
const CANVAS_W = PAD + BOARD_W + GAP + PANEL_W + PAD;  // 480
const CANVAS_H = PAD + BOARD_H + PAD;                   // 672

const SPRITE_NAMES = ['block_i','block_o','block_t','block_s','block_z','block_l','block_j','block_ghost','logo'];

// Map piece color key to sprite name
const COLOR_TO_SPRITE = {
  i: 'block_i', o: 'block_o', t: 'block_t', s: 'block_s',
  z: 'block_z', l: 'block_l', j: 'block_j'
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = {};
    this.loaded = false;
    this.clearFlash = 0;   // 0-1 animation progress
    this.clearRows = null;
  }

  async loadSprites() {
    const promises = SPRITE_NAMES.map(name => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { this.sprites[name] = img; resolve(); };
        img.onerror = () => reject(new Error(`Failed to load sprite: ${name}`));
        img.src = `dist/sprites/${name}.png`;
      });
    });
    await Promise.all(promises);
    this.loaded = true;
  }

  setClearAnimation(rows, progress) {
    this.clearRows = rows;
    this.clearFlash = progress;
  }

  clearClearAnimation() {
    this.clearRows = null;
    this.clearFlash = 0;
  }

  render(game, state) {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (state === 'menu') {
      this._drawMenu();
      return;
    }

    this._drawBoard(game);
    this._drawPanel(game);

    if (state === 'paused') {
      this._drawOverlay('PAUSED', 'Press ESC to resume');
    } else if (state === 'gameover') {
      this._drawOverlay('GAME OVER', 'Press ENTER to restart');
    }
  }

  _drawMenu() {
    const ctx = this.ctx;

    // Draw logo centered
    if (this.sprites.logo) {
      const logo = this.sprites.logo;
      const scale = 3;
      const w = logo.width * scale;
      const h = logo.height * scale;
      const x = (CANVAS_W - w) / 2;
      const y = 160;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(logo, x, y, w, h);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press ENTER to start', CANVAS_W / 2, 360);

    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('Arrows/WASD: Move', CANVAS_W / 2, 430);
    ctx.fillText('Up/W: Rotate CW  Z: Rotate CCW', CANVAS_W / 2, 450);
    ctx.fillText('Space: Hard Drop  Down/S: Soft Drop', CANVAS_W / 2, 470);
    ctx.fillText('ESC: Pause  M: Mute', CANVAS_W / 2, 490);

    ctx.fillStyle = '#555555';
    ctx.font = '10px monospace';
    ctx.fillText('Part of the Eterea ecosystem', CANVAS_W / 2, 560);
    ctx.fillText('pixelyuna + soundtidus + vibetetris', CANVAS_W / 2, 575);
    ctx.textAlign = 'left';
  }

  _drawBoard(game) {
    const ctx = this.ctx;
    const ox = PAD;
    const oy = PAD;

    // Board background
    ctx.fillStyle = '#111111';
    ctx.fillRect(ox, oy, BOARD_W, BOARD_H);

    // Grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(ox + c * CELL, oy);
      ctx.lineTo(ox + c * CELL, oy + BOARD_H);
      ctx.stroke();
    }
    for (let r = 1; r < VISIBLE_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + r * CELL);
      ctx.lineTo(ox + BOARD_W, oy + r * CELL);
      ctx.stroke();
    }

    // Placed blocks
    const board = game.getVisibleBoard();
    for (let r = 0; r < VISIBLE_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = board[r][c];
        if (color) {
          // Check if this row is being cleared
          const boardRow = r + (22 - VISIBLE_ROWS); // actual board row
          if (this.clearRows && this.clearRows.includes(boardRow)) {
            // Flash animation
            if (this.clearFlash < 0.5) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(ox + c * CELL, oy + r * CELL, CELL, CELL);
            }
            // else fade out (don't draw)
          } else {
            this._drawCell(ox + c * CELL, oy + r * CELL, color);
          }
        }
      }
    }

    // Ghost piece
    if (game.current && !game.gameOver && !game.clearingLines) {
      const ghostCells = game.getGhostCells();
      ctx.globalAlpha = 0.3;
      for (const [r, c] of ghostCells) {
        const vr = r - (22 - VISIBLE_ROWS);
        if (vr >= 0 && vr < VISIBLE_ROWS) {
          this._drawCell(ox + c * CELL, oy + vr * CELL, 'ghost');
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // Current piece
    if (game.current && !game.gameOver && !game.clearingLines) {
      const cells = game.getCurrentCells();
      const color = game.current.type.toLowerCase();
      const pieceColor = PIECES[game.current.type].color;
      for (const [r, c] of cells) {
        const vr = r - (22 - VISIBLE_ROWS);
        if (vr >= 0 && vr < VISIBLE_ROWS) {
          this._drawCell(ox + c * CELL, oy + vr * CELL, pieceColor);
        }
      }
    }

    // Board border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox - 1, oy - 1, BOARD_W + 2, BOARD_H + 2);
  }

  _drawCell(x, y, colorKey) {
    const spriteName = colorKey === 'ghost' ? 'block_ghost' : COLOR_TO_SPRITE[colorKey];
    const sprite = this.sprites[spriteName];
    if (sprite) {
      this.ctx.drawImage(sprite, x, y, CELL, CELL);
    }
  }

  _drawPanel(game) {
    const ctx = this.ctx;
    const px = PAD + BOARD_W + GAP;
    const py = PAD;

    // NEXT label
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('NEXT', px, py + 16);

    // Next piece preview
    if (game.nextType) {
      const cells = game.getNextPieceCells();
      const color = game.getNextColor();
      const previewOx = px + 8;
      const previewOy = py + 28;
      const previewCell = 20;
      for (const [dr, dc] of cells) {
        const spriteName = COLOR_TO_SPRITE[color];
        const sprite = this.sprites[spriteName];
        if (sprite) {
          ctx.drawImage(sprite, previewOx + (dc + 1) * previewCell, previewOy + (dr + 1) * previewCell, previewCell, previewCell);
        }
      }
    }

    // Score
    const statsY = py + 140;
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('SCORE', px, statsY);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(String(game.score).padStart(8, '0'), px, statsY + 20);

    // Lines
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('LINES', px, statsY + 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(String(game.lines).padStart(4, '0'), px, statsY + 72);

    // Level
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('LEVEL', px, statsY + 104);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(String(game.level).padStart(2, '0'), px, statsY + 124);
  }

  _drawOverlay(title, subtitle) {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, CANVAS_W / 2, CANVAS_H / 2 - 16);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px monospace';
    ctx.fillText(subtitle, CANVAS_W / 2, CANVAS_H / 2 + 16);
    ctx.textAlign = 'left';
  }
}

export { CANVAS_W, CANVAS_H };
