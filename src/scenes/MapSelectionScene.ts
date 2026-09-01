import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants';
import { MAP_DEFS, MAP_TIER_ORDER, MAP_TIER_LABELS } from '../game/maps';
import type { MapTier } from '../game/maps';

export const TIER_COLORS: Record<MapTier, number> = {
  iniciante: 0x4da6ff,
  intermediario: 0x9b59b6,
  avancado: 0xe67e22,
};

const CARD_WIDTH = 460;
const CARD_MIN_HEIGHT = 104;
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

    const tierStyle = {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#0b1119',
      fontStyle: 'bold',
      letterSpacing: 1,
    };
    const nameStyle = { fontFamily: 'Arial', fontSize: '20px', color: '#0b1119', fontStyle: 'bold' };
    const descStyle = {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#1c2b33',
      align: 'center' as const,
      wordWrap: { width: CARD_WIDTH - 60 },
    };
    const padding = 16;

    let y = 227;
    let lastCardBottom = y;

    for (const map of maps) {
      const color = TIER_COLORS[map.tier];

      // Measure each block's real height first so the card grows to fit a wrapped
      // description instead of clipping/cramping it against a fixed height.
      const tierProbe = this.add.text(0, 0, MAP_TIER_LABELS[map.tier].toUpperCase(), tierStyle);
      const tierHeight = tierProbe.height;
      tierProbe.destroy();

      const nameProbe = this.add.text(0, 0, map.name, nameStyle);
      const nameHeight = nameProbe.height;
      nameProbe.destroy();

      const descProbe = this.add.text(0, 0, map.description, descStyle);
      const descHeight = descProbe.height;
      descProbe.destroy();

      const contentHeight = tierHeight + 8 + nameHeight + 8 + descHeight;
      const cardHeight = Math.max(CARD_MIN_HEIGHT, contentHeight + padding * 2);
      const cardCenterY = y + cardHeight / 2;

      const btn = this.add
        .rectangle(GAME_WIDTH / 2, cardCenterY, CARD_WIDTH, cardHeight, color, 0.85)
        .setStrokeStyle(2, 0x000000, 0.18)
        .setInteractive({ useHandCursor: true });

      let cy = y + padding;
      this.add.text(GAME_WIDTH / 2 - CARD_WIDTH / 2 + 18, cy, MAP_TIER_LABELS[map.tier].toUpperCase(), tierStyle);
      cy += tierHeight + 8;

      this.add.text(GAME_WIDTH / 2, cy, map.name, nameStyle).setOrigin(0.5, 0);
      cy += nameHeight + 8;

      this.add.text(GAME_WIDTH / 2, cy, map.description, descStyle).setOrigin(0.5, 0);

      btn.on('pointerover', () => btn.setAlpha(0.7));
      btn.on('pointerout', () => btn.setAlpha(0.85));
      btn.on('pointerdown', () => this.scene.start('DifficultyScene', { mapKey: map.key }));

      lastCardBottom = y + cardHeight;
      y = lastCardBottom + CARD_GAP;
    }

    const back = this.add
      .text(GAME_WIDTH / 2, lastCardBottom + 40, '← Voltar', {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#5d7a94',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
