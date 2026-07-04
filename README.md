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
| Desktop (raiz `/`) | `/game/` |
| Celular / touch (raiz `/`) | `/site/` |
| `/?site=1` | `/site/` |
| `/?game=1` | `/game/` (forçar jogo, ex. teste no celular) |

## Publicar o jogo

1. Exporte o Godot para Web (preset **Web → my-site** no projeto `portfolio-game`)
2. Copie os arquivos gerados para `game/`, **preservando** `game.css` e `game.js`
3. Commit + push → Netlify redeploya

Detalhes completos em `portfolio-game/deploy/README.md`.

## Deploy

Hospedado no [Netlify](https://www.netlify.com/) a partir deste repositório (`publish = "."`).
