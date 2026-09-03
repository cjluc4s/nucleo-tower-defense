import Phaser from 'phaser';
import './style.css';
import { GAME_WIDTH, GAME_HEIGHT } from './game/constants';
import MenuScene from './scenes/MenuScene';
import AboutScene from './scenes/AboutScene';
import ShopScene from './scenes/ShopScene';
import MapSelectionScene from './scenes/MapSelectionScene';
import SectorMapScene from './scenes/SectorMapScene';
import DifficultyScene from './scenes/DifficultyScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';

// Every scene's text is hand-tuned against the 960x758 design resolution, but Scale.FIT
// (below) stretches that canvas to fill screens of any size. Phaser renders Text objects to
// their own internal canvas at 1x resolution by default, which looks soft once stretched —
// bumping the default resolution renders that internal canvas sharper up front, so text stays
// crisp at any scale. This affects every `this.add.text(...)` call in the game without having
// to touch each one individually; it only changes render sharpness, never layout (Text's
// exposed .width/.height, used throughout for spacing, are computed before this multiplier).
// Matches (with headroom) the 2x max CSS scale cap in style.css, so text is never sampled
// at a lower resolution than it can end up displayed at.
const TEXT_RESOLUTION = Math.min((window.devicePixelRatio || 1) * 2, 4);
const originalTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle,
) {
  const resolvedStyle: Phaser.Types.GameObjects.Text.TextStyle = { resolution: TEXT_RESOLUTION, ...style };
  return originalTextFactory.call(this, x, y, text, resolvedStyle);
};

// Mobile browsers (iOS Safari in particular) resize their address/toolbar chrome after the
// page has already laid out, and `100dvh` (the CSS fallback in style.css) doesn't always
// settle immediately after rotating the device — leaving #app briefly sized against a stale
// viewport, which throws off Phaser's FIT scaling until something else triggers a resize.
// Mirroring `window.innerHeight` into a CSS var on load/resize/orientationchange (the
// pre-`dvh` mobile-viewport trick) keeps #app's real size correct, and explicitly refreshing
// the scale manager afterwards forces Phaser to recompute immediately against it rather than
// waiting on its own listener.
function syncAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}
syncAppHeight();
window.addEventListener('resize', () => {
  syncAppHeight();
  game.scale.refresh();
});
window.addEventListener('orientationchange', () => {
  syncAppHeight();
  game.scale.refresh();
  // The viewport/toolbar can keep settling for a bit after the event fires.
  setTimeout(() => {
    syncAppHeight();
    game.scale.refresh();
  }, 300);
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0f1620',
  scale: {
    // FIT scales the whole design canvas to fit whatever screen it's on (phone, tablet,
    // ultrawide monitor...) while preserving its aspect ratio and letterboxing the rest —
    // every scene's hand-tuned pixel layout keeps working unchanged at any size. The canvas
    // itself is wider than the actual 15x10 play grid on purpose, precisely to minimize that
    // letterboxing on phones — see constants.ts (GRID_OFFSET_X) for why.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [MenuScene, AboutScene, ShopScene, MapSelectionScene, SectorMapScene, DifficultyScene, GameScene, UIScene],
});
