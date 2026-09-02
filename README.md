# FORMA DESIGN 0.9.7.5.35

Projeto independente do editor FORMA DESIGN.

## Estrutura

- `public/design/index.html` — editor principal.
- `public/design/chart-studio.html` — Chart Studio integrado como item **Gráficos** no menu lateral esquerdo.
- `public/design/smart-template-engine.js` — motor de templates preservado.
- `src/` — somente serviços necessários ao FORMA.

## Navegação

Não existe aplicação Ronda One neste pacote.
Não existe página/aba separada de Projetos.

O botão **Salvar projeto** permanece como função do editor e usa `/api/projects`.

## Integrações preservadas

Os nomes dos bindings/secrets continuam compatíveis:

- `AI`
- `DB`
- `GIPHY_API_KEY` — opcional; o pacote inclui fallback interno para GIPHY
- `REMOVEBG_API_KEY`
- `FORMA_IMAGE_MODEL` (opcional)

Secrets do Cloudflare não são armazenados no ZIP. Se este código for publicado em um Worker novo chamado `forma-design`, os secrets precisam existir nesse Worker.

## Chart Studio

A ferramenta **Gráficos** aparece diretamente na barra lateral esquerda do FORMA, junto das demais ferramentas.

## Texto — v0.9.7.5.7

- Caixa alta ativável sem destruir a capitalização original.
- Box de texto ativável, acompanhando o conteúdo.
- Margens superior, direita, inferior e esquerda independentes.
- Cor do box em HEX/seletor.
- Exportação PNG respeita caixa alta e box.
- remove.bg possui fallback interno no backend; `REMOVEBG_API_KEY` do ambiente continua tendo prioridade.

## v0.9.7.5.8

- Item Gráficos abre o Chart Studio diretamente na área central.
- Removido o painel intermediário explicativo de Gráficos.
- GIPHY usa `/api/giphy/*` quando o Worker está disponível.
- Em preview/local, um 404 da rota interna aciona fallback direto para `api.giphy.com`.
- A chave de GIPHY no backend continua preservada e o mesmo identificador é usado no fallback de navegador.

## Templates de cores — v0.9.7.5.9

- Criação de paletas com nome e até 6 cores.
- Edição e exclusão de paletas salvas.
- Persistência em `localStorage` com chave `formaDesign.colorTemplates.v1`.
- Captura automática das cores usadas em todas as pranchetas do projeto.
- Clique numa cor para aplicar ao elemento selecionado:
  - texto → cor do texto;
  - forma → preenchimento sólido;
  - máscara → cor da borda;
  - sem seleção → fundo da prancheta.

## Exclusão de objetos — v0.9.7.5.10

A exclusão foi reforçada por quatro caminhos:
- botão **Excluir** no painel Propriedades;
- tecla **Delete**;
- tecla **Backspace**, quando o foco não está em edição de texto/campo;
- botão **×** em cada camada e item **Excluir camada** no menu de contexto.

A exclusão múltipla também é suportada. Campos de texto, inputs e edição inline ignoram Backspace/Delete para evitar apagar objetos enquanto o usuário digita.


## Chart Studio integrado à prancheta — v0.9.7.5.11

- O Chart Studio deixou de ocupar uma área separada do editor.
- O gráfico agora é inserido diretamente na prancheta atual como um elemento integrado.
- Não é criada uma nova prancheta para usar gráficos.
- O elemento de gráfico pode ser movido, redimensionado, duplicado, organizado em camadas e exportado junto com o layout.
- Elementos inseridos pelo Chart Studio ficam marcados como `assetKind: "chart"` e podem ser reabertos no editor de gráficos.


## Ajuste de espessura inicial da linha — v0.9.7.5.12

- A espessura inicial da linha no Chart Studio foi reduzida para **1 px**.
- Isso vale para o controle de linha usado nos gráficos de **linha** e **área** ao abrir a ferramenta.
- O ajuste manual continua disponível normalmente.


## Inserção de gráfico na prancheta — v0.9.7.5.13

- O modal do Chart Studio agora tem um botão externo e visível: **Inserir no FORMA**.
- Esse botão envia o gráfico diretamente para a **prancheta ativa**.
- Depois de inserir ou atualizar, o FORMA volta automaticamente para a última aba normal de edição.
- O gráfico continua na prancheta como um elemento integrado do design.
- O elemento pode ser selecionado novamente e reaberto no Chart Studio para nova edição.


## Remove BG — v0.9.7.5.35

