# Testes do Orolon

- Rodar todos: `node testes/rodar.mjs` (ou só alguns: `node testes/rodar.mjs testes/inicio.teste.mjs`).
- Abrem o app de verdade num Chrome sem janela, em tamanhos de celular e PC; nada é instalado.
- Os prints que os testes tiram ficam em `testes/prints/` (fora do Git).
- Para usar outro navegador baseado em Chromium: defina `ORO_CHROME` com o caminho do executável.
- `i18n.teste.mjs` confere que todo texto do `app.js` tem tradução no `EN` de `js/i18n.js`.
