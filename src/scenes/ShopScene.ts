import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TOWER_DEFS } from '../game/constants';
import { getCurrency, isTowerUnlocked, unlockTower } from '../game/progress';

export default class ShopScene extends Phaser.Scene {
  private balanceText!: Phaser.GameObjects.Text;
  private cards: { key: string; render: () => void }[] = [];

  constructor() {
    super('ShopScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f1620');
    this.cards = [];

    this.add
      .text(GAME_WIDTH / 2, 60, 'LOJA', {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.balanceText = this.add
      .text(GAME_WIDTH / 2, 105, '', {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#1abc9c',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const shopKeys = Object.keys(TOWER_DEFS).filter((key) => !TOWER_DEFS[key].unlockedByDefault);

    let y = 150;
    for (const key of shopKeys) {
      const cardHeight = this.buildCard(key, y);
      y += cardHeight + 24;
    }

    if (shopKeys.length === 0) {
      this.add
        .text(GAME_WIDTH / 2, y, 'Nenhum item disponível no momento.', {
          fontFamily: 'Arial',
          fontSize: '15px',
          color: '#5d7a94',
        })
        .setOrigin(0.5);
      y += 40;
    }

    const backY = Math.max(GAME_HEIGHT - 70, y + 40);
    const back = this.add
      .rectangle(GAME_WIDTH / 2, backY, 200, 48, 0x3498db)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, backY, '← Voltar', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    back.on('pointerover', () => back.setFillStyle(0x2980b9));
    back.on('pointerout', () => back.setFillStyle(0x3498db));
    back.on('pointerdown', () => this.scene.start('MenuScene'));

    this.refreshBalance();
  }

  private buildCard(key: string, y: number): number {
    const def = TOWER_DEFS[key];
    const width = 640;
    const padding = 18;
    const left = GAME_WIDTH / 2 - width / 2;
    const textX = left + 70;
    const buttonWidth = 160;
    const buttonHeight = 44;
    const buttonX = GAME_WIDTH / 2 + width / 2 - 100;
    // Description must not run under the buy button — leave a real gap instead of a fixed guess.
    const wrapWidth = buttonX - buttonWidth / 2 - 20 - textX;

    const nameStyle = { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' };
    const descStyle = {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#9fb3c8',
      wordWrap: { width: wrapWidth },
      lineSpacing: 2,
    };
    const statsStyle = { fontFamily: 'Arial', fontSize: '12px', color: '#5d7a94' };
    const statsLabel = `Dano ${def.damage} · Alcance ${def.range} · Custo em jogo: $${def.cost}`;

    // Measure each block's real height first so the card can be sized to fit its content,
    // the same pattern used in AboutScene — no fixed card height that text can overflow.
    const nameProbe = this.add.text(0, 0, def.name, nameStyle);
    const nameHeight = nameProbe.height;
    nameProbe.destroy();

    const descProbe = this.add.text(0, 0, def.description ?? '', descStyle);
    const descHeight = descProbe.height;
    descProbe.destroy();

    const statsProbe = this.add.text(0, 0, statsLabel, statsStyle);
    const statsHeight = statsProbe.height;
    statsProbe.destroy();

    const contentHeight = nameHeight + 6 + descHeight + 10 + statsHeight;
    const cardHeight = Math.max(contentHeight + padding * 2, buttonHeight + padding * 2);
    const cardCenterY = y + cardHeight / 2;

    const cardBg = this.add
      .rectangle(GAME_WIDTH / 2, cardCenterY, width, cardHeight, 0x16212c, 0.9)
      .setStrokeStyle(2, def.color, 0.6);

    this.add.rectangle(left + 40, cardCenterY, 20, 20, def.color);

    let cy = y + padding;
    this.add.text(textX, cy, def.name, nameStyle);
    cy += nameHeight + 6;

    this.add.text(textX, cy, def.description ?? '', descStyle);
    cy += descHeight + 10;

    this.add.text(textX, cy, statsLabel, statsStyle);

    const buyBtn = this.add
      .rectangle(buttonX, cardCenterY, buttonWidth, buttonHeight, 0x27ae60)
      .setInteractive({ useHandCursor: true });
    const buyLabel = this.add
      .text(buttonX, cardCenterY, '', { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);

    const render = () => {
      if (isTowerUnlocked(key)) {
        buyBtn.setFillStyle(0x2c3e50);
        buyBtn.disableInteractive();
        buyLabel.setText('Desbloqueado');
        cardBg.setStrokeStyle(2, def.color, 1);
        return;
      }
      const cost = def.unlockCost ?? 0;
      const canAfford = getCurrency() >= cost;
      buyBtn.setFillStyle(canAfford ? 0x27ae60 : 0x555555);
      buyLabel.setText(`Comprar · ${cost}`);
      if (canAfford) {
        buyBtn.setInteractive({ useHandCursor: true });
      } else {
        buyBtn.disableInteractive();
      }
    };

    buyBtn.on('pointerdown', () => {
      if (unlockTower(key)) {
        this.refreshBalance();
        this.refreshAllCards();
      }
    });

    this.cards.push({ key, render });
    render();

    return cardHeight;
  }

  private refreshAllCards() {
    for (const card of this.cards) card.render();
  }

  private refreshBalance() {
    this.balanceText.setText(`Saldo: ${getCurrency()} Dados Recuperados`);
  }
}
