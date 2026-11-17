# Material da Google Play

- `icone-512.png`: ícone da loja (512×512).
- `pt/` e `en/`: imagem de destaque (1024×500) e 8 capturas de tela (1080×1920), em português e em inglês.

As capturas, na ordem: Aura, Biblioteca, Relógio, Personalizar, LED, Letra, Efeitos de som e Início (tema claro).

## Como refazer

`node scripts/prints-loja.mjs` gera tudo de novo a partir do app de verdade (Chrome sem janela, nada é instalado).
Para refazer só uma parte: `node scripts/prints-loja.mjs pt 3 5` (idioma e números das capturas).
Os textos de cada imagem ficam no começo do script.

As músicas, os artistas, as capas e a letra que aparecem nas imagens são criados pelo próprio script, só para estes prints. Nenhum deles é de terceiros.
