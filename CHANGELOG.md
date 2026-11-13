# Histórico de versões

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
