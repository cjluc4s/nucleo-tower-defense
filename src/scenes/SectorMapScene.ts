import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants';
import { SECTOR_DEFS, getMapsByTier } from '../game/maps';
import type { MapTier } from '../game/maps';
import { TIER_COLORS } from './MapSelectionScene';

const CARD_WIDTH = 460;
const CARD_MIN_HEIGHT = 96;
const CARD_GAP = 22;

export default class SectorMapScene extends Phaser.Scene {
  private tier: MapTier = 'iniciante';

  constructor() {
    super('SectorMapScene');
  }

  init(data: { tier?: MapTier }) {
    this.tier = data?.tier && SECTOR_DEFS[data.tier] ? data.tier : 'iniciante';
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f1620');
    const sector = SECTOR_DEFS[this.tier];
    const color = TIER_COLORS[this.tier];

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 230, sector.name, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#5d7a94',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, 'ESCOLHA A ROTA', {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const nameStyle = { fontFamily: 'Arial', fontSize: '20px', color: '#0b1119', fontStyle: 'bold' };
    const descStyle = {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#1c2b33',
      align: 'center' as const,
      wordWrap: { width: CARD_WIDTH - 60 },
    };
    const padding: number = 16;

    let y = GAME_HEIGHT / 2 - 120;
    let lastCardBottom = y;

    for (const map of getMapsByTier(this.tier)) {
      // Measure each block's real height first, same pattern as MapSelectionScene, so the
      // card grows to fit the route's description instead of assuming a fixed height.
      const nameProbe = this.add.text(0, 0, map.routeName, nameStyle);
      const nameHeight = nameProbe.height;
      nameProbe.destroy();

      const descProbe = this.add.text(0, 0, map.description, descStyle);
      const descHeight = descProbe.height;
      descProbe.destroy();

      const contentHeight = nameHeight + 8 + descHeight;
      const cardHeight = Math.max(CARD_MIN_HEIGHT, contentHeight + padding * 2);
      const cardCenterY = y + cardHeight / 2;

      const btn = this.add
        .rectangle(GAME_WIDTH / 2, cardCenterY, CARD_WIDTH, cardHeight, color, 0.85)
        .setStrokeStyle(2, 0x000000, 0.18)
        .setInteractive({ useHandCursor: true });

      let cy = y + padding;
      this.add.text(GAME_WIDTH / 2, cy, map.routeName, nameStyle).setOrigin(0.5, 0);
      cy += nameHeight + 8;

      this.add.text(GAME_WIDTH / 2, cy, map.description, descStyle).setOrigin(0.5, 0);

      btn.on('pointerover', () => btn.setAlpha(0.7));
      btn.on('pointerout', () => btn.setAlpha(0.85));
      btn.on('pointerdown', () => this.scene.start('DifficultyScene', { mapKey: map.key }));

      lastCardBottom = y + cardHeight;
      y = lastCardBottom + CARD_GAP;
    }

    const back = this.add
      .text(GAME_WIDTH / 2, lastCardBottom + 34, '← Voltar', {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#5d7a94',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('MapSelectionScene'));
  }
}
