import Phaser from 'phaser';
import './style.css';
import { GAME_WIDTH, GAME_HEIGHT } from './game/constants';
import MenuScene from './scenes/MenuScene';
import AboutScene from './scenes/AboutScene';
import MapSelectionScene from './scenes/MapSelectionScene';
import DifficultyScene from './scenes/DifficultyScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0f1620',
  scale: {
    mode: Phaser.Scale.NONE,
  },
  scene: [MenuScene, AboutScene, MapSelectionScene, DifficultyScene, GameScene, UIScene],
});
