// game.js — Pure Tetris logic (no DOM)

const COLS = 10;
const ROWS = 22; // 20 visible + 2 hidden above
const VISIBLE_ROWS = 20;

// Tetromino definitions: cells relative to rotation center
// Each piece has 4 rotation states (0=spawn, 1=CW, 2=180, 3=CCW)
const PIECES = {
  I: {
    cells: [
      [[0,-1],[0,0],[0,1],[0,2]],
      [[-1,1],[0,1],[1,1],[2,1]],
      [[1,-1],[1,0],[1,1],[1,2]],
      [[-1,0],[0,0],[1,0],[2,0]]
    ],
    color: 'i'
  },
  O: {
    cells: [
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]]
    ],
    color: 'o'
  },
  T: {
    cells: [
      [[0,-1],[0,0],[0,1],[-1,0]],
      [[-1,0],[0,0],[1,0],[0,1]],
      [[0,-1],[0,0],[0,1],[1,0]],
      [[-1,0],[0,0],[1,0],[0,-1]]
    ],
    color: 't'
  },
  S: {
    cells: [
      [[0,-1],[0,0],[-1,0],[-1,1]],
      [[-1,0],[0,0],[0,1],[1,1]],
      [[1,-1],[1,0],[0,0],[0,1]],
      [[-1,-1],[0,-1],[0,0],[1,0]]
    ],
    color: 's'
  },
  Z: {
    cells: [
      [[-1,-1],[-1,0],[0,0],[0,1]],
      [[0,0],[1,0],[-1,1],[0,1]],
      [[0,-1],[0,0],[1,0],[1,1]],
      [[0,-1],[1,-1],[-1,0],[0,0]]
    ],
    color: 'z'
  },
  L: {
    cells: [
      [[-1,1],[0,-1],[0,0],[0,1]],
      [[-1,0],[0,0],[1,0],[1,1]],
      [[0,-1],[0,0],[0,1],[1,-1]],
      [[-1,-1],[-1,0],[0,0],[1,0]]
    ],
    color: 'l'
  },
  J: {
    cells: [
      [[-1,-1],[0,-1],[0,0],[0,1]],
      [[-1,0],[0,0],[1,0],[-1,1]],
      [[0,-1],[0,0],[0,1],[1,1]],
      [[1,-1],[-1,0],[0,0],[1,0]]
    ],
    color: 'j'
  }
};

// SRS wall kick data
// Key: "fromRotation>toRotation"
const WALL_KICKS = {
  '0>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1>0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1>2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '2>1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '3>2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3>0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '0>3': [[0,0],[1,0],[1,-1],[0,2],[1,2]]
};

const I_WALL_KICKS = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]]
};

// Gravity speed table (ms per drop) — approximating NES Tetris
const GRAVITY = [
  800, 720, 630, 550, 470, 380, 300, 220, 130, 100,
  83, 83, 83, 67, 67, 67, 50, 50, 50, 33,
  33, 33, 33, 33, 33, 33, 33, 33, 33, 17
];

// Scoring (NES-style)
const LINE_SCORES = [0, 40, 100, 300, 1200];

const LOCK_DELAY = 500;
const MAX_LOCK_RESETS = 15;

const PIECE_NAMES = ['I','O','T','S','Z','L','J'];

export class Game {
  constructor() {
    this.reset();
  }

  reset() {
    // Board: rows x cols, null = empty, string = color key
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.score = 0;
    this.lines = 0;
    this.level = 0;
    this.bag = [];
    this.current = null;    // { type, rotation, row, col }
    this.nextType = null;
    this.gameOver = false;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.locking = false;
    this.clearingLines = null; // array of row indices being cleared
    this.clearTimer = 0;

    this._fillBag();
    this.nextType = this._pullFromBag();
    this._spawnPiece();
  }

  _fillBag() {
    if (this.bag.length <= 0) {
      const b = [...PIECE_NAMES];
      // Fisher-Yates shuffle
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      this.bag = b;
    }
  }

  _pullFromBag() {
    this._fillBag();
    return this.bag.pop();
  }

  _spawnPiece() {
    const type = this.nextType;
    this.nextType = this._pullFromBag();
    this.current = {
      type,
      rotation: 0,
      row: 0,  // top of board (hidden rows)
      col: Math.floor(COLS / 2) - 1
    };
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.locking = false;

    // Check if spawn position is blocked → game over
    if (!this._fits(this.current.type, this.current.rotation, this.current.row, this.current.col)) {
      this.gameOver = true;
    }
  }

  _getCells(type, rotation) {
    return PIECES[type].cells[rotation];
  }

  _fits(type, rotation, row, col) {
    const cells = this._getCells(type, rotation);
    for (const [dr, dc] of cells) {
      const r = row + dr;
      const c = col + dc;
      if (c < 0 || c >= COLS || r >= ROWS) return false;
      if (r < 0) continue; // above board is OK
      if (this.board[r][c] !== null) return false;
    }
    return true;
  }

  _getColor(type) {
    return PIECES[type].color;
  }

  // Get absolute cell positions of current piece
  getCurrentCells() {
    if (!this.current) return [];
    const cells = this._getCells(this.current.type, this.current.rotation);
    return cells.map(([dr, dc]) => [this.current.row + dr, this.current.col + dc]);
  }

  // Get ghost piece position (hard drop preview)
  getGhostRow() {
    if (!this.current) return 0;
    let row = this.current.row;
    while (this._fits(this.current.type, this.current.rotation, row + 1, this.current.col)) {
      row++;
    }
    return row;
  }

