import Phaser from 'phaser';
import { GAME_WIDTH, ENEMY_DEFS, TOWER_DEFS, DIFFICULTY_DEFS } from '../game/constants';
import { MAP_DEFS, MAP_TIER_ORDER, MAP_TIER_LABELS } from '../game/maps';
import type { DifficultyKey } from '../game/constants';
import { TIER_COLORS } from './MapSelectionScene';

const STORY =
  'Nas profundezas da rede existe o Núcleo — o centro que mantém tudo funcionando. Um vírus ' +
  'desconhecido começou a se espalhar pelos circuitos, se manifestando em ondas de dados ' +
  'corrompidos que avançam por um único caminho possível: o que você controla.\n\n' +
  'Você é o Administrador. A cada onda, o vírus muta — fica mais rápido, mais denso, mais ' +
  'numeroso. Sua única defesa: erguer módulos ao longo da rota e impedir que a corrupção ' +
  'alcance o Núcleo. Complete um setor e você pode seguir direto para o Modo Infinito, ' +
  'defendendo o Núcleo por tempo indeterminado para ver até onde consegue chegar.';

const ENEMY_LORE: Record<string, string> = {
  grunt: 'Pedaço padrão de dado corrompido — o "soldado raso" do vírus.',
  fast: 'Rajada fina e ágil de sinal corrompido.',
  tank: 'Bloco denso e blindado, lento mas quase impossível de ignorar.',
};

const TOWER_LORE: Record<string, string> = {
  basic: 'Módulo básico, dispara pulsos de contenção.',
  sniper: 'Alcance longo, mira precisa, dano concentrado.',
  splash: 'Explode em área, estoura aglomerados de dados corrompidos.',
  limiter: 'Emite um pulso de limitação de banda, prendendo vetores no lugar por um instante.',
};

const LEFT_MARGIN = 46;
const COLUMN_WIDTH = GAME_WIDTH / 2 - LEFT_MARGIN - 34;
const RIGHT_COLUMN_X = GAME_WIDTH / 2 + 34;

export default class AboutScene extends Phaser.Scene {
  constructor() {
    super('AboutScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f1620');
    let y = 30;

    const title = this.add
      .text(GAME_WIDTH / 2, y, 'SOBRE', {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    y += title.height + 12;

    const story = this.add
      .text(GAME_WIDTH / 2, y, STORY, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#c8d6e0',
        align: 'center',
        wordWrap: { width: 860 },
        lineSpacing: 2,
      })
      .setOrigin(0.5, 0);
    y += story.height + 16;

    // Two-column section: Vetores (left) and Módulos de Defesa (right).
    const sectionHeaderY = y;
    this.add.text(LEFT_MARGIN, sectionHeaderY, 'OS VETORES', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#5d7a94',
      fontStyle: 'bold',
    });
    this.add.text(RIGHT_COLUMN_X, sectionHeaderY, 'MÓDULOS DE DEFESA', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#5d7a94',
      fontStyle: 'bold',
    });

    let leftY = sectionHeaderY + 22;
    for (const key of Object.keys(ENEMY_DEFS)) {
      leftY = this.addEntryRow(LEFT_MARGIN, leftY, {
        markerColor: ENEMY_DEFS[key].color,
        markerShape: 'circle',
        name: ENEMY_DEFS[key].name,
        nameColor: '#ffffff',
        description: ENEMY_LORE[key] ?? '',
      });
    }

    let rightY = sectionHeaderY + 22;
    for (const key of Object.keys(TOWER_DEFS)) {
      const def = TOWER_DEFS[key];
      rightY = this.addEntryRow(RIGHT_COLUMN_X, rightY, {
        markerColor: def.color,
        markerShape: 'square',
        name: def.unlockedByDefault ? def.name : `${def.name} (Loja)`,
        nameColor: def.unlockedByDefault ? '#ffffff' : '#1abc9c',
        description: TOWER_LORE[key] ?? def.description ?? '',
      });
    }

    y = Math.max(leftY, rightY) + 2;

    // Setores
    const setoresHeader = this.add.text(LEFT_MARGIN, y, 'SETORES', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#5d7a94',
      fontStyle: 'bold',
    });
    y += setoresHeader.height + 8;

    for (const tier of MAP_TIER_ORDER) {
      const map = Object.values(MAP_DEFS).find((m) => m.tier === tier);
      if (!map) continue;
      y = this.addEntryRow(LEFT_MARGIN, y, {
        markerColor: TIER_COLORS[tier],
        markerShape: 'circle',
        name: `${map.name}  ·  ${MAP_TIER_LABELS[tier]}`,
        nameColor: '#ffffff',
        description: map.description,
        fullWidth: true,
      });
    }

    // Dificuldade
    const diffHeader = this.add.text(LEFT_MARGIN, y, 'DIFICULDADE', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#5d7a94',
      fontStyle: 'bold',
    });
    y += diffHeader.height + 8;

    let diffX = LEFT_MARGIN;
    const diffKeys: DifficultyKey[] = ['easy', 'medium', 'hard'];
    for (const key of diffKeys) {
      const def = DIFFICULTY_DEFS[key];
      const chip = this.add.text(diffX, y, def.name, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: `#${def.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      });
      diffX += chip.width + 22;
    }
    const diffNote = this.add.text(
      LEFT_MARGIN,
      y + 20,
      'Cada dificuldade ajusta o ouro e as vidas iniciais, independente do setor escolhido — e vale para qualquer um dos três.',
      {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#9fb3c8',
        wordWrap: { width: GAME_WIDTH - LEFT_MARGIN * 2 },
      },
    );
    y += 20 + diffNote.height + 14;

    // Progressão
    const progHeader = this.add.text(LEFT_MARGIN, y, 'PROGRESSÃO', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#5d7a94',
      fontStyle: 'bold',
    });
    y += progHeader.height + 8;

    const progNote = this.add.text(
      LEFT_MARGIN,
      y,
      'Completar um setor pela primeira vez rende mais Dados Recuperados do que repeti-lo depois. ' +
        'Use essa moeda na Loja para desbloquear novos módulos de defesa permanentemente.',
      {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#9fb3c8',
        wordWrap: { width: GAME_WIDTH - LEFT_MARGIN * 2 },
        lineSpacing: 2,
      },
    );
    y += progNote.height + 14;

    const backY = y + 16;
    const back = this.add
      .rectangle(GAME_WIDTH / 2, backY, 200, 44, 0x3498db)
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
  }

  private addEntryRow(
    x: number,
    y: number,
    opts: {
      markerColor: number;
      markerShape: 'circle' | 'square';
      name: string;
      nameColor: string;
      description: string;
      fullWidth?: boolean;
    },
  ): number {
    const markerOffset = 8;
    if (opts.markerShape === 'circle') {
      this.add.circle(x + markerOffset, y + 9, 6, opts.markerColor);
    } else {
      this.add.rectangle(x + markerOffset, y + 9, 13, 13, opts.markerColor);
    }

    const textX = x + markerOffset * 2 + 12;
    const wrapWidth = opts.fullWidth ? GAME_WIDTH - textX - LEFT_MARGIN : COLUMN_WIDTH - markerOffset * 2 - 12;

    const nameText = this.add.text(textX, y, opts.name, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: opts.nameColor,
      fontStyle: 'bold',
    });

    const descText = this.add.text(textX, y + nameText.height + 2, opts.description, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#9fb3c8',
      wordWrap: { width: wrapWidth },
      lineSpacing: 2,
    });

    return y + nameText.height + 2 + descText.height + 9;
  }
}
