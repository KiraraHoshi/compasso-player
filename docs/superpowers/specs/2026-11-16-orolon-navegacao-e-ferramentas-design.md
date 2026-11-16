# Orolon 1.18–1.20: navegação nova, ferramentas e refinamentos

Data: 16/11/2026 · Versão de partida: 1.17.3

## Por que

O Orolon vai para a Google Play como o primeiro app do Jo-ah. É um projeto pessoal e sem prazo: dar certo é um extra. A meta é ganhar espaço contra players grátis que fazem sucesso. Para isso, a ideia é **trazer o que o concorrente faz bem, cortar o que irrita** e manter o app grátis. No futuro, só itens **cosméticos** serão pagos, para ninguém poder dizer que o app piorou ou que o desenvolvedor é ganancioso.

O concorrente analisado foi o "Reprodutor de Música Offline" (Dairy App, mais de 50 mi de downloads). Os vídeos estão em `Concorrencia/`, na pasta do projeto no PC.
- **O que ele faz bem:** ferramentas a um toque (painel "Mais"), amplificador de volume, reverb e efeito 3D, modo de condução, widgets, retomar de onde parou e tela inicial útil.
- **O que irrita:** anúncio fixo em toda tela, pedido de acesso a fotos e vídeos, tela vazia ao abrir, assinatura agressiva (3 dias grátis que viram R$ 30,99/ano) e itens "(AD)" no menu.

"Responsivo" (pedido do Jo-ah: "quanto mais responsivo, melhor") vale nos dois sentidos: rápido ao toque e bem adaptado ao celular em pé, ao celular deitado e ao PC.

## Metas

1. Abrir o app e já ver algo útil: continuar a música, ferramentas e recentes.
2. Deixar toda ferramenta a no máximo dois toques da tela inicial.
3. Quebrar a tela de Ajustes, que hoje é uma rolagem longa, em partes curtas.
4. Corrigir os quatro detalhes de acabamento que aparecem na primeira visita.
5. Igualar as funções grátis do concorrente que fazem falta: amplificador, reverb/3D, modo carro, retomar e tocar ao conectar o fone.
6. Redesenhar o ícone e fazer a capa padrão (músicas sem capa) seguir as cores do tema.
7. No fim, refazer os prints da loja e do README com a interface e o ícone novos.

## Não metas (nesta rodada)

- Widgets de tela inicial e Android Auto, que ficam numa rodada nativa depois.
- Loja de cosméticos, compras e forma de pagamento.
- Editor de etiquetas gravando no arquivo do Android.
- Qualquer acesso à internet.

## Antimetas (o que seria um fracasso mesmo funcionando)

- Pôr qualquer função atrás de pagamento. **Efeito 3D, reverb, amplificador e modo carro são grátis.** Isso contraria o ROADMAP, que listava "efeito de som 3D" no pacote pago, e o ROADMAP deve ser atualizado.
- Anúncio, item de propaganda no menu ou pedido de avaliação no meio da música.
- Pedir permissão nova que não seja de áudio.
- Quem já usa o app perder ajustes, playlists, estatísticas ou a sessão ao atualizar.
- A barra de baixo ou o Tocando agora deixarem de caber num celular de 360 px de largura sem rolar.

## Restrições do projeto (já combinadas, valem para tudo)

- 100% offline; o CSP do `index.html` continua bloqueando conexões.
- HTML, CSS e JS puros, sem bibliotecas. O Android usa Capacitor 8 e é montado no GitHub Actions.
- O português é a chave do texto. Todo texto novo precisa da tradução no dicionário `EN` de `js/i18n.js`.
- A cada versão: subir `VERSAO` em `js/app.js` e `CACHE` em `sw.js`, e escrever no `CHANGELOG.md`.
- Cada versão é feita numa branch, gera o APK de teste (Actions › App Android › Run workflow), é testada no celular do Jo-ah e do testador "Pombo" e só depois entra na `main`.
- O site no GitHub Pages é a versão de PC. Entrar na `main` atualiza o PC e o APK juntos.
- Textos e comentários em português.

## Abordagens consideradas

- **Navegação.** Foram três opções, mostradas em modelos:
  - **A:** aba Início no lugar de Tocando.
  - **B:** gaveta de ferramentas dentro do Tocando agora.
  - **C:** Início com só 4 abas e as Playlists dentro da Biblioteca.
  - **Escolhida: A.** O mini player já leva ao Tocando, então a aba era redundante, e uma tela inicial resolve a "tela vazia ao abrir". A B escondia as ferramentas de quem chega. A C mudava demais o costume de quem já usa.
