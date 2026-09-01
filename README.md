# FORMA DESIGN 0.9.7.5.9

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
