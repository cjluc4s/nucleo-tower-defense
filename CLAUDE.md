# Núcleo — contexto do projeto

Tower defense pessoal (Phaser 3 + TypeScript + Vite). Este arquivo existe para que qualquer
sessão nova do Claude Code (em qualquer máquina, após `git clone`) tenha contexto completo do
projeto sem precisar que o usuário reexplique tudo.

## O jogo

Tema: uma rede digital sendo infectada por um vírus. O jogador defende o **Núcleo** (o objeto
no fim do caminho) contra ondas de **Vetores** (inimigos: Fragmento, Pulso, Monólito) usando
**Módulos de Defesa** (torres: Emissor, Rastreador, Disruptor). Ver `src/scenes/AboutScene.ts`
para a história completa e `src/game/constants.ts` para os valores de cada entidade.

Fluxo de telas: `MenuScene → AboutScene` (opcional) `→ MapSelectionScene → SectorMapScene →
DifficultyScene → GameScene + UIScene` (rodam em paralelo, UIScene é o HUD sobreposto).

## Rodar e verificar

```bash
npm install
npm run dev          # dev server, http://localhost:5173
npx tsc --noEmit      # type-check (sempre rodar após editar)
npm run build         # build de produção (roda tsc + vite build)
```

Depois de qualquer mudança visual/gameplay, teste no navegador antes de considerar concluído.

## Arquitetura — decisões importantes

- **`src/game/`** é lógica pura (sem `Phaser.Scene` como dependência direta, exceto tipos) —
  `Enemy`, `Tower`, `Projectile`, `WaveManager` recebem `pathPoints` por parâmetro, nunca leem
  um caminho fixo global. Isso é o que permite múltiplos mapas sem duplicar lógica.
- **`src/game/maps.ts`** separa **setor** (`SectorDef`: nome, descrição geral e `tier` —
  Perímetro/Roteamento/Firewall) de **rota** (`MapDef`: um traçado jogável específico dentro de
  um setor — `pathGrid`, `waveCurve`, `goldBonus`, moeda de recompensa). Um setor pode ter
  várias rotas (hoje 2 por setor: "Rota Primária" e "Rota Alternativa", ambas com a mesma
  `waveCurve`/`goldBonus` — só o traçado muda). Adicionar uma rota nova a um setor existente é
  só adicionar uma entrada em `MAP_DEFS` com o mesmo `tier`; adicionar um setor novo é adicionar
  uma entrada em `SECTOR_DEFS` (mais pelo menos uma rota em `MAP_DEFS` com esse `tier`) — nada
  mais precisa mudar. `MapDef.key` é o identificador salvo em `progress.ts` (`completedMaps`),
  então **nunca renomear uma key existente** sem migrar o progresso salvo dos jogadores.
- Fluxo de seleção: `MapSelectionScene` lista os setores (usa `SECTOR_DEFS`) → `SectorMapScene`
  lista as rotas daquele setor (`getMapsByTier(tier)`) → `DifficultyScene` recebe o `mapKey`
  escolhido. O botão Voltar de `DifficultyScene` volta para `SectorMapScene` (não para
  `MapSelectionScene`), preservando o "drill-down". Hoje todas as rotas de um setor já
  aparecem liberadas assim que o setor é alcançado — não há gate de progressão entre rotas do
  mesmo setor ainda (decisão explícita do usuário, para revisitar quando o jogo estiver numa
  fase de manutenção/otimização, trocando para liberar a 2ª rota só após completar a 1ª).
- **Dificuldade do mapa (setor) ≠ dificuldade econômica (Fácil/Médio/Difícil).** São dois eixos
  independentes e isso é proposital: o setor define o *layout* do caminho e em qual "onda
  virtual" a progressão começa; a dificuldade define ouro/vidas/recompensa. Não misture os dois
  conceitos ao propor mudanças.
- **Curva de ondas** (`getWaveEntries` em `constants.ts`) é uma função pura parametrizada por
  `WaveCurveConfig`, capaz de gerar a composição de qualquer índice de onda — inclusive além do
  `waveCount` do mapa. É isso que alimenta o **modo infinito**: `WaveManager.enableEndless()`
  simplesmente para de respeitar o limite e continua chamando a mesma função com índices
  crescentes.
- **Passagem de estado entre cenas** é via `data` do `scene.start()/launch()` (ex:
  `{ difficulty, mapKey }`) — cada cena que precisa dessa info implementa `init(data)`. Ao
  adicionar uma cena nova nesse fluxo, seguir o mesmo padrão.
