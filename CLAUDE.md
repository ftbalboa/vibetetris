# vibetetris

Tetris web game. Part of la triada Eterea: pixelyuna (graphics), soundtidus (audio), vibetetris (game).

## Stack
- HTML5 Canvas + vanilla ES modules (zero npm dependencies)
- PNGs from pixelyuna (.sprite → PNG)
- WAVs from soundtidus (.sound/.track → WAV)
- Build script calls sibling tools via child_process

## Project Structure
```
src/
  game.js       — Core logic: board 10x20, SRS rotation, scoring
  renderer.js   — Canvas rendering with PNG sprites
  audio.js      — Web Audio API for WAV playback
  input.js      — Keyboard + DAS (Delayed Auto Shift)
  main.js       — Game loop, state machine
sprites/        — .sprite source files (8x8px per cell)
sounds/         — .sound source files (SFX)
tracks/         — .track source files (BGM)
scripts/
  build.js      — Orchestrator: calls pixelyuna + soundtidus CLIs
dist/           — Compiled output (.gitignored)
  sprites/      — PNGs (--scale 4 → 32x32)
  audio/        — WAVs
index.html      — Game page
style.css       — Retro minimal styling
```

## Build
```bash
npm run build           # Compile all sprites + audio
npm run build:sprites   # Sprites only
npm run build:audio     # Audio only
```

## Key Conventions
- Zero runtime dependencies — vanilla JS, no bundler
- Sprites compiled at 4x scale (8px → 32px cells)
- Canvas layout: 480×672 (board + UI panel)
- NES-style scoring: single=40, double=100, triple=300, tetris=1200 × (level+1)
- SRS rotation with wall kicks
- 7-bag randomizer
