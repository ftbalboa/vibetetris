# Changelog

## 0.1.0

Initial release.

- Classic Tetris with 7 tetrominoes and SRS rotation + wall kicks
- 7-bag randomizer for fair piece distribution
- NES-style scoring: single (40), double (100), triple (300), tetris (1200) x (level+1)
- Level progression every 10 lines with increasing speed
- Lock delay (500ms) with move/rotate reset (max 15 resets)
- Ghost piece for hard drop preview
- Next piece preview panel
- DAS keyboard input (170ms delay, 50ms repeat)
- 8 pixel art block sprites (8x8, compiled at 4x scale) via pixelyuna
- 9 chiptune SFX via soundtidus (move, rotate, drop, lock, clear, tetris, level up, game over)
- Loopable BGM track (4-channel chiptune, 140 BPM)
- Web Audio API with separate music/SFX volume + mute toggle
- State machine: menu, playing, paused, game over
- Line clear animation (flash + fade)