- Corrigido para imagens locais, externas, GIPHY e assets via proxy.
- Tenta primeiro `/api/remove-bg` no Worker.
- Em preview/local, 404/405/501 ou falha de rede acionam fallback direto para a API remove.bg.
- O elemento permanece na mesma posição, tamanho e camada da prancheta.
- Máscaras recebem a imagem processada sem perder o elemento.
- Mensagens de erro preservam o motivo retornado pela API.


## Deploy verification — v0.9.7.5.35

After `npm install` and `npm run deploy`, verify:

- `/api/health` returns `version: 0.9.7.5.35`.
- `/design/` shows `0.9.7.5.35` in the top bar.
- responses under `/design/` include `X-Forma-Version: 0.9.7.5.35` and `Cache-Control: no-store`.
- Chart Studio PNG export keeps transparent pixels outside the chart.
- Forma > Shapes > Line is stroke-only, with no fill controls and 0.25px increments.

## Chart Studio — v0.9.7.5.35

- Linha e Área agora detectam todas as colunas após a cronologia: A = período; B..N = séries/categorias.
- O caminho legado de uma única série foi preservado sem alteração de renderização.
- Gráficos de corrida continuam usando os datasets já validados e não foram substituídos.
- Em múltiplas séries, cada coluna recebe stroke/cor independente e legenda pelo cabeçalho do CSV.
- Teste de regressão `scripts/test-chart-multiseries.mjs` impede retorno ao parser fixo em `r[1]` para Linha/Área.

## Chart responsive resize — v0.9.7.5.35

- Gráficos integrados continuam redimensionáveis diretamente na prancheta.
- Durante o arraste, o gráfico acompanha toda a área do elemento, sem criar letterbox/espaço vazio por `object-fit: contain`.
- Ao soltar um handle (ou alterar L/A numericamente), um renderizador isolado do Chart Studio recalcula o gráfico usando a nova largura × altura como formato customizado.
- O novo PNG transparente retorna para a mesma camada, preservando posição, rotação, opacidade, ordem de camada, `chartConfig` e histórico.
- A próxima abertura em “Editar no Chart Studio” usa a proporção atualizada da área do gráfico.
- O renderizador responsivo usa um iframe dedicado e mensagens com `event.source` isolado para não interferir no Chart Studio modal.
- Exportação da prancheta usa a área exata do elemento do gráfico.
- `npm run check` agora inclui `CHART_RESPONSIVE_RESIZE_TEST` além dos testes já existentes de Remove BG e CSV multi-séries.


## Axis typography — v0.9.7.5.35

- Independent font-size controls for X-axis labels (`valor/data/categoria`) and Y-axis index/tick labels.
- Range: 6–96 px, default 10 px.
- X-axis bottom reserve grows according to font size and label rotation.
- Y-axis left reserve grows with font size to reduce clipping.
- Settings persist in Chart Studio config and are preserved when reopening/responsive re-rendering inside the artboard.
- Line Chart Race uses the same X/Y axis font-size controls.

## v0.9.7.5.35 — Layout, palette themes, fill/stroke and export chooser

- Color templates moved from **Fundo** to the new **Layout** tab.
- Palettes can be applied to the current artboard, remapping background, text, text boxes, shape fills, line/shape strokes, gradients, mask borders and chart series colors.
- Shapes can disable fill and remain stroke-only.
- Stroke style can switch between continuous and dotted; canvas export follows the same style.
- Chart animation speed now goes down to **0.05×**.
- Clicking **Baixar** opens a format chooser instead of relying on a fixed selector.
- Export choices: PNG, transparent PNG, H264, WEBM, transparent WEBM, WEBP and SVG. H264/alpha video output depends on browser codec support.

## Shared library + Projects — v0.9.7.5.35

- Design templates and color palettes are now persisted in the existing D1 database through `/api/library` and are shared by everyone opening the same FORMA deployment.
- Existing templates/palettes stored in the current browser migrate once to D1 after the first load of this version. D1 becomes authoritative afterward so deleted shared assets are not recreated by old local caches.
- Uploaded custom fonts are also stored in the shared D1 library. Large font payloads are split into small database chunks and reassembled when a new browser loads the FORMA link.
- Existing IndexedDB fonts migrate once from the browser that already has them. New font uploads are written to the shared library immediately.
- The `Projetos` tab is restored. It lists D1 projects, opens them as editable FORMA projects, updates the same project on Save, and supports deletion.
- `/api/projects/:id` now supports DELETE and project create/update returns a top-level `id` for frontend compatibility.

