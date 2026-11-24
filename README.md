# StudyOS

> Planejamento, registro e notas de estudo em um só lugar, com gamificação para manter a constância.

O StudyOS registra **quanto** você estudou, **o quê** estudou e **como foi** o aproveitamento. Cada sessão
finalizada vira XP, alimenta o streak e enche a barra da meta semanal. Notas em Markdown, revisão espaçada e
IA (opcional) entram nas próximas fases.

> **Status:** documentação, design e plano de execução prontos. Implementação do MVP em andamento, seguindo [docs/12-plano-de-execucao.md](docs/12-plano-de-execucao.md).

## Funcionalidades

**MVP**
- Cronômetro em blocos (livre ou Pomodoro) que sobrevive a recarregar a página
- Fechamento de sessão em segundos: aproveitamento de 1 a 5, tipo de estudo e resumo de uma linha
- XP ponderado pelo aproveitamento, níveis, streak diário, conquistas e missões do dia
- Tela de recompensa animada em sequência, com level up, confete e som opcional
- Dashboard com horas, heatmap clicável, metas semanais por matéria e log de sessões

**Próximas fases**
- Backlog de tópicos e notas em Markdown ligadas às sessões
- Revisão espaçada e flashcards
- IA para organizar notas, gerar flashcards e escrever um relatório semanal
- PWA instalável

## Stack

| Camada | Tecnologia |
|---|---|
| App (UI + API) | Next.js 15, React 19, TypeScript |
| Estilo | Tailwind CSS 4 |
| Dados | PostgreSQL 16 + Prisma 6 |
| Infra | Docker Compose, Caddy (HTTPS automático), VPS |
| IA (V3) | API do Claude, chamada só pelo backend |

```mermaid
flowchart LR
  U[Navegador / PWA] -->|HTTPS| C[Caddy]
  C --> A[App Next.js]
  A --> D[(PostgreSQL)]
  A -.->|V3| AI[API de IA]
```

## Começando (desenvolvimento)

Requisitos: Node.js 22+, Docker.

```bash
git clone <url-do-repo> studyos && cd studyos
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d   # sobe só o Postgres
npm install
npx prisma migrate dev
npm run dev                                       # http://localhost:3000
```

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build de produção (gera o cliente Prisma) e servidor |
| `npm run lint` | ESLint (config do Next), sem warnings |
| `npm run typecheck` | Gera os tipos de rota (`next typegen`) e roda `tsc --noEmit` |
| `npm run test` / `npm run test:watch` | Testes (Vitest) |
| `npm run test:coverage` | Testes com cobertura de `src/lib` |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run check` | lint + typecheck + testes (obrigatório antes de commit) |

O CI (`.github/workflows/ci.yml`) roda `npm ci`, `npm run check`, `npm run build` e `docker build` (sem push).

## Deploy (VPS)

```bash
cp .env.example .env    # preencha DOMAIN, APP_PASSWORD, AUTH_SECRET, POSTGRES_PASSWORD
docker compose up -d --build
```

Detalhes, backup e restauração em [docs/07-deploy.md](docs/07-deploy.md).

## Estrutura

```
.
├── CLAUDE.md           contexto e regras para o Claude Code
├── docs/               documentação do projeto (comece por docs/README.md)
│   ├── adr/            decisões de arquitetura
│   └── design/         fontes do protótipo de telas
├── prisma/             schema e migrações do banco
├── src/                código da aplicação (Next.js)
├── deploy/             Caddyfile e arquivos de operação
├── Dockerfile
├── docker-compose.yml       produção
└── docker-compose.dev.yml   banco para desenvolvimento
```

## Design

Visual "painel de jogo + terminal": escuro, fontes mono, cantos retos, sombras duras, barras em blocos e
recompensa animada em sequência. Tokens e componentes em [docs/11-design.md](docs/11-design.md); fontes do
protótipo em [docs/design/prototipo/](docs/design/prototipo/).

## Documentação

Toda a documentação está em [`docs/`](docs/README.md):
visão e requisitos, arquitetura, modelo de dados, contrato da API, regras de gamificação, integração com IA,
deploy, segurança, roadmap, convenções, design e plano de execução.

## Desenvolvimento com Claude Code

O projeto é construído com o Claude Code CLI. O [`CLAUDE.md`](CLAUDE.md) dá o contexto e as regras a cada sessão,
e o [plano de execução](docs/12-plano-de-execucao.md) traz as tarefas do MVP em ordem, cada uma com um prompt pronto.

## Roadmap

Resumo em [docs/09-roadmap.md](docs/09-roadmap.md): **MVP** (sessões, gamificação, dashboard) → **V2**
(metas, notas, backlog) → **V3** (revisão espaçada, IA, PWA).

## Autor

Marcondes Simão do Nascimento Júnior · Análise e Desenvolvimento de Sistemas (UNIPÊ)
