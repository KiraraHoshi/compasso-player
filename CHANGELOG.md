# Histórico de versões

## 1.25.1
- **Correção:** ao sair do LED para outro mostrador pelo pincel, a capa ficava esticada (o quadrado virava retângulo e o redondo virava oval) até sair e voltar ao Tocando agora.
- **Relógio:** o ponteiro grande agora só avança nos graves bem definidos, com um tranco mais forte.
- No pincel, o "Formato da capa" só aparece nos mostradores em que ele vale (Aura, Espectro e Anel). No Relógio e no Vinil a capa é sempre redonda.
- **Menos bateria e menos calor:** fora do Tocando agora o app deixou de analisar o som (só os mostradores precisam disso), e com o app escondido a parte do som que alimenta os desenhos é desligada. O som em si não muda.
- **Fluidez máxima (90/120 Hz):** opção nova em Ajustes › Aparência, desligada de fábrica. Usa a taxa inteira da tela nas animações; fica mais liso, mas gasta mais bateria e pode esquentar o aparelho.

## 1.25.0
- **Relógio com ponteiros:** um ponteiro âmbar mostra quanto da música já passou e um ponteiro fino anda um tracinho a cada batida, com o tranco de relógio. O bumbo agora corre pelos tracinhos, de cima para baixo, e cada tracinho deixa um pontinho de pico. No Relógio a capa passa a ser sempre redonda (os ponteiros não combinam com a capa quadrada).
- **Espectro:** ganhou brilho, o rastro da forma de um instante atrás, a linha que clareia na caixa e as ondas do bumbo saindo da capa.
- **Anel:** gira devagar e ganha impulso no bumbo, com brilho e um pontinho de pico em cada barrinha.
- **Neon:** brilho de verdade, o bumbo corre do meio para as pontas e as duas cores se separam um instante na caixa.
- **Barras:** sobem rápido e descem devagar, com brilho e uma tampinha de pico em cada ponta.
- **Cores:** em todos esses mostradores as cores passam devagar de uma música para a outra.
- **Celular mais frio:** o app não desenha mais que cerca de 60 vezes por segundo, mesmo em tela de 90 ou 120 Hz; com a música pausada, desenha bem menos; e o brilho, que é a parte mais pesada, passou a custar a metade.
- No modo leve e com "reduzir movimento" não há brilho nem ponteiro da batida.

## 1.24.0
- **Aura refinada:** brilho macio em volta da capa, poeira com profundidade que cintila no prato, uma onda que sai da capa em cada bumbo e freia, e um fio de luz que clareia na caixa.
- **Troca de música na Aura:** a Aura recolhe e abre de novo, as cores passam devagar de uma música para a outra e a capa nova entra pelo lado (voltando, entra pelo outro lado).
- Se o aparelho não der conta, o brilho desliga sozinho. No modo leve e com "reduzir movimento" a Aura fica sem brilho e sem animação na troca.

## 1.23.0
- **A capa sente a batida de verdade.** O app passou a ouvir o bumbo, a caixa e o prato separados, e só conta o que é golpe de bateria: nota de baixo e voz não fazem mais a capa pular. Em música com letra, a capa pulsa no ritmo em vez de tremer o tempo todo.
- **Andamento:** o app percebe o andamento da música. Com ritmo firme, a capa pulsa no tempo forte; com ritmo quebrado, segue cada bumbo.
- **Capa com peso:** leva um soco no bumbo e volta como mola, e respira pouco entre as batidas. Dois golpes colados não fazem a capa tremer.
- **Desenho junto com o som:** os visuais esperam o tempo que o som leva para sair do aparelho (maior em fone sem fio), quando o aparelho informa esse tempo. O som em si não ganha atraso.
- O modo leve, a opção "Reagir à batida" e a força da batida continuam valendo como antes.

