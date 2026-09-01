# FORMA DESIGN 0.9.7.5.6

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
- `GIPHY_API_KEY`
- `REMOVEBG_API_KEY`
- `FORMA_IMAGE_MODEL` (opcional)

Secrets do Cloudflare não são armazenados no ZIP. Se este código for publicado em um Worker novo chamado `forma-design`, os secrets precisam existir nesse Worker.

## Chart Studio

A ferramenta **Gráficos** aparece diretamente na barra lateral esquerda do FORMA, junto das demais ferramentas.
