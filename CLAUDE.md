# Núcleo — contexto do projeto

Tower defense pessoal (Phaser 3 + TypeScript + Vite). Este arquivo existe para que qualquer
sessão nova do Claude Code (em qualquer máquina, após `git clone`) tenha contexto completo do
projeto sem precisar que o usuário reexplique tudo.

## O jogo

Tema: uma rede digital sendo infectada por um vírus. O jogador defende o **Núcleo** (o objeto
no fim do caminho) contra ondas de **Vetores** (inimigos: Fragmento, Pulso, Monólito) usando
**Módulos de Defesa** (torres: Emissor, Rastreador, Disruptor). Ver `src/scenes/AboutScene.ts`
para a história completa e `src/game/constants.ts` para os valores de cada entidade.

Fluxo de telas: `MenuScene → AboutScene` (opcional) `→ MapSelectionScene → DifficultyScene →
GameScene + UIScene` (rodam em paralelo, UIScene é o HUD sobreposto).

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
- **`src/game/maps.ts`** define cada setor: `pathGrid` (waypoints em coordenadas de grade),
  `waveCurve` (curva de dificuldade das ondas) e `goldBonus`. Adicionar um setor novo é só
  adicionar uma entrada aqui — nada mais precisa mudar.
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

3 setores (Perímetro/Roteamento/Firewall), 3 dificuldades, bônus de ouro por setor, modo
infinito, tela Sobre com a história, imagem de fundo no menu, sistema de reiniciar/voltar ao
menu preservando setor+dificuldade.

## Roadmap combinado (ainda não implementado)

- Setor Expert (4º tier)
- Interferência de sinal / Line of Sight, reservado para os setores Avançado/Expert
- Sistema de conclusão/medalhas por setor × dificuldade (provavelmente via `localStorage`)
- Modificadores de desafio opcionais (ex: sem vender módulos)

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