## 1.22.0
- **Estrelas:** dê de 1 a 5 estrelas a cada música, no topo do menu "⋯" (o botão Mais do Tocando agora abre o mesmo menu). Tocar na mesma nota de novo tira a nota. O coração das favoritas continua igual.
- As notas viram duas playlists automáticas, **5 estrelas** e **4 ou mais**, que aparecem quando têm músicas, e uma ordem nova na Biblioteca.
- **Aleatório mais esperto:** todas as músicas da fila continuam tocando uma vez, mas as bem avaliadas têm mais chance de vir antes. Sem nenhuma nota, o aleatório é igual ao de sempre.
- **Mais ordens na Biblioteca:** Álbum, Número da faixa, Duração, Mais tocadas, Data do arquivo e Nota.
- **Playlists .m3u:** importe uma playlist feita em outro player (Playlists › Importar .m3u) e exporte as suas (menu da playlist › Exportar .m3u). As músicas são reconhecidas pelo nome do arquivo; as que não estão na biblioteca são contadas no aviso.
- **Repetir trecho (A-B):** no menu da música que está tocando, marque o início e o fim, e o trecho fica repetindo. Bom para estudar um instrumento ou um idioma.
- **Marcadores:** guarde pontos de uma música ou de um áudio longo e volte a eles com um toque.
- As notas e os marcadores ficam só no aparelho e entram no backup. Nada é gravado dentro dos arquivos de música.
- No Android, exportar uma playlist usa o compartilhamento do aparelho.

## 1.21.0
- **Pincel no Tocando agora:** no canto de cima à esquerda, abre a folha **Personalizar**. Nela você troca o visual do mostrador por miniaturas, o formato da capa, as cores, a luz de fundo e a batida. A folha é baixa, então cada mudança aparece no mostrador na hora.
- **Capa personalizada:** escolha uma imagem para uma música (menu "⋯" › Trocar capa) ou para um álbum inteiro (botão Trocar capa na tela do álbum), com o mesmo recorte da foto do perfil. A capa do álbum vale para as músicas dele que não têm capa própria. Os arquivos das músicas não são alterados, e dá para tirar a capa depois.
- **Enviar backup:** manda o arquivo de backup pelo compartilhamento do aparelho (Drive, WhatsApp, e-mail). Quem envia é o app que você escolher; o Orolon continua sem usar a internet.
- **Backup automático** (Android): escolha uma pasta e o Orolon guarda nela uma cópia por dia, mantendo as 5 mais novas de cada aparelho. No celular novo, escolha a mesma pasta: o app mostra os backups que já estão lá e pergunta qual restaurar, sem gravar nem apagar nada antes. Não precisa de conta nem de permissão nova.
- Ajustes › Sobre mostra quando foi o último backup. Quem tem músicas importadas e está há mais de 30 dias sem backup recebe um lembrete discreto.
- O backup agora leva as capas personalizadas, em tamanho reduzido.

## 1.20.0
- **Modo carro:** uma tela cheia com a capa, o nome da música e botões enormes (anterior, tocar/pausar e próxima), mais aleatório e repetir. Mantém a tela ligada e funciona em pé e deitado. Abre pela ferramenta nova do Início e fecha pelo voltar ou pelo botão Sair.
- **Já começar tocando** (Android): opção em Ajustes › Reprodução para o app abrir tocando de onde parou. Vem desligada.
- **Pausar ao tirar o fone** (Android): ao desconectar o fone, com fio ou Bluetooth, a música pausa na hora. Vem ligada e pode ser desligada em Ajustes › Reprodução.
- **Tocar ao conectar o fone** (Android): opção desligada por padrão. Funciona com o Orolon aberto ou em segundo plano, sem pedir permissão nova.
- **Tocar na notificação de mídia abre o Tocando agora** (Android).
- As ferramentas do Início ficam em três colunas no celular, com os nomes inteiros.
- O backup leva as opções novas.

## 1.19.0
- **Volume +:** o volume passa de 100% e vai até 200%, para músicas gravadas baixo. Um limitador segura os picos para o som não estourar. Na primeira vez, o app avisa para usar com moderação.
- **Reverb:** Sala, Palco e Catedral, para dar a sensação de ouvir num lugar maior.
- **Efeito 3D:** abre o som para os lados, de 0 a 100%. Fica melhor com fone. Músicas em mono continuam iguais.
- **Aprimorador** no equalizador: Graves, Agudos e Intensidade (deixa o som mais encorpado), com um botão para zerar.
- Tudo grátis, no cartão **Efeitos** de Ajustes › Som e em duas ferramentas novas do Início: **Volume +** e **Efeitos 3D**. As ferramentas agora ficam em duas linhas de quatro.
- Trocar de efeito com a música tocando não dá estalo, e os visuais continuam reagindo igual com o volume alto.
- **Ícone maior:** o símbolo ocupa mais espaço no ícone do app.
- O backup leva os efeitos novos. Backups de versões anteriores continuam restaurando normalmente.

