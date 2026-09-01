import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants';
import { getCurrency } from '../game/progress';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.image('bg-menu', '/bg-menu.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f1620');

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-menu').setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.35);

    const centerX = GAME_WIDTH / 2;
    const center = GAME_HEIGHT / 2;

    this.add
      .text(centerX, center - 120, 'NÚCLEO', {
        fontFamily: 'Arial',
        fontSize: '52px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, center - 70, 'A rede está infectada.', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#9fb3c8',
      })
      .setOrigin(0.5);

    this.createButton(centerX, center, 220, 56, 0x3498db, 0x2980b9, 'JOGAR', '#ffffff', '22px', () =>
      this.scene.start('MapSelectionScene'),
    );

    this.createButton(centerX, center + 72, 220, 48, 0x2c3e50, 0x34495e, 'SOBRE', '#ffffff', '18px', () =>
      this.scene.start('AboutScene'),
    );

    this.createButton(centerX, center + 132, 220, 48, 0x1abc9c, 0x16a085, 'LOJA', '#0b1119', '18px', () =>
      this.scene.start('ShopScene'),
    );

    const currencyY = center + 196;

    const currencyValue = this.add.text(0, currencyY, `${getCurrency()}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#1abc9c',
      fontStyle: 'bold',
    });
    const currencyLabel = this.add.text(0, currencyY, ' Dados Recuperados', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#e8eef2',
    });
    const currencyWidth = currencyValue.width + currencyLabel.width;
    currencyValue.setPosition(centerX - currencyWidth / 2, currencyY).setOrigin(0, 0.5);
    currencyLabel.setPosition(centerX - currencyWidth / 2 + currencyValue.width, currencyY).setOrigin(0, 0.5);

    const currencyPillPaddingX = 22;
    const currencyPillHeight = 38;
    const currencyPill = this.add.graphics();
    currencyPill.fillStyle(0x000000, 0.55);
    currencyPill.fillRoundedRect(
      centerX - currencyWidth / 2 - currencyPillPaddingX,
      currencyY - currencyPillHeight / 2,
      currencyWidth + currencyPillPaddingX * 2,
      currencyPillHeight,
      10,
    );
    currencyPill.lineStyle(1.5, 0x1abc9c, 0.6);
    currencyPill.strokeRoundedRect(
      centerX - currencyWidth / 2 - currencyPillPaddingX,
      currencyY - currencyPillHeight / 2,
      currencyWidth + currencyPillPaddingX * 2,
      currencyPillHeight,
      10,
    );
    this.children.moveBelow(currencyPill, currencyValue);

    const hintY = GAME_HEIGHT - 46;

    const hintBg = this.add.graphics();
    hintBg.fillStyle(0x000000, 0.4);
    hintBg.fillRoundedRect(GAME_WIDTH / 2 - 220, hintY - 24, 440, 48, 10);

    this.add
      .text(GAME_WIDTH / 2, hintY - 9, 'COMO JOGAR', {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#2de1fc',
        fontStyle: 'bold',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, hintY + 10, 'Clique num módulo e depois na grade para posicioná-lo.', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#c8d6e0',
      })
      .setOrigin(0.5);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    hoverColor: number,
    label: string,
    labelColor: string,
    fontSize: string,
    onClick: () => void,
  ): void {
    const radius = 12;
    const bg = this.add.graphics();
    const draw = (fill: number) => {
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    };
    draw(color);
    bg.setInteractive(
      new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
    bg.input!.cursor = 'pointer';

    this.add
      .text(x, y, label, { fontFamily: 'Arial', fontSize, color: labelColor, fontStyle: 'bold' })
      .setOrigin(0.5);

    bg.on('pointerover', () => draw(hoverColor));
    bg.on('pointerout', () => draw(color));
    bg.on('pointerdown', onClick);
  }
}
