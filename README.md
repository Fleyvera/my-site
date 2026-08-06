# my-site

Site pessoal de Felipe Martelo. O site tradicional é a entrada principal enquanto o portfolio interativo (Godot Web) fica em desenvolvimento.

## Estrutura

```
/
├── index.html      # Roteador: raiz → /site/ (jogo via /?game=1 ou /game/)
├── site/           # Site tradicional (HTML estático)
├── game/           # Export HTML5 do Godot
└── assets/         # CSS, imagens e ícones compartilhados
```

## Comportamento

| Visitante | Destino |
|---|---|
| Raiz `/` | `/site/` |
| `/?game=1` | `/game/` (forçar jogo) |
| `/game/` | jogo direto |
| `/site/` | site direto |

## Publicar o jogo

1. Exporte o Godot para Web (preset **Web → my-site** no projeto `portfolio-game`)
2. Copie os arquivos gerados para `game/`, **preservando** `game.css` e `game.js`
3. Commit + push → Netlify redeploya

Quando o jogo estiver pronto para ser a entrada, basta voltar o roteador em `index.html` a apontar para `/game/`.

Detalhes completos em `portfolio-game/deploy/README.md`.

## Deploy

Hospedado no [Netlify](https://www.netlify.com/) a partir deste repositório (`publish = "."`).
