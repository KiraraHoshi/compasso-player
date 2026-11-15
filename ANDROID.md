# Orolon no Android

O app Android é o mesmo site, empacotado com o [Capacitor](https://capacitorjs.com). Tudo é montado no GitHub Actions; nada precisa ser instalado no PC.

## APK de teste (automático)

Cada envio para a `main` gera um APK de teste, publicado em **Releases → Android (teste)**.
Ele é assinado com a chave fixa de `android-teste/`, então cada versão nova instala por cima da anterior.

## Versão da Google Play (.aab)

O arquivo da loja é assinado com a **chave de envio**, que nunca entra no repositório.

1. Cadastre os segredos uma vez: **Settings → Secrets and variables → Actions → New repository secret**
   - `OROLON_CHAVE_BASE64`: o conteúdo de `orolon-envio.base64.txt`
   - `OROLON_CHAVE_SENHA`: a senha da chave
   - `OROLON_CHAVE_ALIAS`: `orolon`
2. Na aba **Actions**, abra **App Android (loja)** e clique em **Run workflow**.
3. No fim da execução, baixe o `.aab` em **Artifacts** e envie no Play Console.

O `versionCode` sai da versão do app (1.16.0 → 116000), então sempre cresce. Para mandar uma atualização à loja, suba a versão em `js/app.js` antes.

Na primeira publicação, deixe ativado o **Play App Signing** (o padrão): o Google guarda a chave final do app, e a chave de envio pode ser trocada pelo suporte se um dia se perder.

## Permissões

`scripts/permissoes-android.mjs` acrescenta as permissões de reprodução em segundo plano (serviço de mídia, notificação e manter o aparelho acordado). Sem a de serviço de mídia, o Android 14+ fecha o app ao tocar.

`scripts/musicas-android.mjs` liga o plugin `android-plugin/MusicasPlugin.java` (lê a biblioteca de mídia do Android para "Procurar músicas no aparelho") e acrescenta a permissão de ler músicas: `READ_MEDIA_AUDIO` no Android 13+ e `READ_EXTERNAL_STORAGE` até o 12. Essa permissão é aceita pela Google Play para players de música; na ficha da loja, declare que o app lê arquivos de áudio do aparelho para tocá-los, sem enviar nada.

## Política de privacidade

[`privacidade.html`](https://kirarahoshi.github.io/compasso-player/privacidade.html), em português e inglês.
