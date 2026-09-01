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

    let y = 200;
    for (const key of shopKeys) {
      this.buildCard(key, y);
      y += 160;
    }

    if (shopKeys.length === 0) {
      this.add
        .text(GAME_WIDTH / 2, 220, 'Nenhum item disponível no momento.', {
          fontFamily: 'Arial',
          fontSize: '15px',
          color: '#5d7a94',
        })
        .setOrigin(0.5);
    }

    const back = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 70, 200, 48, 0x3498db)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 70, '← Voltar', {
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

  private buildCard(key: string, y: number) {
    const def = TOWER_DEFS[key];
    const width = 640;

    const cardBg = this.add.rectangle(GAME_WIDTH / 2, y, width, 130, 0x16212c, 0.9).setStrokeStyle(2, def.color, 0.6);

    this.add.rectangle(GAME_WIDTH / 2 - width / 2 + 40, y, 20, 20, def.color);

    this.add
      .text(GAME_WIDTH / 2 - width / 2 + 70, y - 38, def.name, {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(GAME_WIDTH / 2 - width / 2 + 70, y - 12, def.description ?? '', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#9fb3c8',
        wordWrap: { width: width - 220 },
      })
      .setOrigin(0, 0.5);

    this.add
      .text(
        GAME_WIDTH / 2 - width / 2 + 70,
        y + 30,
        `Dano ${def.damage} · Alcance ${def.range} · Custo em jogo: $${def.cost}`,
        { fontFamily: 'Arial', fontSize: '12px', color: '#5d7a94' },
      )
      .setOrigin(0, 0.5);

    const buttonX = GAME_WIDTH / 2 + width / 2 - 100;
    const buyBtn = this.add.rectangle(buttonX, y, 160, 44, 0x27ae60).setInteractive({ useHandCursor: true });
    const buyLabel = this.add
      .text(buttonX, y, '', { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', fontStyle: 'bold' })
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
  }

  private refreshAllCards() {
    for (const card of this.cards) card.render();
  }

  private refreshBalance() {
    this.balanceText.setText(`Saldo: ${getCurrency()} Dados Recuperados`);
  }
}
