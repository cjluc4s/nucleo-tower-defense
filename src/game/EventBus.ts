import Phaser from 'phaser';

class GameEventBus extends Phaser.Events.EventEmitter {}

export default new GameEventBus();
