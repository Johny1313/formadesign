# FORMA DESIGN 0.9.7.5.19

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


## Remove BG — v0.9.7.5.19

- Corrigido para imagens locais, externas, GIPHY e assets via proxy.
- Tenta primeiro `/api/remove-bg` no Worker.
- Em preview/local, 404/405/501 ou falha de rede acionam fallback direto para a API remove.bg.
- O elemento permanece na mesma posição, tamanho e camada da prancheta.
- Máscaras recebem a imagem processada sem perder o elemento.
- Mensagens de erro preservam o motivo retornado pela API.


## Deploy verification — v0.9.7.5.19

After `npm install` and `npm run deploy`, verify:

- `/api/health` returns `version: 0.9.7.5.19`.
- `/design/` shows `0.9.7.5.19` in the top bar.
- responses under `/design/` include `X-Forma-Version: 0.9.7.5.19` and `Cache-Control: no-store`.
- Chart Studio PNG export keeps transparent pixels outside the chart.
- Forma > Shapes > Line is stroke-only, with no fill controls and 0.25px increments.

## Chart Studio — v0.9.7.5.19

- Linha e Área agora detectam todas as colunas após a cronologia: A = período; B..N = séries/categorias.
- O caminho legado de uma única série foi preservado sem alteração de renderização.
- Gráficos de corrida continuam usando os datasets já validados e não foram substituídos.
- Em múltiplas séries, cada coluna recebe stroke/cor independente e legenda pelo cabeçalho do CSV.
- Teste de regressão `scripts/test-chart-multiseries.mjs` impede retorno ao parser fixo em `r[1]` para Linha/Área.

## Chart responsive resize — v0.9.7.5.19

- Gráficos integrados continuam redimensionáveis diretamente na prancheta.
- Durante o arraste, o gráfico acompanha toda a área do elemento, sem criar letterbox/espaço vazio por `object-fit: contain`.
- Ao soltar um handle (ou alterar L/A numericamente), um renderizador isolado do Chart Studio recalcula o gráfico usando a nova largura × altura como formato customizado.
- O novo PNG transparente retorna para a mesma camada, preservando posição, rotação, opacidade, ordem de camada, `chartConfig` e histórico.
- A próxima abertura em “Editar no Chart Studio” usa a proporção atualizada da área do gráfico.
- O renderizador responsivo usa um iframe dedicado e mensagens com `event.source` isolado para não interferir no Chart Studio modal.
- Exportação da prancheta usa a área exata do elemento do gráfico.
- `npm run check` agora inclui `CHART_RESPONSIVE_RESIZE_TEST` além dos testes já existentes de Remove BG e CSV multi-séries.
