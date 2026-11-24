# Protótipo (fontes de referência)

Fontes das telas do [canvas de design](https://claude.ai/artifact/V3VPeHjuP5wMYxbJmTmMYH), copiadas para o
repositório para servir de **referência de implementação**. Não rodam sozinhos: dependem do runtime do editor
de design (`support.js`, tags `<x-dc>`, `<sc-for>`, `<sc-if>`, holes `{{ }}` e a classe `DCLogic`).

| Arquivo | Tela | Rota no app |
|---|---|---|
| `Main.dc.html` | Dashboard | `/` |
| `Timer.dc.html` | Sessão em andamento | `/sessao` |
| `Avaliar.dc.html` | Fim da sessão | `/sessao/fim` |
| `Recompensa.dc.html` | Recompensa | `/sessao/recompensa` |

## Como traduzir para o app

| Protótipo | Next.js / React |
|---|---|
| `<helmet><style>` (keyframes, classes `.seg`, `.press`...) | `src/app/globals.css` (camada `@layer components`) ou utilitários Tailwind |
| `style="..."` inline | Classes Tailwind com os tokens de [11-design](../../11-design.md) |
| `{{ valor }}` | `{valor}` em JSX |
| `<sc-for list="{{x}}" as="i">` | `x.map((i) => ...)` |
| `<sc-if value="{{c}}">` | `{c && ...}` |
| `onClick="{{fn}}"` | `onClick={fn}` |
| `class Component extends DCLogic` + `renderVals()` | Componente cliente (`'use client'`) com `useState` / hooks |
| `setTimeout` em sequência (`play()` da Recompensa) | Hook `useRewardSequence` |
| `<a href="Timer.dc.html">` | `<Link href="/sessao">` |

Os números nos fontes são **dados de exemplo**; no app tudo vem da API ([04-api](../../04-api.md)).
Os controles de demonstração (botão ×60 do timer e REPLAY da recompensa) não entram no app, exceto em modo de desenvolvimento.
