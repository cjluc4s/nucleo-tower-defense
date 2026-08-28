import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DIFFICULTY_DEFS } from '../game/constants';
import type { DifficultyKey } from '../game/constants';
import { MAP_DEFS } from '../game/maps';

const DESCRIPTIONS: Record<DifficultyKey, string> = {
  easy: 'Mais ouro para começar — ideal para relaxar',
  medium: 'Experiência equilibrada',
  hard: 'Ouro apertado — exige estratégia',
};

const CARD_WIDTH = 420;
const CARD_HEIGHT = 104;
const CARD_GAP = 30;

export default class DifficultyScene extends Phaser.Scene {
  private mapKey = 'roteamento';

  constructor() {
    super('DifficultyScene');
  }

  init(data: { mapKey?: string }) {
    this.mapKey = data?.mapKey && MAP_DEFS[data.mapKey] ? data.mapKey : 'roteamento';
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f1620');
    const mapDef = MAP_DEFS[this.mapKey];

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 230, mapDef.name, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#5d7a94',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, 'ESCOLHA A DIFICULDADE', {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const keys: DifficultyKey[] = ['easy', 'medium', 'hard'];
    let y = GAME_HEIGHT / 2 - 100;

    for (const key of keys) {
      const def = DIFFICULTY_DEFS[key];
      const btn = this.add
        .rectangle(GAME_WIDTH / 2, y, CARD_WIDTH, CARD_HEIGHT, def.color, 0.85)
        .setStrokeStyle(2, 0x000000, 0.18)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(GAME_WIDTH / 2, y - 32, def.name, {
          fontFamily: 'Arial',
          fontSize: '22px',
          color: '#0b1119',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.add
        .text(GAME_WIDTH / 2, y - 4, `Ouro: ${def.startingGold}   •   Vidas: ${def.startingLives}`, {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#0b1119',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.add
        .text(GAME_WIDTH / 2, y + 24, DESCRIPTIONS[key], {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: '#1c2b33',
          align: 'center',
          wordWrap: { width: CARD_WIDTH - 60 },
        })
        .setOrigin(0.5);

      btn.on('pointerover', () => btn.setAlpha(0.7));
      btn.on('pointerout', () => btn.setAlpha(0.85));
      btn.on('pointerdown', () => {
        this.scene.start('GameScene', { difficulty: key, mapKey: this.mapKey });
        this.scene.launch('UIScene', { difficulty: key, mapKey: this.mapKey });
      });

      y += CARD_HEIGHT + CARD_GAP;
    }

    const back = this.add
      .text(GAME_WIDTH / 2, y + 10, '← Voltar', {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#5d7a94',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('MapSelectionScene'));
  }
}
