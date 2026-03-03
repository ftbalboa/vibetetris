# vibetetris

Tetris web game — just bytes, zero dependencies.

Part of the Eterea ecosystem: **pixelyuna** (graphics) + **soundtidus** (audio) + **vibetetris** (game).

## Play

```bash
npm run build
```

Then open `index.html` in a browser (needs a local server for ES modules):

```bash
npx serve .
```

## Controls

| Key | Action |
|---|---|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Arrow Down / S | Soft drop |
| Arrow Up / W | Rotate clockwise |
| Z | Rotate counter-clockwise |
| Space | Hard drop |
| Escape | Pause / Resume |
| M | Mute / Unmute |
| Enter | Start / Restart |

## Features

- Classic Tetris gameplay with SRS rotation + wall kicks
- 7-bag randomizer
- NES-style scoring (single/double/triple/tetris)
- Ghost piece preview
- Next piece display
- Level progression (speed increases every 10 lines)
- Lock delay with move/rotate reset
- Chiptune BGM + retro SFX
- DAS (Delayed Auto Shift) for smooth movement

## Stack

- **Rendering**: HTML5 Canvas + vanilla ES modules
- **Graphics**: PNGs compiled with pixelyuna (8x8 sprites at 4x scale)
- **Audio**: WAVs compiled with soundtidus (square/triangle/noise waveforms)
- **Dependencies**: zero

## Build

Requires sibling projects `pixelyuna` and `soundtidus` in the same parent directory:

```
Eterea/
  pixelyuna/
  soundtidus/
  vibetetris/
```

```bash
npm run build           # Build all (sprites + audio)
npm run build:sprites   # Sprites only
npm run build:audio     # Audio only
```

## License

MIT
