# StudyOS

Sistema pessoal de registro e planejamento de estudos com gamificação (XP, nível, streak, conquistas, missões).
Uso individual, auto-hospedado numa VPS. Documentação completa em `docs/` (índice: `docs/README.md`).

## Antes de qualquer tarefa

1. Leia o doc que governa a área que vai mexer:
   - Regras de XP, nível, streak, conquistas, missões → `docs/05-gamificacao.md`
   - Contrato de rotas → `docs/04-api.md`
   - Schema → `docs/03-modelo-de-dados.md` e `prisma/schema.prisma`
   - Visual, tokens, animações, som → `docs/11-design.md` e os fontes em `docs/design/prototipo/`
   - Segurança → `docs/08-seguranca.md`
2. Se a tarefa vier do plano, siga a tarefa correspondente em `docs/12-plano-de-execucao.md`.
3. Em dúvida sobre uma regra de negócio, pergunte em vez de inventar.

## Stack

Next.js 15 (App Router) + React 19 + TypeScript strict · Tailwind CSS 4 · Prisma 6 + PostgreSQL 16 · zod · Vitest ·
Docker Compose + Caddy na VPS. Sem bibliotecas de UI, animação ou data, a menos que a tarefa justifique.

## Comandos

```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres local
npm run dev                                      # http://localhost:3000
npm run check                                    # lint + typecheck + testes (obrigatório antes de commit)
npm run test -- src/lib/gamification.test.ts     # um arquivo de teste
npx prisma migrate dev --name <nome>             # nova migração
npm run db:seed                                  # dados de exemplo (só dev)
```

## Estrutura

```
src/app/            páginas (App Router) e rotas de API (src/app/api/**/route.ts)
src/components/ui/  componentes genéricos (SegBar, HardButton, Toast, Confetti...)
src/components/     componentes de tela
src/hooks/          useRewardSequence, useCountUp, useSound, useReducedMotion
src/lib/            regras de negócio e infraestrutura (db, auth, time, gamification, quests, stats, validation)
prisma/             schema, migrações e seed
docs/               documentação (fonte da verdade das regras)
```

## Regras do código

- **Regras de negócio são funções puras em `src/lib/`**, com testes ao lado (`*.test.ts`). Handlers de API só validam, chamam o domínio e persistem.
- Toda entrada de API passa por `zod`. Erros no formato `{ error: { code, message } }`.
- Datas: armazenar em UTC; "dia" e "semana" sempre via `src/lib/time.ts` no fuso `APP_TZ`. Nunca `new Date().getDate()` solto.
- `StudySession` é a fonte da verdade; `Profile` é cache (`recomputeProfile` após editar/excluir). Ver `docs/adr/0004-estado-derivado.md`.
- Duração da sessão é calculada no servidor; o cliente nunca envia minutos.
- Nomes de código em inglês; textos da interface e documentação em português (pt-BR).
- Sem `any` sem comentário justificando. Sem `dangerouslySetInnerHTML`.

## Regras do visual

- As telas devem ficar **idênticas** ao protótipo em `docs/design/prototipo/` (tabela de tradução no README da pasta).
- Use só os tokens de `docs/11-design.md`: raio 0, sombras duras, barras em blocos (`SegBar`), limão = ganho novo.
- Toda animação respeita `prefers-reduced-motion` (CSS e sequências JS).
- Botões e links reais, alvos ≥ 44 px, `aria-*` como no protótipo.

## Segurança

- Nunca commitar `.env` nem segredos. Variáveis novas vão para `.env.example` e para `docs/07-deploy.md`.
- Chaves de API (IA, V3) só no servidor.
- Não rode comandos na VPS nem faça deploy: prepare os arquivos e diga os comandos.

## Definição de pronto

- `npm run check` verde e, se mexeu em build ou Docker, `npm run build` também.
- Testes novos para toda regra nova ou alterada.
- Doc atualizado no mesmo commit quando contrato, schema, regra ou visual mudar.
- Commit em Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), em português.
- Marque a tarefa no `docs/09-roadmap.md` quando concluída.