  getGhostCells() {
    if (!this.current) return [];
    const ghostRow = this.getGhostRow();
    const cells = this._getCells(this.current.type, this.current.rotation);
    return cells.map(([dr, dc]) => [ghostRow + dr, this.current.col + dc]);
  }

  getNextPieceCells() {
    if (!this.nextType) return [];
    return PIECES[this.nextType].cells[0];
  }

  getNextColor() {
    return this.nextType ? PIECES[this.nextType].color : null;
  }

  // Movement
  moveLeft() {
    if (!this.current || this.gameOver || this.clearingLines) return false;
    if (this._fits(this.current.type, this.current.rotation, this.current.row, this.current.col - 1)) {
      this.current.col--;
      this._resetLock();
      return true;
    }
    return false;
  }

  moveRight() {
    if (!this.current || this.gameOver || this.clearingLines) return false;
    if (this._fits(this.current.type, this.current.rotation, this.current.row, this.current.col + 1)) {
      this.current.col++;
      this._resetLock();
      return true;
    }
    return false;
  }

  softDrop() {
    if (!this.current || this.gameOver || this.clearingLines) return false;
    if (this._fits(this.current.type, this.current.rotation, this.current.row + 1, this.current.col)) {
      this.current.row++;
      this.score += 1;
      this.gravityTimer = 0;
      this._resetLock();
      return true;
    }
    return false;
  }

  hardDrop() {
    if (!this.current || this.gameOver || this.clearingLines) return [];
    const events = [];
    let dropped = 0;
    while (this._fits(this.current.type, this.current.rotation, this.current.row + 1, this.current.col)) {
      this.current.row++;
      dropped++;
    }
    this.score += dropped * 2;
    events.push(...this._lockPiece());
    return events;
  }

  rotateCW() {
    return this._rotate(1);
  }

  rotateCCW() {
    return this._rotate(-1);
  }

  _rotate(direction) {
    if (!this.current || this.gameOver || this.clearingLines) return false;
    const { type, rotation, row, col } = this.current;
    const newRotation = (rotation + direction + 4) % 4;
    const kickKey = `${rotation}>${newRotation}`;
    const kicks = type === 'I' ? I_WALL_KICKS[kickKey] : WALL_KICKS[kickKey];

    if (!kicks) return false;

    for (const [dCol, dRow] of kicks) {
      // SRS kicks: [dx, dy] where dx=col offset, dy=row offset (positive = up in SRS)
      const newRow = row - dRow;
      const newCol = col + dCol;
      if (this._fits(type, newRotation, newRow, newCol)) {
        this.current.rotation = newRotation;
        this.current.row = newRow;
        this.current.col = newCol;
        this._resetLock();
        return true;
      }
    }
    return false;
  }

  _resetLock() {
    if (this.locking && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  _lockPiece() {
    const events = [];
    const color = this._getColor(this.current.type);
    const cells = this.getCurrentCells();

    for (const [r, c] of cells) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        this.board[r][c] = color;
      }
    }

    events.push('lock');

    // Check for completed lines
    const fullRows = [];
    for (let r = 0; r < ROWS; r++) {
      if (this.board[r].every(cell => cell !== null)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      this.clearingLines = fullRows;
      this.clearTimer = 0;

      const cleared = fullRows.length;
      this.score += LINE_SCORES[cleared] * (this.level + 1);
      this.lines += cleared;

      const newLevel = Math.floor(this.lines / 10);
      if (newLevel > this.level) {
        this.level = newLevel;
        events.push('level_up');
      }

      if (cleared === 4) {
        events.push('tetris');
      } else {
        events.push('clear');
      }
    } else {
      this._spawnPiece();
      if (this.gameOver) events.push('gameover');
    }

    return events;
  }

  _removeLines() {
    if (!this.clearingLines) return;
    // Remove full rows from top to bottom
    for (const r of this.clearingLines.sort((a, b) => a - b)) {
      this.board.splice(r, 1);
      this.board.unshift(Array(COLS).fill(null));
    }
    this.clearingLines = null;
    this.clearTimer = 0;
    this._spawnPiece();
  }

  // Main update — call each frame with dt in ms
  // Returns array of events
  update(dt) {
    if (this.gameOver) return [];
    const events = [];

    // Handle line clear animation
    if (this.clearingLines) {
      this.clearTimer += dt;
      if (this.clearTimer >= 400) {
        this._removeLines();
        if (this.gameOver) events.push('gameover');
      }
      return events;
    }

    if (!this.current) return events;

    // Gravity
    const speed = GRAVITY[Math.min(this.level, GRAVITY.length - 1)];
    this.gravityTimer += dt;

    if (this.gravityTimer >= speed) {
      this.gravityTimer -= speed;
      if (this._fits(this.current.type, this.current.rotation, this.current.row + 1, this.current.col)) {
        this.current.row++;
        this.locking = false;
        this.lockTimer = 0;
      } else {
        // Start or continue lock delay
        if (!this.locking) {
          this.locking = true;
          this.lockTimer = 0;
        }
      }
    }

    // Lock delay
    if (this.locking) {
      // Check if piece can still fall (moved off ledge)
      if (this._fits(this.current.type, this.current.rotation, this.current.row + 1, this.current.col)) {
        this.locking = false;
        this.lockTimer = 0;
      } else {
        this.lockTimer += dt;
        if (this.lockTimer >= LOCK_DELAY) {
          const lockEvents = this._lockPiece();
          events.push(...lockEvents);
        }
      }
    }

    return events;
  }

  // Board state for renderer (visible rows only)
  getVisibleBoard() {
    return this.board.slice(ROWS - VISIBLE_ROWS);
  }
}

export { COLS, VISIBLE_ROWS, PIECES };