## Clipboard e agrupamento — v0.9.7.5.35

- `Ctrl+C` / `Cmd+C`: copia a seleção atual para o clipboard interno do FORMA.
- `Ctrl+V` / `Cmd+V`: cola na prancheta ativa; funciona depois de trocar de prancheta.
- Ao colar na mesma prancheta, o FORMA desloca a cópia para evitar sobreposição exata.
- Ao colar em outra prancheta, a posição original é preservada sempre que couber na área disponível.
- `Ctrl+G` / `Cmd+G`: agrupa dois ou mais elementos sem rasterizar/achatar os objetos.
- `Ctrl+Shift+G` / `Cmd+Shift+G`: desagrupa.
- Copiar, colar, duplicar, excluir, mover, trazer para frente e enviar para trás respeitam os vínculos de grupo.
- Textos e máscaras dentro de grupos continuam editáveis individualmente por duplo clique.

## Rich text + alinhamento — v0.9.7.5.35

- Um único elemento de texto pode ter trechos com fonte, peso e cor independentes.
- Selecione um trecho enquanto o texto está em edição e use os mesmos controles de Fonte, Peso e Cor.
- O rich text é persistido em projetos, templates, clipboard entre pranchetas e exportação em canvas.
- Setas movem a seleção em 1 px; Shift + setas move 10 px.
- Ctrl/Cmd + Z desfaz; Ctrl/Cmd + Shift + Z e Ctrl/Cmd + Y refazem.
- Alinhamento entre elementos: esquerda, centro, direita, topo, meio e base.
- Alinhamento da seleção à prancheta preserva a posição relativa dos elementos internos.
- Com 3 ou mais objetos/grupos selecionados, distribuição horizontal ou vertical cria espaçamento igual.

## Clipboard + planilha de colagem — v0.9.7.5.35
- Corrige regressão de Ctrl+C / Ctrl+V após a introdução do rich text: o clipboard de elementos só é bloqueado quando o foco está realmente em input, textarea, select ou contenteditable.
- Mantém cópia nativa de texto quando o cursor está dentro da edição textual.
- `Colar dados na planilha` não tenta mais ler silenciosamente o clipboard do navegador.
- O botão abre a planilha em modo ampliado, foca a primeira célula e aguarda Ctrl+V / Cmd+V.
- Escape ou `Fechar planilha` retorna ao Chart Studio normal.

## Planilha — cabeçalho obrigatório na primeira linha (v0.9.7.5.35)

- A primeira linha colada/importada é sempre interpretada como cabeçalho das colunas.
- Os dados usados pelo gráfico começam obrigatoriamente na segunda linha.
- A grade marca visualmente a primeira linha como cabeçalho (`H`).
- O status da planilha mostra separadamente `Cabeçalho + N linhas de dados`.
- Exemplo: `candidato | indice` é cabeçalho; `estagio | 14` e `jovem aprendiz | 9` são dados.

## Video fidelity lock — v0.9.7.5.35

- Board H264/WEBM export is now frame-driven instead of recording a static canvas.
- The compositor clears and rebuilds the full board on every recorded frame, preserving layer order and avoiding accumulated/duplicated text artifacts.
- Media assets are preloaded once and reused while recording.
- Embedded FORMA charts get dedicated hidden Chart Studio renderers. Their frame progress is driven by the original chart animation duration and speed stored in `chartConfig`.
- If multiple animated charts exist on the board, the video duration follows the longest enabled chart animation; shorter animations remain on their final frame.
- Rich-text canvas export now falls back safely to the canonical plain-text content if stored rich HTML no longer matches the text model, preventing duplicated text in raster/video exports.

## Board video fidelity — v0.9.7.5.35

- Text export no longer rebuilds line wrapping independently from the editor. Static and video exports pre-rasterize text from the browser DOM layout, preserving rich text spans, font family, font weight, color, alignment, line breaks, letter spacing and text boxes.
- Animated GIF elements are detected separately from static images. During video export they stay attached to the browser as live animated image elements and are sampled on every compositor frame.
- GIF frame delays are read from the GIF metadata when available; the GIF loop duration participates in the board video duration together with animated charts.
- Chart animation timing remains driven by the Chart Studio duration/progress contract introduced in v0.9.7.5.32.
- The board compositor still clears and rebuilds every frame in layer order to prevent temporal pixel accumulation.
