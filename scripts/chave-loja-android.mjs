// Prepara o build da Google Play: assina o .aab com a chave de envio (vinda dos segredos do GitHub)
// e calcula o versionCode a partir da versão (1.16.0 -> 116000), para ele sempre crescer.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const arq = "android/app/build.gradle";
let g = readFileSync(arq, "utf8");
const versao = readFileSync("js/app.js", "utf8").match(/const VERSAO = "([\d.]+)"/)[1];
const [a, b, c] = versao.split(".").map(Number);
const codigo = (a * 10000 + b * 100 + c) * 10;
const loja = resolve("android/orolon-envio.jks").replace(/\\/g, "/");
const bloco = `
    signingConfigs {
        loja {
            storeFile file("${loja}")
            storePassword System.getenv("OROLON_CHAVE_SENHA")
            keyAlias System.getenv("OROLON_CHAVE_ALIAS")
            keyPassword System.getenv("OROLON_CHAVE_SENHA")
        }
    }
`;
g = g.replace(/android\s*\{/, (m) => m + bloco);
g = g.replace(/buildTypes\s*\{\s*release\s*\{/, (m) => m + `\n            signingConfig signingConfigs.loja`);
g = g.replace(/versionCode \d+/, `versionCode ${codigo}`).replace(/versionName "[^"]*"/, `versionName "${versao}"`);
writeFileSync(arq, g);
console.log(`Orolon ${versao} (versionCode ${codigo})`);