- **Ritmo de entrega.** As opções eram uma versão grande, três versões pequenas ou começar pelo som.
  - **Escolhida: três versões** (1.18 navegação, 1.19 som, 1.20 uso), com os prints por último. Cada uma é testável sozinha, e a navegação vem primeiro porque é onde as ferramentas vão morar.
- **Ajustes.** As opções eram manter tudo numa tela ou dividir em partes.
  - **Escolhido: dividir**, com o Jo-ah de acordo. Isso também prepara "Aparência" para ser o lugar da futura lojinha de cosméticos.

---

## 1.18: Navegação

### Barra de navegação

- A barra passa a ser **Início · Biblioteca · Playlists · Você · Ajustes**. Em `TELAS`, `tocando` sai da barra e entra `inicio`.
- **Tocando agora continua sendo uma tela** (`#v-tocando`, hash `#tocando`), só que fora da barra. Ela abre:
  - pelo mini player, como hoje;
  - ao tocar algo de uma lista, onde já existe `ir("tocando")`;
  - ao tocar na notificação de mídia do Android (só a partir da 1.20, veja "Decisões tomadas na revisão");
  - pelo cartão "Continuar" do Início.
- **O app abre no Início.** Hoje o padrão é `biblioteca`. Um hash explícito na URL continua valendo.
- **Botão voltar:** a raiz passa a ser o Início, então o voltar sem histórico leva ao Início, e no Início minimiza o app. As regras de "desfazer um passo" atuais continuam.
- **PC (barra lateral) e celular deitado (trilho lateral):** os mesmos 5 itens. O Tocando abre pelo mini player, igual ao celular.
- A tela Tocando continua escondendo o mini player, como hoje.

### Tela Início

O conteúdo, de cima para baixo:

1. **Saudação curta** com o nome do perfil, quando existir, e a contagem de músicas. Exemplo: "Boa noite, Jo". A hora do aparelho decide se é "Bom dia", "Boa tarde" ou "Boa noite".
2. **Continuar de onde parou:** um cartão grande com capa, título, artista, quanto falta e barra de progresso. Ele usa a sessão salva em `compasso.sessao`. Tocar no cartão retoma e abre o Tocando, e o botão ▶ retoma sem trocar de tela. Se não houver sessão, o cartão não aparece.
3. **Ferramentas:** uma grade de atalhos.
   - **Na 1.18:** Equalizador, Temporizador, Visual do mostrador, Época do som, Velocidade e Tela cheia (relógio).
   - **Depois:** a 1.19 acrescenta Volume + e Efeitos 3D; a 1.20 acrescenta Modo carro.
   - Cada atalho abre o que já existe: a folha do equalizador, a do temporizador e assim por diante. Para "Visual do mostrador" e "Época do som", uma folha com as mesmas opções em chips que hoje ficam em Ajustes.
   - A grade tem 3 colunas no celular em pé e mais colunas em telas largas.
   - Um atalho ligado (equalizador ativo, temporizador correndo) aparece marcado, como os botões do Tocando já fazem com `.act`.
4. **Tocadas há pouco:** uma fileira que rola na horizontal, com até 10 álbuns ou músicas. Os dados vêm das estatísticas e da playlist automática "Tocadas recentemente".
5. **Favoritas:** um atalho para a playlist Favoritas, quando houver favoritas.

**Biblioteca vazia** (primeiro uso): os blocos 2, 4 e 5 dão lugar a um cartão "Traga suas músicas", com os mesmos botões de importar da Biblioteca. A tela nunca fica vazia nem muda.

### Ajustes em quatro partes

Ajustes vira uma tela curta: título, o seletor de **Idioma** no topo (sempre à vista, para quem caiu no idioma errado) e **quatro portas**. Cada porta abre uma tela própria dentro da aba Ajustes, e o voltar retorna à lista de portas.

| Porta | O que entra (os cartões que hoje estão em `renderTemas`) |
|---|---|
| **Aparência** | Temas, Criar tema, Galeria, Ajuste rápido, Compartilhar tema, Efeitos visuais (modo leve, luz de fundo, batida, imagem de fundo) e Tocando agora (visual do mostrador, cores do LED, formato da capa, cores seguem a capa) |
| **Som** | Equalizador (botão), Época do som (com chiado), Crossfade, Velocidade e Nivelar volume. Na 1.19 entram aqui também o amplificador e os efeitos. |
| **Reprodução e biblioteca** | Suavizar ao pausar, Tela ligada, Botão Anterior, Temporizador (botão), músicas de exemplo, corações, músicas ocultas, procurar no aparelho, Pastas do aparelho, espaço usado, apagar importadas e atalhos de teclado (só no PC) |
| **Sobre** | Backup e restauração, Sobre, Apoiar o projeto (só fora do Android), Instalar como app, Ver as boas-vindas, privacidade e atualizações |

