# Guéranger

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
Versão: **0.0.2-alpha**

Busca unificada de manuscritos digitalizados de canto gregoriano em múltiplas
fontes acadêmicas. Distribuído como **app desktop** (Electron) e como
**servidor MCP** que pode ser consumido por Claude Desktop / Claude Code.

> ⚠️ **Alpha.** O software é funcional mas ainda em iteração rápida — espere
> mudanças quebrantes e comportamentos inesperados. Bugs e sugestões: abra
> uma issue.

## O que faz

Dado um *incipit* em latim (ex: `Resurrexi et adhuc`) ou uma melodia em
notação [GABC](https://gregorio-project.github.io/gabc/), o Guéranger
consulta em paralelo:

- **Cantus Index** + **Cantus Database** (cantusindex.org, cantusdatabase.org)
- **DIAMM** — Digital Image Archive of Medieval Music (diamm.ac.uk)
- **MMMO** — Medieval Music Manuscripts Online (musmed.eu)
- **Biblissima** — agregador IIIF europeu (iiif.biblissima.fr)
- Fontes hispânicas

Normaliza os resultados heterogêneos em uma tabela única (siglum, biblioteca,
século, fólio, link IIIF, URL da fonte, etc.) e exporta para **Excel
(.xlsx)** localmente — sem upload para serviço externo nenhum.

## Instalação

### App desktop

Baixe o instalador da plataforma em [Releases](../../releases) (quando
disponível) ou rode direto do fonte:

```bash
git clone https://github.com/htbg/gueranger.git
cd gueranger
npm install
npm run dev:desktop
```

### Servidor MCP

Para usar com Claude Desktop / Claude Code, aponte seu `mcp.json` para
`packages/mcp/build/server.js` após `npm run build:mcp`. Exemplo:

```json
{
  "mcpServers": {
    "gueranger": {
      "command": "node",
      "args": ["/caminho/para/gueranger/packages/mcp/build/server.js"]
    }
  }
}
```

Algumas fontes (DIAMM) requerem credenciais de conta gratuita. Configure-as
via o botão **Credenciais DIAMM** no app desktop — elas ficam armazenadas no
keyring do sistema operacional, nunca em arquivo de texto.

## Stack

- TypeScript 5.5+, Node 22 LTS
- `@modelcontextprotocol/sdk` 1.x
- Electron 41 + React 19 + Tailwind 4 (app desktop)
- Zod 4 (validação e normalização)
- exceljs (geração de .xlsx local)

Monorepo em 3 workspaces:

- `packages/core` — adapters por fonte, orquestrador, normalização
- `packages/mcp` — servidor MCP stdio
- `packages/desktop` — app Electron

## Desenvolvimento

```bash
npm install
npm test              # roda testes de todos os pacotes
npm run build         # build core + mcp
npm run dev:desktop   # dev do app Electron
npm run inspect       # abre MCP inspector para debugar o servidor
```

## Aviso Legal / Disclaimer

Este software é distribuído **NO ESTADO EM QUE SE ENCONTRA** (“AS IS”), sem
garantia de qualquer tipo, expressa ou implícita. Em nenhuma hipótese o
autor será responsável por qualquer dano decorrente do uso deste software —
incluindo perda de dados, corrupção de arquivos, travamentos ou qualquer
outro defeito.

O Guéranger **não** é afiliado a nenhuma das bases de dados consultadas.
Cada fonte permanece propriedade de sua instituição e é regida pelos seus
próprios termos de uso. Use com moderação — os rate limits padrão foram
escolhidos para respeitar a infraestrutura acadêmica dessas bases.

Cláusulas legais completas: seções 15 e 16 do arquivo [LICENSE](LICENSE).

## Licença

[GNU General Public License v3.0 ou posterior](LICENSE).

Copyright © 2026 Gabriel HTB.
