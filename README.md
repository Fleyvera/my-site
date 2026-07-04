# my-site

Site pessoal de Felipe Martelo, com portfolio interativo (Godot Web) como entrada principal.

## Estrutura

```
/
├── index.html      # Roteador: desktop → /game/, mobile → /site/
├── site/           # Site tradicional (HTML estático)
├── game/           # Export HTML5 do Godot (placeholder até publicar)
└── assets/         # CSS, imagens e ícones compartilhados
```

## Comportamento

| Visitante | Destino |
|---|---|
| Desktop (primeira visita) | `/game/` |
| Celular / touch | `/site/` |
| Escolheu "site tradicional" | `/site/` (salvo no `localStorage`) |
| Link com `?game=1` | `/game/` |
| Link com `?site=1` | `/site/` |

## Publicar o jogo

1. Exporte o Godot para Web (preset **Web → my-site** no projeto `portfolio-game`)
2. Copie os arquivos gerados para `game/`, **preservando** `game.css` e `game.js`
3. Commit + push → Netlify redeploya

Detalhes completos em `portfolio-game/deploy/README.md`.

## Deploy

Hospedado no [Netlify](https://www.netlify.com/) a partir deste repositório (`publish = "."`).