- O editor de tema (`renderEditor`) continua abrindo de dentro de Aparência.
- **Textos que apontam caminho** precisam acompanhar a mudança. Por exemplo, o aviso "Mude em Ajustes › Pastas do aparelho" passa a ser "Ajustes › Reprodução e biblioteca › Pastas do aparelho".
- O botão voltar do Android e a tecla Esc saem de uma porta antes de sair de Ajustes.

### Quatro refinamentos

1. **Botões da Biblioteca numa linha só.** Tocar, Aleatório, Selecionar e Ordenar ("Recentes") cabem numa linha a 360 px. Selecionar pode virar ícone com nome acessível. Hoje a linha quebra em duas e o "Recentes" fica desalinhado.
2. **"0 min" em vez de "menos de 1 min" nos quadrinhos do Você.** Nos quadrinhos, a frase quebra em 3 linhas. Fora dos quadrinhos, "menos de 1 min" pode continuar onde couber.
3. **Música sem artista na etiqueta:** a linha de baixo mostra o nome da pasta no lugar de "Artista desconhecido · …". É só exibição: o agrupamento em Artistas não muda.
4. **Botões do Tocando com nome.** Temporizador, Equalizador, Letra e Mais ganham um nome curto visível (rótulo pequeno sob ou ao lado do ícone), sem passar de 360 px e sem empurrar os controles para fora da tela. Hoje só a Fila tem texto.

### Ícone novo e capa padrão

**O ícone ganha um redesenho**, pedido pelo Jo-ah. Hoje ele é um mostrador: um anel de traços como um relógio, com um disco em degradê lilás→bronze e um furo no centro (`icons/`, `android-assets/`, `loja/icone-512.png`).

- **O que o redesenho precisa respeitar:**
  - Continua sendo o "símbolo do Orolon" e funciona em três tamanhos: ícone do app, capa de 40 px numa lista e capa grande no Tocando.
  - Tem uma versão "só traço" (a `MARCA` em `js/app.js`) que fica legível em branco por cima de qualquer cor.
  - Funciona como ícone adaptativo do Android (frente + fundo, com área segura) e como ícone `maskable` do PWA.
- **Antes de implementar:** a direção visual é decidida com o Jo-ah, com 2 ou 3 propostas lado a lado no navegador. Ela não é escolhida pelo construtor.
- **Arquivos que mudam juntos:**
  - `icons/icon-192.png`, `icons/icon-512.png` e `icons/maskable-512.png`;
  - `android-assets/` (ícone e splash);
  - `loja/icone-512.png`;
  - a `MARCA` do SVG em `js/app.js`.

**A capa padrão** é a que aparece em músicas sem capa, em álbuns sem informação e em MP3 baixados do YouTube sem arte. Ela é o símbolo por cima de um degradê e passa a **seguir o tema**:

- **Hoje:** o degradê vem de `coresDoNome` (um tom aleatório tirado do nome da música), então a biblioteca fica com cores que não combinam com o tema.
- **Novo:** o degradê sai das cores do tema em uso (destaque e cor secundária). Cada música ganha uma pequena variação de tom ou luz, para as capas não ficarem idênticas lado a lado. Ao trocar de tema ou mexer no ajuste rápido de cor, todas as capas padrão mudam junto, na hora.
- **Também seguem o tema:** a mesma regra vale para a capa de playlists sem músicas com capa e para artistas sem foto, que hoje usam a inicial sobre `coresDoNome`.
- **Não mudam:** músicas com capa de verdade continuam com a própria capa, e o corte das faixas pretas das miniaturas de vídeo (`cortarCapa`) continua igual.
- **Visuais do Tocando** que usam as cores da capa (luz de fundo, Aura, LED "cores da capa"): numa música com capa padrão, eles passam a usar as cores do tema.

### Responsividade (critério de aceite da 1.18)

- O app deve funcionar sem rolagem horizontal em 320, 360 e 412 px de largura, no celular deitado e no PC a partir de 1000 px.
- A troca de aba responde na hora (sem animação longa) e lembra a rolagem de cada tela, como já faz `rolagens`.
- Montar o Início não pode atrasar a abertura do app. Os dados que dependem do IndexedDB entram quando estiverem prontos, sem a tela pular de lugar.

