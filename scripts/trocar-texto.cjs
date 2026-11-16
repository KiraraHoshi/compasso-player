// Troca trechos exatos num arquivo mantendo a quebra de linha original (o clone é CRLF).
// Uso num script Node:  const ed = require("./scripts/trocar-texto.cjs");
//   ed("js/app.js").rep(`texto antigo`, `texto novo`).salvar();
// rep() exige que o trecho apareça exatamente uma vez; se não, para com erro e nada é gravado.
// .txt dá (e recebe) o conteúdo inteiro, para trocas maiores.
const fs = require("fs");
module.exports = (arq) => {
  const bruto = fs.readFileSync(arq, "utf8"), crlf = bruto.includes("\r\n");
  let a = bruto.replace(/\r\n/g, "\n");
  const api = {
    get txt() { return a; }, set txt(v) { a = v; },
    rep(de, para) { const n = a.split(de).length - 1; if (n !== 1) throw new Error(`${arq}: ${n} ocorrências de: ${de.slice(0, 80)}`); a = a.replace(de, () => para); return api; },
    salvar() { fs.writeFileSync(arq, crlf ? a.replace(/\n/g, "\r\n") : a); },
  };
  return api;
};