## 1.18.1
- **Ícone novo:** um O que também é uma barra de progresso, com a cabeça de leitura na ponta e um equalizador no centro. Vale no ícone do app, na tela de abertura, no app instalado pelo navegador e na loja.
- As músicas sem capa usam o mesmo símbolo, em branco, sobre as cores do tema.

## 1.18.0
- **Nova aba Início**, que é onde o app abre: saudação, **Continuar de onde parou** (com quanto falta e um botão para tocar), **Ferramentas** a um toque (Equalizador, Temporizador, Visual, Época do som, Velocidade e Tela cheia), **Tocadas há pouco** e atalho para as Favoritas. Com a biblioteca vazia, mostra um convite para trazer as músicas.
- O **Tocando agora** saiu da barra de baixo: abre pelo mini player, pelo Continuar do Início ou ao tocar uma lista. A barra fica Início · Biblioteca · Playlists · Você · Ajustes.
- **Ajustes em quatro partes:** Aparência, Som, Reprodução e biblioteca e Sobre. O idioma fica sempre no topo. O voltar sai de uma parte antes de sair de Ajustes.
- **Músicas sem capa seguem as cores do tema**, com uma variação leve para cada música. Trocar de tema ou de cor muda todas na hora, e a luz de fundo e os visuais acompanham. Músicas com capa continuam com a própria capa.
- Acabamentos:
  - Os botões da Biblioteca cabem numa linha só.
  - Os quadrinhos do Você mostram "0 min" em vez de quebrar a linha.
  - Músicas sem artista na etiqueta mostram o nome da pasta.
  - Os botões do Tocando agora ganharam nomes curtos (Fila, Timer, EQ, Letra, Mais, Volume).
- Por dentro: testes automáticos que abrem o app num Chrome sem janela, em tamanhos de celular e PC (`node testes/rodar.mjs`).

## 1.17.3
- Músicas sem capa mostram o símbolo do Orolon (o mostrador do ícone) sobre o degradê de cores de cada música, em vez da primeira letra do título. Vale nas listas, álbuns, artistas, mini player e no centro do Relógio e do Vinil.

## 1.17.2
- PC e tablet: o Tocando agora segue a mesma ordem do celular (nome, botões com o volume na ponta, barra de volume, progresso e controles), igual no app Android.

## 1.17.1
- Capas: cada música usa a arte gravada no próprio arquivo. Antes, músicas sem álbum na mesma pasta (como MP3 baixados do YouTube) ficavam todas com a capa da primeira. As que entraram assim são corrigidas sozinhas ao abrir o app.
- O nome da pasta (por exemplo "Download") não aparece mais como se fosse o álbum.
- Importar › **Escolher uma pasta**: use uma pasta específica do aparelho. O Orolon lembra a pasta e procura músicas novas nela ao abrir. O Android decide quais pastas podem ser escolhidas. Gerencie em Ajustes › Pastas escolhidas.

## 1.17.0
- App Android: **Procurar músicas no aparelho**. O Orolon encontra sozinho as músicas que o Android já conhece (pasta Música, Downloads e outras), como os outros players. Nada é copiado: ele toca direto do arquivo e não ocupa espaço extra.
  - Ao abrir o app, entram as músicas novas e saem as que foram apagadas do aparelho.
  - Pastas de áudios de conversa e gravações (WhatsApp, Telegram, gravador) começam desligadas. Mude em Ajustes › Pastas do aparelho.
  - Remover uma música do Orolon não apaga o arquivo, e ela não volta na próxima busca.
  - "Escolher arquivos" continua funcionando e copia as músicas para dentro do app, como antes.
