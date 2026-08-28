import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants';
import { MAP_DEFS, MAP_TIER_ORDER, MAP_TIER_LABELS } from '../game/maps';
import type { MapTier } from '../game/maps';

const TIER_COLORS: Record<MapTier, number> = {
  iniciante: 0x4da6ff,
  intermediario: 0x9b59b6,
  avancado: 0xe67e22,
};

const CARD_WIDTH = 460;
const CARD_HEIGHT = 104;
const CARD_GAP = 26;

export default class MapSelectionScene extends Phaser.Scene {
  constructor() {
    super('MapSelectionScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f1620');

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 210, 'ESCOLHA O SETOR', {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const maps = MAP_TIER_ORDER.map((tier) => Object.values(MAP_DEFS).find((m) => m.tier === tier)).filter(
      (m) => m !== undefined,
    );

    let y = GAME_HEIGHT / 2 - 100;

    for (const map of maps) {
      const color = TIER_COLORS[map.tier];
      const btn = this.add
        .rectangle(GAME_WIDTH / 2, y, CARD_WIDTH, CARD_HEIGHT, color, 0.85)
        .setStrokeStyle(2, 0x000000, 0.18)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(GAME_WIDTH / 2 - CARD_WIDTH / 2 + 18, y - 32, MAP_TIER_LABELS[map.tier].toUpperCase(), {
          fontFamily: 'Arial',
          fontSize: '11px',
          color: '#0b1119',
          fontStyle: 'bold',
          letterSpacing: 1,
        })
        .setOrigin(0, 0.5);

      this.add
        .text(GAME_WIDTH / 2, y - 10, map.name, {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: '#0b1119',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.add
        .text(GAME_WIDTH / 2, y + 22, map.description, {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: '#1c2b33',
          align: 'center',
          wordWrap: { width: CARD_WIDTH - 60 },
        })
        .setOrigin(0.5);

      btn.on('pointerover', () => btn.setAlpha(0.7));
      btn.on('pointerout', () => btn.setAlpha(0.85));
      btn.on('pointerdown', () => this.scene.start('DifficultyScene', { mapKey: map.key }));

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
    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
