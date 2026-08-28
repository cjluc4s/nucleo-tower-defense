import Phaser from 'phaser';
import { GAME_WIDTH, ENEMY_DEFS, TOWER_DEFS } from '../game/constants';

const STORY =
  'Nas profundezas da rede existe o Núcleo — o centro que mantém tudo funcionando. Um vírus ' +
  'desconhecido começou a se espalhar pelos circuitos, se manifestando em ondas de dados ' +
  'corrompidos que avançam por um único caminho possível: o que você controla.\n\n' +
  'Você é o Administrador. A cada onda, o vírus muta — fica mais rápido, mais denso, mais ' +
  'numeroso. Sua única defesa: erguer módulos ao longo da rota e impedir que a corrupção ' +
  'alcance o Núcleo.';

const ENEMY_LORE: Record<string, string> = {
  grunt: 'Pedaço padrão de dado corrompido — o "soldado raso" do vírus.',
  fast: 'Rajada fina e ágil de sinal corrompido.',
  tank: 'Bloco denso e blindado, lento mas quase impossível de ignorar.',
};

const TOWER_LORE: Record<string, string> = {
  basic: 'Módulo básico, dispara pulsos de contenção.',
  sniper: 'Alcance longo, mira precisa, dano concentrado.',
  splash: 'Explode em área, estoura aglomerados de dados corrompidos.',
};

export default class AboutScene extends Phaser.Scene {
  constructor() {
    super('AboutScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f1620');

    this.add
      .text(GAME_WIDTH / 2, 50, 'SOBRE', {
        fontFamily: 'Arial',
        fontSize: '34px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    this.add
      .text(GAME_WIDTH / 2, 105, STORY, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#c8d6e0',
        align: 'center',
        wordWrap: { width: 760 },
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(GAME_WIDTH / 2, 320, 'OS VETORES', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#5d7a94',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    let y = 358;
    for (const key of Object.keys(ENEMY_DEFS)) {
      const def = ENEMY_DEFS[key];
      this.add.circle(GAME_WIDTH / 2 - 340, y + 10, def.radius * 0.7, def.color);
      this.add.text(GAME_WIDTH / 2 - 310, y, `${def.name}`, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      this.add.text(GAME_WIDTH / 2 - 170, y + 1, ENEMY_LORE[key] ?? '', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#9fb3c8',
      });
      y += 42;
    }

    this.add
      .text(GAME_WIDTH / 2, 520, 'MÓDULOS DE DEFESA', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#5d7a94',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    y = 558;
    for (const key of Object.keys(TOWER_DEFS)) {
      const def = TOWER_DEFS[key];
      this.add.rectangle(GAME_WIDTH / 2 - 340, y + 10, 16, 16, def.color);
      this.add.text(GAME_WIDTH / 2 - 310, y, `${def.name}`, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      this.add.text(GAME_WIDTH / 2 - 170, y + 1, TOWER_LORE[key] ?? '', {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#9fb3c8',
      });
      y += 42;
    }

    const back = this.add
      .rectangle(GAME_WIDTH / 2, 720, 200, 48, 0x3498db)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, 720, '← Voltar', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    back.on('pointerover', () => back.setFillStyle(0x2980b9));
    back.on('pointerout', () => back.setFillStyle(0x3498db));
    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
