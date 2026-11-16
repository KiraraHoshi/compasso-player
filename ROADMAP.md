# Planos do Orolon Player

Ideias para as próximas versões. O núcleo continua grátis, offline e sem anúncios.

## Feito na versão web

Toda a lista da versão web está pronta. Os próximos passos são a versão Android e o pacote pago.

- ✅ **Playlists automáticas:** Favoritas, Adicionadas recentemente, Tocadas recentemente e Mais tocadas (1.1.0).
- ✅ **Estatísticas locais:** tempo de escuta, reproduções, últimos 7 dias, mais ouvidas e artistas (1.1.0).
- ✅ **Perfil sem conta:** nome, foto e Recap do ano, tudo só no aparelho (1.1.0).
- ✅ **Equalizador:** 5 bandas e 10 predefinições (1.1.0).
- ✅ **Temporizador de sono:** 15, 30, 45 ou 60 minutos, tempo livre ou "ao fim desta música" (1.1.0).
- ✅ **Fade, tela ligada e botão Anterior configurável** (1.1.0).
- ✅ **Letras:** lidas das tags ou de arquivos .lrc, sincronizadas no estilo karaokê, com edição (1.2.0).
- ✅ **Organização:** aba Pastas, músicas ocultas e editor de informações (1.2.0).
- ✅ **Imagem de fundo** escolhida pelo usuário, com desfoque (1.2.0).
- ✅ **Esconder as músicas de exemplo** pela Biblioteca, e sozinho na primeira importação (1.2.0).

- ✅ **Recap em imagem** para compartilhar (1.3.0).
- ✅ **Backup e restauração** de playlists, favoritas, estatísticas, letras, perfil, temas e ajustes (1.3.0).
- ✅ **Equalizador de 10 bandas** e 15 predefinições (1.3.0).

- ✅ **Épocas do som e visuais do mostrador** (1.4.0). Por enquanto grátis, em teste.
- ✅ **Troca sem pausa, crossfade, velocidade e nivelar volume** (1.4.0).
- ✅ **Tela cheia** com relógio (1.4.0).
- ✅ **Boas-vindas, busca geral, seleção múltipla, galeria de temas e cartão Sobre** (1.5.0).

- ✅ **Volume próprio, modo leve e tradução para inglês** (1.6.0).

## Ideias do concorrente (segunda revisão)

Tiradas de uma revisão detalhada do "Reprodutor de Música Offline" (50 mi+ downloads, nota 4,8).

**Fáceis, na versão web** (feitas na 1.7.0)
- Voltar e avançar 10 segundos, velocidade no Tocando agora, etiqueta FLAC/WAV, importar vídeos, lembrar a posição das músicas longas, aviso com atalho para as novas, prévia da letra e opção de esconder os corações.

**Médias, na versão web**
- Amplificador de volume (acima de 100%, com limitador para não distorcer).
- Reverb (sala, palco, catedral) e um "aprimorador" com graves, agudos e intensidade em botões giratórios.
- Abas Música e Letra no topo do Tocando agora, deslizando entre elas.
- Modo condução: tela com botões enormes e só o essencial.
- Aba Início opcional, com tocadas recentemente e favoritas.

**Só no Android**
- Procurar as músicas das pastas do aparelho sozinho, com progresso e escolha de pastas.
- Widgets de vários tamanhos.
- Tocar ao conectar os fones e tocar junto com outros apps.
- Lembrete de audição no horário de costume.

**O que não copiar** (além dos anúncios)
- Pedir avaliação na loja no meio de uma música.
- "Mais aplicativos (AD)" e itens de propaganda no menu.
- Esconder predefinições básicas do equalizador atrás do pago.

## Em andamento (16/11/2026)

- ✅ **1.18.0:** aba Início, Ajustes em quatro partes, capa padrão nas cores do tema e testes automáticos.
- ✅ **1.18.1:** ícone novo "O tocando" (gerado de `icons/orolon.svg` com `node scripts/gerar-icones.mjs`).
- **1.19 Som:** amplificador até 200% com limitador, reverb, efeito 3D e aprimorador (graves, agudos e intensidade).
- **1.20 Uso:** modo carro, "já começar tocando" ao abrir, tocar ao conectar o fone e notificação abrindo o Tocando.
- Depois: prints novos da loja e do README.

