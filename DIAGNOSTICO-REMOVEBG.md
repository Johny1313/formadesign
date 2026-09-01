# Diagnóstico preciso — Remove BG

Versão analisada: FORMA DESIGN 0.9.7.5.14 / 0.9.7.5.16
Correção preparada: 0.9.7.5.17

## Causa raiz confirmada

Os botões `#removeBgBtn` e `#removeBgMaskBtn` estavam presentes no HTML, e a função `removeBgForElement()` também existia, porém não havia `onclick` nem `addEventListener('click', ...)` conectando os botões ao motor.

Resultado: clicar em “Remover fundo” não iniciava nenhuma requisição. O backend podia estar correto e mesmo assim nunca seria chamado.

## Por que os testes anteriores enganaram

O script `scripts/test-remove-bg.mjs` substitui `globalThis.fetch` por um mock que sempre responde HTTP 200 ao endpoint remove.bg. Portanto o PASS anterior validava apenas a função do backend com resposta simulada; não validava UI, deploy, credencial, créditos ou comunicação real com o provedor.

## Correção 0.9.7.5.17

- Ligação explícita do botão de imagem a `removeBgForElement()`.
- Ligação explícita do botão de máscara a `removeBgForElement()`.
- Mensagens de seleção inválida antes do processamento.
- Teste de regressão que falha o build se os botões perderem novamente o wiring.
- Teste de cenários do backend cobrindo chave de ambiente inválida e fallback.

## Risco adicional encontrado

Existe uma chave fallback do remove.bg embutida no frontend. Isso expõe a credencial no HTML entregue ao navegador e pode causar consumo indevido de cota, invalidação da chave ou erro 402/403/429. O caminho recomendado é manter a chave somente como Secret do Cloudflare Worker (`REMOVEBG_API_KEY`) e nunca no browser.

Essa questão é separada da causa raiz do clique: antes da 0.9.7.5.17 o clique não chegava sequer a tentar o backend.
