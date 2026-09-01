import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TOP_BAR_HEIGHT, BOTTOM_BAR_HEIGHT, TOWER_DEFS, DIFFICULTY_DEFS } from '../game/constants';
import type { DifficultyKey } from '../game/constants';
import { MAP_DEFS } from '../game/maps';
import { getAvailableTowerKeys } from '../game/progress';
import type { MapCompletionResult } from '../game/progress';
import EventBus from '../game/EventBus';

function toCssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

interface GameState {
  gold: number;
  lives: number;
  wave: number;
  totalWaves: number;
  waveActive: boolean;
  endless: boolean;
}

export default class UIScene extends Phaser.Scene {
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private startWaveBtn!: Phaser.GameObjects.Rectangle;
  private startWaveLabel!: Phaser.GameObjects.Text;
  private towerButtons: { key: string; rect: Phaser.GameObjects.Rectangle }[] = [];
  private overlay?: Phaser.GameObjects.Container;
  private selectedKey: string | null = null;
  private difficulty: DifficultyKey = 'medium';
  private mapKey = 'roteamento';
  private winBonus?: MapCompletionResult;
  private state: GameState = { gold: 0, lives: 0, wave: 1, totalWaves: 1, waveActive: false, endless: false };

  constructor() {
    super('UIScene');
  }

  init(data: { difficulty?: DifficultyKey; mapKey?: string }) {
    this.difficulty = data?.difficulty ?? 'medium';
    this.mapKey = data?.mapKey && MAP_DEFS[data.mapKey] ? data.mapKey : 'roteamento';
  }

  create() {
    this.towerButtons = [];
    this.overlay = undefined;
    this.selectedKey = null;
    this.winBonus = undefined;

    this.add.rectangle(0, 0, GAME_WIDTH, TOP_BAR_HEIGHT, 0x0b1119, 0.9).setOrigin(0, 0);

    this.goldText = this.add.text(16, 12, '', { fontFamily: 'Arial', fontSize: '18px', color: '#f1c40f' });
    this.livesText = this.add.text(150, 12, '', { fontFamily: 'Arial', fontSize: '18px', color: '#e74c3c' });
    this.waveText = this.add.text(290, 12, '', { fontFamily: 'Arial', fontSize: '18px', color: '#ecf0f1' });

    const difficultyDef = DIFFICULTY_DEFS[this.difficulty];
    const mapDef = MAP_DEFS[this.mapKey];
    this.add.text(430, 12, `${mapDef.shortName} · ${difficultyDef.name}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: toCssColor(difficultyDef.color),
      fontStyle: 'bold',
    });

    this.createTopBarButton(GAME_WIDTH - 204, 'Reiniciar', 0x8e5a2c, () => this.restartRun());
    this.createTopBarButton(GAME_WIDTH - 104, 'Menu', 0x555555, () => this.goToMenu());

    this.add.rectangle(0, GAME_HEIGHT - BOTTOM_BAR_HEIGHT, GAME_WIDTH, BOTTOM_BAR_HEIGHT, 0x0b1119, 0.9).setOrigin(0, 0);

    let bx = 16;
    for (const key of getAvailableTowerKeys()) {
      const def = TOWER_DEFS[key];
      const rect = this.add
        .rectangle(bx, GAME_HEIGHT - BOTTOM_BAR_HEIGHT + 12, 150, 50, def.color, 0.85)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
      rect.setStrokeStyle(2, 0xffffff, 0);

      this.add.text(bx + 10, GAME_HEIGHT - BOTTOM_BAR_HEIGHT + 18, `${def.name}\n$${def.cost}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#0b1119',
        fontStyle: 'bold',
      });

