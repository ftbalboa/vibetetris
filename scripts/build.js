#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PIXELYUNA = path.resolve(ROOT, '..', 'pixelyuna');
const SOUNDTIDUS = path.resolve(ROOT, '..', 'soundtidus');

const SPRITES_SRC = path.join(ROOT, 'sprites');
const SOUNDS_SRC = path.join(ROOT, 'sounds');
const TRACKS_SRC = path.join(ROOT, 'tracks');
const DIST_SPRITES = path.join(ROOT, 'dist', 'sprites');
const DIST_AUDIO = path.join(ROOT, 'dist', 'audio');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function buildSprites() {
  if (!fs.existsSync(PIXELYUNA)) {
    console.error('ERROR: pixelyuna not found at', PIXELYUNA);
    process.exit(1);
  }

  ensureDir(DIST_SPRITES);
  const cli = path.join(PIXELYUNA, 'src', 'cli.js');
  const cmd = `node "${cli}" compile "${SPRITES_SRC}" --out "${DIST_SPRITES}" --scale 4`;
  console.log('Building sprites...');
  console.log('  ' + cmd);
  execSync(cmd, { stdio: 'inherit' });
  console.log('Sprites compiled to', DIST_SPRITES);
}

function buildAudio() {
  if (!fs.existsSync(SOUNDTIDUS)) {
    console.error('ERROR: soundtidus not found at', SOUNDTIDUS);
    process.exit(1);
  }

  ensureDir(DIST_AUDIO);
  const cli = path.join(SOUNDTIDUS, 'src', 'cli.js');

  // Compile sounds
  const soundFiles = fs.readdirSync(SOUNDS_SRC).filter(f => f.endsWith('.sound'));
  if (soundFiles.length > 0) {
    const cmd = `node "${cli}" compile "${SOUNDS_SRC}" --out "${DIST_AUDIO}" --no-preview`;
    console.log('Building sounds...');
    console.log('  ' + cmd);
    execSync(cmd, { stdio: 'inherit' });
  }

  // Compile tracks
  const trackFiles = fs.readdirSync(TRACKS_SRC).filter(f => f.endsWith('.track'));
  if (trackFiles.length > 0) {
    for (const file of trackFiles) {
      const trackPath = path.join(TRACKS_SRC, file);
      const cmd = `node "${cli}" track "${trackPath}" --out "${DIST_AUDIO}" --no-preview`;
      console.log('Building track:', file);
      console.log('  ' + cmd);
      execSync(cmd, { stdio: 'inherit' });
    }
  }

  console.log('Audio compiled to', DIST_AUDIO);
}

const target = process.argv[2];

if (!target || target === 'all') {
  buildSprites();
  buildAudio();
} else if (target === 'sprites') {
  buildSprites();
} else if (target === 'audio') {
  buildAudio();
} else {
  console.error('Unknown target:', target);
  console.error('Usage: node scripts/build.js [all|sprites|audio]');
  process.exit(1);
}