- **`EventBus`** (`src/game/EventBus.ts`) é o canal de comunicação entre `GameScene` e
  `UIScene`, que rodam como cenas paralelas independentes.
- **`src/game/progress.ts`** é a única fonte de verdade pra progresso persistente (`localStorage`,
  chave `nucleo-progress-v1`): saldo de **Dados Recuperados** (moeda meta, ganha ao completar um
  setor — mais na primeira vez que numa repetição, ver `MapDef.currencyFirstClear/RepeatClear`),
  quais setores já foram completados ao menos uma vez, e quais módulos foram desbloqueados na
  loja. **Nunca** ler/escrever `localStorage` direto fora desse módulo. Módulos com
  `unlockedByDefault: false` em `TOWER_DEFS` só aparecem na barra de construção do `GameScene`
  se `isTowerUnlocked()`/`getAvailableTowerKeys()` disser que sim.
- **Módulos de defesa sempre aparecem em ordem crescente de custo** — barra de construção
  (`UIScene`, por custo no setor atual via `getTowerCost`), Loja (`ShopScene`) e tela Sobre
  (`AboutScene`), todos ordenando por custo em vez de seguir a ordem de inserção em
  `TOWER_DEFS`. Padrão combinado com o usuário: ao adicionar um módulo novo, não precisa
  (e não deve) inserir manualmente na posição "certa" em `TOWER_DEFS` — a ordenação por
  custo em cada tela já resolve isso sozinha.

## Armadilhas conhecidas (já mordemos essas)

- **Uma cena reiniciando a si mesma**: `this.scene.stop(key); this.scene.launch(key, data)` no
  mesmo tick, chamado de dentro da própria cena `key`, **não é processado de forma confiável**
  pelo Phaser — o HUD some. Usar `this.scene.restart(data)` (sem passar a key — ele já sabe
  qual cena é) para uma cena reiniciar a si mesma. Isso já foi corrigido em `UIScene.restartRun()`.
- **Cache do Vite ficando dessincronizado**: depois de várias edições ao vivo com o dev server
  rodando, às vezes aparecem erros tipo "module does not provide an export named X" pra
  exports que já foram removidos há tempos. Não é bug de código — é cache. Fix:
  `rm -rf node_modules/.vite` e reiniciar o dev server (ou abrir uma aba nova do zero, já que o
  console de uma aba antiga também pode reter mensagens de erro obsoletas).

## Estado atual (implementado)

3 setores (Perímetro/Roteamento/Firewall), 2 rotas por setor (6 mapas jogáveis no total,
liberadas desde o início), 3 dificuldades, bônus de ouro por setor, modo infinito, tela Sobre
com a história, imagem de fundo no menu, sistema de reiniciar/voltar ao menu preservando
rota+dificuldade. Loja (`ShopScene`) com moeda persistente (Dados Recuperados, ganha ao
completar rotas) e o 4º módulo **Limitador** (aplica lentidão, primeiro item comprável — 150
Dados Recuperados).

## Roadmap combinado (ainda não implementado)

- Setor Expert (4º tier)
- Interferência de sinal / Line of Sight, reservado para os setores Avançado/Expert
- Mais itens na loja além do Limitador (novos módulos, cosméticos, etc.)
- Sistema de medalhas/conquistas visual por setor × dificuldade (o progresso já é rastreado em
  `progress.ts`, falta só uma UI pra exibir isso)
- Modificadores de desafio opcionais (ex: sem vender módulos)
- Gate de progressão entre rotas do mesmo setor (hoje as 2 rotas de cada setor já vêm liberadas
  desde o início, de propósito — só trocar para "libera a 2ª rota ao completar a 1ª" quando o
  jogo estiver numa fase de manutenção/otimização, não antes)

Ao propor essas features, seguir a mesma régua já estabelecida: **tudo tem que fazer sentido
dentro da história do Núcleo** — nada de mecânica emprestada de outro jogo sem adaptar ao tema
(nada de "macaco" num jogo que não fala de macaco).

## Workflow com o usuário

- Está autorizado a fazer `git add` / `commit` / `push` direto neste repositório sem pedir
  confirmação a cada vez — combinado explicitamente com o usuário. Ainda assim, revisar o que
  está sendo commitado (nunca incluir segredos) e escrever mensagens de commit claras.
- O usuário gosta de alinhar direção/números antes da implementação em mudanças de design ou
  balanceamento (nomes, valores de economia, mecânicas novas) — mas para bugs e ajustes já
  combinados, pode implementar direto e mostrar o resultado testado.
- Sempre verificar mudanças rodando o jogo de verdade (navegador), não só `tsc`.