---

## 1.19: Som

Tudo é grátis, feito com a Web Audio que o app já usa (o equalizador e o nivelar já montam filtros em `montarFiltros`).

- **Amplificador de volume:** de 100% até 200%, com **limitador** para não distorcer. Passos rápidos de 100, 125, 150, 175 e 200%. Fica em Som e na ferramenta "Volume +" do Início. Ao passar de 100%, aparece um aviso curto e único sobre o volume alto para os ouvidos.
- **Reverb:** Nenhum, Sala, Palco e Catedral.
- **Efeito 3D (ambiente):** um alargamento estéreo com intensidade ajustável.
- **Aprimorador:** botões ou faixas para Graves, Agudos e Intensidade. Fica dentro da folha do equalizador, abaixo das bandas, como no concorrente.
- Tudo isso entra no backup e é salvo em `cfg`.

## 1.20: Uso

- **Modo carro:** uma tela cheia com capa, título e botões enormes (anterior, tocar/pausar, próxima), mais aleatório e repetir. Mantém a tela ligada enquanto aberta. Sai pelo voltar ou por um botão "Sair" grande. Abre pela ferramenta do Início.
- **Retomar de onde parou:** ao abrir o app, a última música fica pronta na posição em que parou. Uma opção em Reprodução decide se ela já começa tocando. O padrão é **não** tocar sozinha.
- **Tocar ao conectar o fone** (só Android): uma opção em Reprodução, desligada por padrão. Precisa de código nativo no plugin e só funciona com o app aberto ou em segundo plano.
- **Tocar na notificação de mídia abre o Tocando agora** (código nativo, veio da 1.18).

## Prints da loja e do README (última etapa)

- Refazer as 8 capturas (1080×1920) e a imagem de destaque (1024×500) em `loja/pt/` e `loja/en/` com a interface nova. Elas mantêm as mesmas regras de hoje: músicas, artistas, capas e letra criados só para os prints, sem nada de terceiros.
- Trocar as imagens de `docs/` que o README mostra (hoje ainda do tempo do Compasso, com Cassete e o texto "Ouvindo no Compasso") por capturas atuais.
- Atualizar o ROADMAP: o efeito 3D sai do pacote pago; o pago é só cosmético.

---

## Decisões tomadas na revisão (para o Jo-ah conferir)

1. **Tocar ao conectar o fone funciona só com o app aberto ou tocando em segundo plano.** Usa `AudioManager.registerAudioDeviceCallback` no `MusicasPlugin`, sem permissão nova. Fazer funcionar com o app fechado exigiria `BLUETOOTH_CONNECT`, o que quebraria a antimeta das permissões.
2. **Abrir o Tocando ao tocar na notificação passa para a 1.20.** A notificação vem do plugin `@capgo/capacitor-media-session` e não avisa o JS. Detectar o toque exige código nativo, e a 1.18 continua só web (sem código nativo). Até lá, tocar na notificação abre o app normalmente.
3. **O ícone novo não segura a 1.18.** A navegação, os Ajustes, os refinamentos e a capa padrão que segue o tema saem primeiro, usando a `MARCA` atual. O ícone sai numa **1.18.1**, depois que o Jo-ah escolher a proposta, e sempre antes dos prints.
4. **A capa padrão é calculada na hora de desenhar.** Para músicas sem capa, as cores do tema são usadas na exibição e nos visuais (luz de fundo, Aura, LED). O `x.c` salvo no IndexedDB não é reescrito, então não há migração nem risco de perder dados.
5. **"Retomar de onde parou" só acrescenta a opção "já começar tocando".** `restaurarSessao()` já carrega a fila na posição salva. Com a opção ligada, o Android começa a tocar ao abrir. No PC, o navegador bloqueia o som sem um toque, então ali a música só fica pronta, com o cartão "Continuar" do Início em destaque.

## Decisões que ficam com quem construir

- Ícones novos (Início e as ferramentas), seguindo o traço dos ícones de `ICONES`.
- Animação de entrada das telas (curta ou nenhuma) e a forma exata da grade de ferramentas.
- Se as portas de Ajustes viram estado interno de `renderTemas` (como `editando`) ou subtelas com hash próprio. Em qualquer caso, o voltar tem que funcionar.
- Os valores exatos do limitador, do reverb e do 3D, desde que não distorçam com o amplificador a 200%.
- A ordem dos atalhos na grade de ferramentas.