- O botão voltar refaz o caminho: volta para a tela em que você estava antes (e na mesma posição da lista), não sempre para a Biblioteca.
- Tocando agora no estilo do YouTube Music: capa ou visual em cima, nome e botões no meio, progresso e controles embaixo, perto do polegar. Os botões ficam à esquerda.
- O volume virou um botão no fim da fileira: um toque mostra ou esconde a barra de volume (ela fica como você deixou), e segurar cerca de 1 segundo deixa mudo ou devolve o som.
- O visual LED ocupa a largura da tela no celular e usa a altura livre: ganha fileiras para as barras subirem mais com blocos quadrados, logo acima do nome da música. Com o volume recolhido, a fileira de opções desce e o LED cresce.
- Em telas bem estreitas, a fileira de botões cabe numa linha só.
- Ajustes › Sobre (Android): botão para ver se há versão nova no GitHub. O app continua sem usar a internet; o botão só abre a página no navegador. Instalar o APK novo por cima mantém músicas, playlists e ajustes.

## 1.16.1
- Corrigido o zoom de pinça, que dava zoom na tela inteira e deixava o app cortado e travando. Agora o gesto de pinça é ignorado fora do recorte de foto, onde ele continua funcionando.

## 1.16.0
- App Android:
  - O botão voltar desfaz um passo de cada vez: fecha menus, sai da tela cheia e da letra, volta de álbuns e playlists e, por fim, volta para a Biblioteca. Na Biblioteca, ele só minimiza o app, e a música continua.
  - Se o Android fechar o app em segundo plano, ele volta na mesma música e no mesmo ponto.
  - Depois de uma interrupção, como uma ligação, o som volta sozinho.
  - Novo build da Google Play (.aab assinado), feito no GitHub quando você pedir.
- Política de privacidade em português e inglês, com link em Ajustes › Sobre.

## 1.15.5
- APK de teste: agora sempre assinado com a mesma chave, então cada versão nova instala por cima da anterior, sem desinstalar e sem perder nada.

## 1.15.3
- Tocando agora no celular em pé: tudo cabe na tela, sem rolar. O mostrador se ajusta ao espaço que sobra, e o volume e os botões de fila, temporizador, equalizador e letra ficam sempre visíveis.
- Os avisos com botão (como o de música importada) ficam numa faixa larga, em vez de uma bola estreita de várias linhas.

## 1.15.2
- App Android: corrigido o fechamento do app ao começar a tocar. O Android 14 e mais novos exigem uma permissão própria para a notificação de mídia, que faltava no app.

## 1.15.1
- App Android: corrigida a tela branca ao abrir. Uma chamada do plugin de controles de mídia derrubava o app inteiro. Agora toda chamada nativa é protegida, e no APK de teste um erro aparece na tela em vez de deixar tudo em branco.

## 1.15.0
- App Android:
  - Controles na notificação e na tela de bloqueio, com capa, tocar/pausar, anterior, próxima e a barra de posição. O som segue tocando com o app fechado.
  - O app respeita a barra de status e a barra de navegação do Android, sem conteúdo por baixo delas, e os ícones da barra mudam de cor junto com o tema.
  - Saíram os textos de navegador e de PC (instalar como app, atalhos de teclado, arrastar arquivos e escolher pasta) e o link de apoio.
  - Atualizado para o Capacitor 8.
- No site, a tela também respeita o notch e as barras do sistema quando o app é instalado.

## Android (em preparo)
- Projeto do app Android com Capacitor (pacote `com.joah.orolon`, desenvolvedor Jo-ah). O GitHub monta um APK de teste a cada atualização e publica na página de Releases como "Android (teste)".

## 1.14.1
- LED com a arte da capa: os blocos apagados não aparecem mais de fundo, nem com a música pausada. A arte só surge nos blocos que sobem.
- LED: degradê na diagonal, igual ao da Aura. No modo Cores da capa ele pinta o painel, e no modo Arte da capa ele se mistura à arte para combinar com o resto.

## 1.14.0
- LED com escolha de cores (Ajustes › Tocando agora, quando o LED está escolhido):
  - **Arte da capa** (padrão): a capa vira um mosaico nos blocos. Os apagados mostram a arte bem fraquinha, e os acesos brilham com a cor dela.
  - **Cores da capa**: degradê entre as duas cores principais da capa.
  - **Cores do tema**: degradê com as cores do tema do app.
  - **Clássico**: do azul ao vermelho.
- No LED, os agudos ganharam um pouco de força, para o lado direito não ficar sempre baixo.

## 1.13.1
- Os tracinhos do mostrador pulsam mais no ritmo: crescem até quase o dobro, reagem mais rápido, ganham um empurrão em cada batida e agora se mexem também no Vinil.

