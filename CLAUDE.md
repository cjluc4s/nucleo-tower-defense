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
- **Clique perdido entre cenas, sob `Phaser.Scale.FIT`**: um clique/toque na `UIScene`
  (cena de cima) imediatamente seguido por um clique na `GameScene` (cena de baixo) faz o
  Phaser **perder o evento `pointerdown` na cena de baixo** — mas o `pointerup` da mesma
  interação chega certinho. Não reproduz com `Scale.NONE`, nem entre botões da mesma cena, nem
  quando o clique anterior foi na própria `GameScene`. Causa raiz não totalmente mapeada, mas o
  fix é: `GameScene` escuta a zona de clique da grade em `'pointerup'`, não `'pointerdown'` (ver
  `GameScene.create()`). Como consequência, cancelar seleção com botão direito não pode usar
  `pointer.rightButtonDown()` (lê o estado *atual* do botão — já falso no momento do `up`) —
  usa `pointer.button === 2` (snapshot de qual botão dispara *este* evento) em `handleClick()`.
  Se algum dia mexer nesse listener, testar exatamente essa sequência (clicar um botão da UI,
  depois imediatamente a grade, sem mover o mouse) antes de considerar resolvido.
- **`Phaser.Scale.CENTER_BOTH` vs. centralização por flexbox no CSS**: o Scale Manager já
  centraliza o canvas dentro do elemento `#app` sozinho, via `margin-left`/`margin-top`
  inline. Se o `#app` **também** tiver `display:flex; align-items:center; justify-content:center`,
  os dois centering se somam e o canvas fica deslocado (mais visível em telas bem largas). O
  `#app` não deve centralizar nada — só define o tamanho disponível; quem centraliza o canvas
  dentro dele é o Phaser (`autoCenter: Phaser.Scale.CENTER_BOTH` em `main.ts`). Quem centraliza
  o próprio `#app` na página (quando ele fica menor que a viewport por causa do `max-width`) é
  o `body`, que pode ter seu próprio flex-center sem problema — o conflito é só entre o Phaser
  e o `#app` diretamente.

## Estado atual (implementado)

3 setores (Perímetro/Roteamento/Firewall), 2 rotas por setor (6 mapas jogáveis no total,
liberadas desde o início), 3 dificuldades, bônus de ouro por setor, modo infinito, tela Sobre
com a história, imagem de fundo no menu, sistema de reiniciar/voltar ao menu preservando
rota+dificuldade. Loja (`ShopScene`) com moeda persistente (Dados Recuperados, ganha ao
completar rotas) e o Rastreador como item comprável (200 Dados Recuperados) — Limitador vem
desbloqueado por padrão.

**Responsivo** (`Phaser.Scale.FIT` em `main.ts`): o canvas escala pra caber em qualquer tela
(celular, tablet, monitor grande), limitado a 2x a resolução nativa via `max-width/max-height`
no `#app` (`style.css`) pra não borrar. O texto usa uma resolução interna mais alta por padrão
(patch em `main.ts` na factory `GameObjectFactory.text`) pra ficar nítido mesmo escalado.
Celular/tablet em retrato mostra um aviso pra girar o aparelho (`#rotate-overlay` no
`index.html` + media query no `style.css`) — a grade 15x10 não cabe bem na vertical. Ver as
duas armadilhas relacionadas a `Scale.FIT` acima antes de mexer nisso.

- **Canvas (`GAME_WIDTH`) é mais largo que a grade jogável (`GRID_WIDTH`), de propósito.** A
  grade continua com seu tamanho original em pixels (15×10 células de 64px = 960×640) — todo
  mapa em `maps.ts` é definido em unidades de coluna/linha contra isso, então isso nunca pode
  mudar só pra caber numa tela. O canvas em si (`GAME_WIDTH` em `constants.ts`) é ~16:9
  (1350×758), porque essa proporção fica muito mais perto tanto de monitor widescreen comum
  quanto de celular na horizontal (~2:1) do que a proporção da própria grade (960:640 ≈ 1.5:1)
  — com a grade sozinha como canvas, `Scale.FIT` sobrava boa parte da largura em preto puro em
  celular (bug relatado pelo usuário: "muito longe", grade telinha no meio de uma tela preta).
  A grade fica centralizada horizontalmente dentro do canvas mais largo via `GRID_OFFSET_X`
  (`constants.ts`) — `path.ts` (`gridToPixel`) e `GameScene.ts` (desenho da grade, hover,
  `pixelToCell`) aplicam esse offset. As barras de HUD em `UIScene.ts` continuam ocupando o
  canvas inteiro (fundo escuro edge-to-edge, sem voltar a parecer "vazio"), mas o conteúdo da
  barra inferior (botões de módulo + Iniciar Onda) é deslocado por `GRID_OFFSET_X` pra ficar
  visualmente alinhado embaixo da grade em vez de grudado na borda esquerda do canvas.
  `computeSellPanelBounds` também usa `GRID_OFFSET_X`/`GRID_WIDTH` (não `GAME_WIDTH`) pra
  travar o painel de venda dentro da área da grade. Ao adicionar posições novas em qualquer
  cena: conteúdo que deve ficar "preso à grade" usa `GRID_OFFSET_X`; conteúdo que é só HUD
  solto (textos/botões no topo, telas de menu/loja/sobre centralizadas) pode continuar usando
  `GAME_WIDTH` normalmente — a maioria das cenas fora do `GameScene`/`UIScene` já centraliza
  tudo via `GAME_WIDTH / 2`, então herdou o canvas mais largo automaticamente, sem precisar de
  nenhum ajuste manual.
  - **Consequência que já mordeu uma vez:** todo mapa em `maps.ts` começa o `pathGrid` num
    ponto fora da grade (`OFFSCREEN_SPAWN_COL`, `constants.ts` — um número de colunas negativo,
    calculado a partir de `GRID_OFFSET_X`) pra dar a impressão de que o vetor entra vindo de
    fora da tela. Como o canvas agora é mais largo que a grade, o segmento reto desenhado desse
    ponto até o primeiro waypoint on-grid cruza a margem do canvas — visível, fora do
    retângulo da grade, ainda que dentro do canvas. Fix: `GameScene.createGridMask()` cria uma
    `Phaser.Display.Masks.GeometryMask` do retângulo exato da grade, aplicada tanto no
    `Graphics` do `drawPath()` quanto no `container` de cada `Enemy` (no callback de spawn do
    `WaveManager`, em `create()`). Qualquer objeto novo que possa ficar posicionado fora da
    grade (hoje só o caminho e os vetores; torres/projéteis não saem da grade) precisa do mesmo
    `.setMask(this.gridMask)`.
- **Mobile: altura de viewport instável.** `main.ts` espelha `window.innerHeight` numa CSS var
  (`--app-height`, usada em `#app` no `style.css` como override de `100dvh`) e força
  `game.scale.refresh()` em `resize`/`orientationchange` (com um retry atrasado de 300ms) —
  navegadores mobile (Safari em especial) redimensionam a barra de endereço depois da página já
  ter feito layout, e `dvh` sozinho nem sempre acompanha isso a tempo, especialmente logo após
  girar o aparelho.

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
- **Manter o `README.md` sempre atualizado.** Ao concluir qualquer feature/mudança visível
  (novo recurso, setor, módulo, mecânica, mudança na tela inicial, deploy, etc.), atualizar as
  seções relevantes do README (Recursos, Roadmap, Estrutura do projeto, etc.) como parte da
  própria mudança — não esperar o usuário pedir. Roadmap: mover item de pendente pra concluído
  (ou remover, se virou recurso listado em "Recursos") assim que for implementado.