      rect.on('pointerdown', () => this.selectTower(this.selectedKey === key ? null : key));
      this.towerButtons.push({ key, rect });
      bx += 166;
    }

    this.startWaveBtn = this.add
      .rectangle(GAME_WIDTH - 190, GAME_HEIGHT - BOTTOM_BAR_HEIGHT + 12, 174, 50, 0x27ae60)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    this.startWaveLabel = this.add
      .text(GAME_WIDTH - 190 + 87, GAME_HEIGHT - BOTTOM_BAR_HEIGHT + 37, 'Iniciar Onda', {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.startWaveBtn.on('pointerdown', () => EventBus.emit('request-start-wave'));

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') this.selectTower(null);
    });
    EventBus.on('cancel-tower-selection', () => this.selectTower(null));

    EventBus.on('state', (s: GameState) => this.updateState(s));
    EventBus.on('insufficient-gold', () => this.flashGold());
    EventBus.on('game-over', () => this.showOverlay(false));
    EventBus.on('game-win', (bonus?: MapCompletionResult) => {
      this.winBonus = bonus;
      this.showOverlay(true);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off('state');
      EventBus.off('insufficient-gold');
      EventBus.off('game-over');
      EventBus.off('game-win');
      EventBus.off('cancel-tower-selection');
    });

    this.selectTower(null);
    EventBus.emit('request-state');
  }

  private createTopBarButton(x: number, label: string, color: number, onClick: () => void) {
    const rect = this.add
      .rectangle(x, 6, 90, 32, color, 0.9)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x + 45, 22, label, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    rect.on('pointerover', () => rect.setAlpha(0.8));
    rect.on('pointerout', () => rect.setAlpha(1));
    rect.on('pointerdown', onClick);
    return rect;
  }

  private restartRun() {
    const difficulty = this.difficulty;
    const mapKey = this.mapKey;
    this.scene.stop('GameScene');
    this.scene.start('GameScene', { difficulty, mapKey });
    // Restart (not stop+launch) — a scene stopping and relaunching itself in one
    // synchronous burst isn't reliably processed by Phaser's scene manager.
    this.scene.restart({ difficulty, mapKey });
  }

  private goToMenu() {
    this.scene.stop('GameScene');
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }

  private selectTower(key: string | null) {
    this.selectedKey = key;
    EventBus.emit('select-tower', key);
    for (const btn of this.towerButtons) {
      btn.rect.setStrokeStyle(2, 0xffffff, btn.key === key ? 1 : 0);
    }
  }

  private updateState(s: GameState) {
    this.state = s;
    this.goldText.setText(`Ouro: ${s.gold}`);
    this.livesText.setText(`Vidas: ${s.lives}`);
    this.waveText.setText(s.endless ? `Onda: ${s.wave} · Infinito` : `Onda: ${s.wave}/${s.totalWaves}`);

    this.startWaveBtn.setFillStyle(s.waveActive ? 0x555555 : 0x27ae60);
    this.startWaveLabel.setText(s.waveActive ? 'Em progresso...' : 'Iniciar Onda');
    this.startWaveBtn.disableInteractive();
    if (!s.waveActive && (s.endless || s.wave <= s.totalWaves)) {
      this.startWaveBtn.setInteractive({ useHandCursor: true });
    }
  }

  private flashGold() {
    this.tweens.add({
      targets: this.goldText,
      alpha: { from: 1, to: 0.2 },
      yoyo: true,
      duration: 120,
      repeat: 1,
    });
  }

  private showOverlay(won: boolean) {
    if (this.overlay) return;
    const container = this.add.container(0, 0);
    this.overlay = container;

    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0, 0);
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, won ? 'VITÓRIA!' : 'FIM DE JOGO', {
        fontFamily: 'Arial',
        fontSize: '42px',
        color: won ? '#2ecc71' : '#e74c3c',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    let subtitleText: string;
    if (won) {
      subtitleText = 'O Núcleo resistiu à infecção.';
    } else if (this.state.endless) {
      subtitleText = `Você sobreviveu até a onda ${this.state.wave} no modo infinito.`;
    } else {
      subtitleText = `O Núcleo foi corrompido na onda ${this.state.wave}.`;
    }
    const subtitle = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, subtitleText, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ecf0f1',
      })
      .setOrigin(0.5);

    const elements: Phaser.GameObjects.GameObject[] = [bg, title, subtitle];
    let y = GAME_HEIGHT / 2 - 5;

    if (won && this.winBonus) {
      const bonusText = this.add
        .text(
          GAME_WIDTH / 2,
          y,
          `+${this.winBonus.amountEarned} Dados Recuperados${this.winBonus.wasFirstClear ? ' (primeira vez!)' : ''}`,
          { fontFamily: 'Arial', fontSize: '14px', color: '#1abc9c', fontStyle: 'bold' },
        )
        .setOrigin(0.5);
      elements.push(bonusText);
      y += 30;
    }

    y += 25;

    if (won) {
      const [continueBtn, continueLabel] = this.createOverlayButton(y, 'Continuar (Modo Infinito)', 0x2de1fc, () => {
        EventBus.emit('continue-endless');
        this.overlay?.destroy();
        this.overlay = undefined;
      });
      elements.push(continueBtn, continueLabel);
      y += 60;
    }

    const [restartBtn, restartLabel] = this.createOverlayButton(y, 'Jogar Novamente', 0x3498db, () =>
      this.restartRun(),
    );
    elements.push(restartBtn, restartLabel);
    y += 60;

    const [menuBtn, menuLabel] = this.createOverlayButton(y, 'Voltar ao Menu', 0x2c3e50, () => this.goToMenu());
    elements.push(menuBtn, menuLabel);

    container.add(elements);
  }

  private createOverlayButton(
    y: number,
    label: string,
    color: number,
    onClick: () => void,
  ): [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text] {
    const btn = this.add
      .rectangle(GAME_WIDTH / 2, y, 260, 50, color, color === 0x2de1fc ? 0.85 : 1)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: color === 0x2de1fc ? '#0b1119' : '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    btn.on('pointerdown', onClick);
    return [btn, text];
  }
}