## 1.13.0
- Novo visual LED: equalizador clássico em blocos, que vai do azul ao vermelho conforme sobe, com o pico segurando um instante antes de cair e um reflexo embaixo.

## 1.12.0
- Novo visual Anel: barrinhas finas saem de um anel fino em volta da capa, com riscos voando que aceleram nas batidas, no estilo dos vídeos tipo Trap Nation. As Barras de antes continuam.
- Os visuais não batem mais num teto: nas músicas altas, os graves achatavam o topo (no Neon dava para ver bem). Agora a leitura tem mais folga e uma curva suave, e os picos vão até onde iriam de verdade.
- Saiu o visual Onda.

## 1.11.3
- Capa quadrada: a Aura e o Espectro seguem exatamente o canto arredondado da arte e começam rentes a ela. Some a bordinha sobrando e a "sombra" estranha nos cantos.

## 1.11.2
- Títulos longos no Tocando agora quebram em até duas linhas e terminam em "…". Antes, no PC, empurravam a coluna para fora da tela.

## 1.11.1
- Os visuais reagem igual em qualquer tela. Antes a suavização era contada por quadro, então um monitor de 144 Hz reagia bem mais rápido que um celular a 60 Hz (ou 30 Hz na economia de bateria). Agora tudo segue o tempo real, as frequências são lidas uma vez por quadro e o analisador responde mais rápido.
- O áudio usa um buffer de tamanho médio, que deixa o visual mais em sincronia com o som.
- Saíram os visuais Rádio e Cassete. A época dos anos 60 agora usa o Vinil, e a dos anos 80 usa o Neon.

## 1.11.0
- Layout adaptativo: o app acompanha o tamanho da tela aos poucos. No PC ele ocupa a janela toda, com barra lateral, conteúdo largo, mini player de ponta a ponta e o Tocando agora em duas colunas (capa à esquerda, controles à direita). Com o celular deitado, o Tocando agora também fica em duas colunas e a navegação vai para a lateral. Em pé, a capa cresce de acordo com a altura do celular.
- A tela cheia continua igual, em uma coluna com o relógio grande.

## 1.10.0
- Capa quadrada com cantos arredondados, para quem curte a arte do álbum. Agora é o padrão (Ajustes › Tocando agora › Formato da capa), e a Aura e o Espectro seguem o contorno quadrado. No Vinil a capa continua redonda.
- "Cores do visual seguem a capa da música" passa a vir ligado.

## 1.9.3
- "Cores do visual seguem a capa": agora usa as cores que mais aparecem na capa, num degradê entre as duas principais. Capa em preto e branco fica em prata (tema escuro) ou grafite (tema claro), e não volta mais para a cor do tema.

## 1.9.2
- Capas tiradas de vídeo (miniatura do YouTube com faixas pretas e laterais borradas) são recortadas sozinhas, ficando só a arte do álbum. As músicas que já estavam na biblioteca são acertadas uma vez.
- A Aura não corta mais como se batesse numa borda: ela desenha numa área maior que o mostrador, e os picos muito altos são amaciados.
- A Aura pinta a capa de leve com a cor do visual, um pouco mais nas batidas.

## 1.9.1
- A Aura ficou mais fluida, no estilo dos visualizadores tipo Trap Nation: reage na hora, a forma é suavizada como um líquido, duas camadas de eco acompanham com atraso e o conjunto gira devagar. O preenchimento não passa mais por cima da capa.

## 1.9.0
- A capa pulsa com os graves da música o tempo todo, e não só nas batidas fortes. A Aura e o Espectro se movem junto com ela.
- Nova opção "Cores do visual seguem a capa da música" (Ajustes › Tocando agora): os tracinhos, a Aura, o Espectro, o Neon e as barras pegam uma cor da capa, ajustada para combinar com o tema.

## 1.8.2
- Aura virou um visual próprio: uma forma macia envolve a capa, com poeira flutuando e uma onda discreta nas batidas, sem os tracinhos do relógio. O Relógio voltou a ficar limpo, sem o anel encostando nos tracinhos.

## 1.8.1
- O app agora se chama Orolon Player, da família Orologia. O endereço continua o mesmo, e as músicas, playlists e ajustes ficam onde estavam.

## 1.8.0
- Dois visuais novos no mostrador: Espectro (anel fino em volta da capa com picos para fora e poeira que acelera nas batidas) e Neon (onda espelhada com brilho, mais forte no centro).