## Sugestões para versões futuras (anotadas em 16/11/2026)

**Efeitos de som** (todos grátis, com a Web Audio que o app já usa)
- **Predefinições de efeito com um toque:** "Slowed + reverb" (0,85× com reverb de sala), "Nightcore" (1,25× com o tom junto), "Noite" (compressor que segura os picos para ouvir baixo) e "Vocal à frente".
- **Áudio 8D:** o som gira em volta da cabeça, com velocidade ajustável. É popular entre quem ouve de fone.
- **Modo karaokê:** tira a voz do centro (cancelamento de fase). Combina com as letras sincronizadas que o app já tem.
- **Mudar o tom sem mudar a velocidade** (meio tom acima ou abaixo), para cantar junto.
- **Crossfeed para fone:** mistura um pouco dos lados, para cansar menos em músicas antigas com estéreo muito separado.
- **Balanço esquerda/direita e áudio mono:** são recursos de acessibilidade, para quem ouve melhor de um lado ou usa um fone só.
- **Equalizador por música ou por gênero:** lembra o ajuste de cada música ou escolhe pela etiqueta de gênero.
- **Pular silêncio** no começo e no fim das faixas (comum em MP3 do YouTube e em podcasts).

**O que quase todo player grátis tem e ainda falta no Orolon**
- **Pausar ao tirar o fone** (fio ou Bluetooth). Precisa conferir no Android: se a WebView não faz isso sozinha, é a primeira da lista, porque o som sair alto no viva-voz é a reclamação mais comum.
- **Importar e exportar playlists .m3u.** É o formato que os outros players usam, então ajuda quem está trocando de app.
- **Repetir um trecho (A-B)**, bom para estudar música ou idioma.
- **Mais ordens na Biblioteca:** álbum, duração, mais tocadas, data do arquivo e número da faixa.
- **Favoritar ou avaliar com estrelas**, com playlists automáticas "5 estrelas".
- **Marcadores e retomar por arquivo** em áudios longos (audiolivros e podcasts). Hoje só as músicas longas lembram a posição.
- **Widgets e Android Auto** (já no plano da versão Android).
- **Compartilhar o arquivo da música** pelo menu do Android.
- **Achar músicas repetidas** na biblioteca.

## Versão Android

- Encontrar as músicas do aparelho sozinho, sem importar.
- Reprodução em segundo plano sem cortes.
- Widgets na tela inicial, modo condução e Android Auto.

## Pacote pago: visuais do mostrador (ideia)

Os visuais de hoje (Relógio, Vinil, Aura, Espectro, Anel, Neon, Barras e LED) continuam grátis. Os modelos novos podem entrar num pacote pago, com compra única e offline. Exemplos: galáxia de partículas, túnel, anel duplo, chuva de luz e visuais por época.

## Pacote pago: épocas (compra única)

Cada época muda o visual e o som juntos. Tudo funciona offline, com o processamento de áudio do próprio aparelho.

| Época | Visual | Som |
|---|---|---|
| Anos 60 | Rádio valvulado | Mono, abafado, leve saturação |
| Anos 70 | Vinil girando no lugar do mostrador | Chiado e estalos de agulha, graves quentes |
| Anos 80 | Fita cassete com os carretéis girando | Oscilação leve de velocidade, agudos cortados |
| Anos 90 | CD player e visualizador de barras | Som limpo com realce de graves |

Também podem entrar no pacote: temas premium e estilos extras de widget. **Regra (16/11/2026): o pago é só visual.** Funções como efeito 3D, reverb, amplificador e modo carro são grátis (veja `docs/superpowers/specs/2026-11-16-orolon-navegacao-e-ferramentas-design.md`).

Observação: vender pela Google Play numa conta pessoal deixa o endereço do desenvolvedor público. Liberar o pacote para quem apoia pelo GitHub Sponsors evita isso.

## O que não fazer

- Anúncios.
- Pedir acesso a fotos e vídeos sem necessidade.
- Esconder recursos básicos (como predefinições do equalizador) atrás do pago.