## 1.7.1
- Aura: no Relógio e no Vinil, um anel suave em volta da capa respira com a música, e cada batida forte solta uma onda discreta. Segue a "Força da batida", desliga em Ajustes › Efeitos e fica de fora no modo leve.

## 1.7.0
- Trocar o idioma não para mais a música: o app muda na hora, sem recarregar.
- Som mais estável no celular: o áudio usa um buffer maior, o que evita engasgos.
- Botões de voltar e avançar 10 segundos e de velocidade direto no Tocando agora.
- Etiqueta FLAC, WAV ou AIFF nas músicas sem perda de qualidade.
- Vídeos MP4, WEBM e MOV podem ser importados, e o app toca só o áudio.
- Músicas de 10 minutos ou mais (audiolivros, podcasts, mixes) continuam de onde pararam, com a opção "Do início".
- Depois de importar, o aviso tem o botão "Ver", que abre as músicas adicionadas.
- "Procurar no arquivo de novo" mostra a letra antes, com "Aplicar" e "Descartar".
- Opção de esconder o coração das favoritas nas listas (Ajustes › Biblioteca).

## 1.6.1
- Letras: o app passou a achar letras guardadas de mais jeitos (campos "UNSYNCED LYRICS" e "SYNCEDLYRICS" no FLAC, FLAC com etiqueta ID3 no começo e letra sincronizada SYLT no MP3). As músicas já importadas são relidas uma vez, e a tela de letra ganhou o botão "Procurar no arquivo de novo".
- Foto do perfil: recorte com arrastar e zoom (controle, dois dedos ou roda do mouse).

## 1.6.0
- Controle de volume próprio no Tocando agora, com mudo e atalhos (↑, ↓ e M no PC).
- App mais leve: as animações deixaram de recalcular a página inteira a cada quadro. Num processador 4 vezes mais lento, o app foi de cerca de 25 para 60 quadros por segundo, e a rolagem ficou lisa.
- Modo leve em Ajustes › Efeitos, e o app sugere ligar quando percebe que está lento.
- Tradução para inglês. O idioma segue o do aparelho e pode ser trocado em Ajustes.

## 1.5.0
- Tela de boas-vindas na primeira abertura, com os três passos para começar.
- Busca geral: músicas, álbuns, artistas e playlists de uma vez.
- Seleção múltipla na Biblioteca: adicionar a uma playlist, mandar para a fila, ocultar ou remover várias músicas.
- Galeria de temas dentro do app (e na pasta `temas/` do repositório).
- Cartão Sobre, com o botão para instalar o app e para apoiar o projeto.

## 1.4.0
- Épocas do som: anos 60 (rádio valvulado), 70 (vinil), 80 (cassete) e 90 (CD).
- Visuais do mostrador: relógio, vinil, cassete, rádio, barras e onda.
- Troca de música sem pausa e crossfade de 2 a 8 segundos.
- Velocidade de reprodução e opção de nivelar o volume entre as músicas.
- Tela cheia: o mostrador vira um relógio que toca.

## 1.3.0
- Equalizador de 5 ou 10 bandas, com 15 predefinições.
- Backup e restauração de playlists, favoritas, estatísticas, letras, perfil, temas e ajustes.
- Recap do ano em imagem para compartilhar.

## 1.2.x
- Letras lidas das tags ou de arquivos .lrc, sincronizadas no estilo karaokê, com edição.
- Aba Pastas, editor de informações e músicas ocultas.
- Imagem de fundo com desfoque.
- As músicas de exemplo podem ser escondidas, e saem sozinhas na primeira importação.
- Coração de favorita no mini player e nas listas.
- O modo offline passou a atualizar sempre com arquivos novos.

## 1.1.0
- Favoritas e playlists automáticas.
- Estatísticas locais e aba Você, com perfil e Recap do ano.
- Equalizador, temporizador de sono, fade, tela ligada e botão Anterior configurável.

## 1.0.0
- Biblioteca com músicas, álbuns e artistas; importação de arquivos e pastas.
- Leitura de tags e capas de MP3, FLAC, M4A, OGG e Opus.
- Mostrador de relógio que reage à música e luz de fundo com as cores da capa.
- Fila, playlists, temas com editor e JSON, modo offline e instalação como app.
