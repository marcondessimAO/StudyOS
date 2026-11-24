# Relatório · Execução autônoma da Fase 0 e Fase 1 (T01–T07)

Data: 2026-11-24 · Branch: `claude/fase-0-1-autonomous-3f019e` (worktree) · Nada foi enviado com `git push`.

## 1. Status das tarefas

| Tarefa | Status | Commit | Resumo |
|---|---|---|---|
| T01 · Base do projeto e ferramentas | ✅ pronta | `88f6892` | Next 15.5 + React 19, ESLint 9, Prettier, Vitest, zod, scripts, CI |
| T02 · Design tokens, fontes e estilos | ✅ pronta | `b4aa8e4` | Tailwind 4 `@theme`, fontes `next/font`, keyframes, `/dev/tokens` |
| T03 · Banco: schema, migração e seed | ✅ pronta | `8829907` | `0001_init` com CHECKs, `db.ts`, seed protegido contra produção |
| T04 · Datas no fuso do app | ✅ pronta | `d715c12` | `time.ts` com 100% de cobertura |
| T05 · XP, nível, streak, conquistas | ✅ pronta | `cd3f496` | `gamification.ts` com 54 testes |
| T06 · Missões do dia | ✅ pronta | `ad49a61` | `quests.ts` com 100% de cobertura |
| T07 · Recálculo do perfil | ✅ pronta | `20c7dd6` | `recomputeProfileFrom`, `recomputeProfile` e teste de propriedade |

Critérios de pronto verificados:
- T01: `npm run dev` abre a página (HTTP 200 com "StudyOS"), `npm run check` passa, `docker build` passa. O CI está escrito, mas **não rodou no GitHub** porque nada foi enviado.
- T02: `/dev/tokens` mostra cores, fontes, sombras e todas as animações de `11-design.md`, com botão REPLAY. Com `next start`, a rota devolve **404**.
- T03: o Docker estava disponível. Postgres 16 no ar, migração aplicada com `prisma migrate dev` e seed executado (idempotente). Um INSERT com `rating = 6` é recusado pelo CHECK, e `NODE_ENV=production` faz o seed sair com código 1.
- T04: 100% de cobertura em `time.ts`.
- T05: todas as regras do doc 05 têm teste.
- T06: progresso e status das 3 missões testados.
- T07: o recálculo do zero dá o mesmo resultado que o incremental em 50 cenários com seed fixa.

## 2. `npm run check` e `npm run build`

```
npm run check
  lint       eslint . --max-warnings 0        → 0 problemas
  typecheck  next typegen && tsc --noEmit      → ok
  test       vitest run                        → Test Files 5 passed (5) · Tests 154 passed (154)

npm run build  (prisma generate && next build, Next.js 15.5.29)
  ✓ Compiled successfully
  Route (app)            Size   First Load JS
  ┌ ○ /                  123 B  103 kB
  ├ ○ /_not-found        995 B  104 kB
  └ ○ /dev/tokens        503 B  103 kB   (404 em produção)

docker build -t studyos:local .  → ok (exit 0, rodado de novo após a T07)
```

## 3. Cobertura de `src/lib` (vitest --coverage, v8)

```
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered
-----------------|---------|----------|---------|---------|----------
All files        |     100 |    98.34 |     100 |     100 |
 gamification.ts |     100 |    96.55 |     100 |     100 | 83-84
 profile.ts      |     100 |      100 |     100 |     100 |
 quests.ts       |     100 |      100 |     100 |     100 |
 time.ts         |     100 |      100 |     100 |     100 |
```

As linhas 83–84 são os laços defensivos de `levelFromXp`, que corrigem um eventual erro de ponto flutuante no `sqrt`. Com XP realista eles nunca disparam; o teste confirma a consistência nível↔XP até o nível 500. `db.ts` está fora da cobertura porque só cria o cliente.

## 4. Decisões tomadas sozinho

**Processo e ambiente**
- **Branch:** o pedido citava `feat/fase-0-1`, mas também dizia "não mude de branch". Fiquei no branch da worktree (`claude/fase-0-1-autonomous-3f019e`). Para renomear: `git branch -m feat/fase-0-1`.
- Abri o Docker Desktop, que estava fechado, para subir o Postgres. O container `fase-0-1-autonomous-3f019e-db-1` continua rodando, com o volume nomeado pela pasta da worktree. Não mexi nos containers de outros projetos; o Postgres 15 deles usa a porta 5433.
- Criei o `.env` local a partir do `.env.example`. Ele é ignorado pelo git e não foi commitado.

**T01**
- `lint` roda com `--max-warnings 0`.
- `typecheck` = `next typegen && tsc --noEmit`, para não depender de build anterior. `next-env.d.ts` passou a ser ignorado pelo git, porque é gerado.
- `outputFileTracingRoot` foi fixado na raiz do projeto: o Next pegava um `package-lock.json` de uma pasta acima, efeito da worktree.
- O Vitest usa `APP_TZ=America/Sao_Paulo` fixo e `passWithNoTests`.
- Também adicionei `test:coverage` e `format:check`. O `check` continua exatamente lint + typecheck + test, como no plano.

**T02**
- A paleta e as sombras padrão do Tailwind foram removidas: só existem os tokens do design, mais `transparent`, `current` e `white`.
- Os três tons de `violet-deep` viraram `violet-deep-1/2/3`.
- Keyframes com o mesmo nome e valores diferentes entre protótipos (`float`, `segpop`) ficaram na versão do `Main.dc.html`.

**T03**
- A migração está em `prisma/migrations/0001_init` (nome do plano), gerada com `migrate diff --from-empty`. As próximas, com prefixo de timestamp, ordenam depois dela.
- Além do CHECK de rating pedido no plano, entraram `minutes >= 1` e `endedAt > startedAt`, que são regras de integridade já escritas no doc 03.
- O schema já batia com o doc 03 e não foi alterado.

**T04**
- "Dia" é uma string `YYYY-MM-DD` (`DayKey`), como `Profile.lastStudyDay` e `QuestClaim.day`.
- `startOfDay` devolve o primeiro instante do dia mesmo quando a meia-noite não existe (horário de verão antigo do Brasil).
- Além das funções pedidas, exportei `addDays`, `isoWeekday` e `startOfWeekKey`.

**T05**
- O multiplicador é calculado em décimos inteiros, para o `round` não sofrer com float.
- `lucky_double` só sorteia com 25 min ou mais e sai quando `random() < 0.1`. A ordem dos bônus é `first_of_day` e depois `lucky_double`.
- `night_owl` = fim entre 23:00 e 23:59 no fuso do app; `early_bird` = início com hora < 7. Registrado no doc 05.
- `nextStreak` ignora sessões de dia anterior ao `lastStudyDay`; quem corrige é o recálculo. Registrado no doc 05.
- Ícones das conquistas: `01, 3D, 7D, 30D, 10H, 50H, 100H, 6AM, 23H, 45+`. Os do protótipo foram mantidos e criei os que faltavam.
- Entradas inválidas (nota fora de 1..5, minutos negativos, XP < 0) lançam `RangeError`.

**T06**
- O progresso não é limitado à meta, seguindo o doc 04 (`progress: 95` para meta 30).
- Um resumo só com espaços não conta para `two_summaries`.
- `claimError` devolve o motivo da recusa (`unknown_quest`, `already_claimed`, `not_complete`) para a T13 mapear em 404, 409 e 400.
- Também criei `questsCompletedBy`, que a T10 vai usar em `reward.questsCompleted`.

**T07**
- `recomputeProfile` aceita `PrismaClient` ou o cliente de uma transação.
- O seed passou a usar as regras oficiais: XP com `lucky_double` sorteado pela seed fixa, conquistas em ordem cronológica e perfil via `recomputeProfile`.

**Docs corrigidos ou esclarecidos**
- `docs/03-modelo-de-dados.md`: os CHECKs agora existem no banco.
- `docs/05-gamificacao.md`: o título da missão `quality_session` foi alinhado ao contrato do doc 04 ("Sessão de qualidade (25 min, nota 4+)"). Também registrei o progresso sem limite, o resumo só com espaços, o horário de `early_bird` e `night_owl`, os ícones e a sessão retroativa no streak. Nenhuma regra mudou; só tirei ambiguidades.
- `docs/09-roadmap.md`: ganhou a lista "Progresso do plano de execução" (T01–T23), já que o roadmap não tinha itens por tarefa. T01–T07 estão marcadas, mais o item "`gamification.ts` com testes".
- Nenhum exemplo numérico dos docs estava errado: 60 min, nota 4, primeira do dia = 92 e 63 min = 96, com 980 → 1076 subindo do nível 4 para o 5. Todos conferem com a regra.

## 5. Pendências e o que você precisa fazer

1. **Revisar e decidir o branch.** Renomeie, se quiser (`git branch -m feat/fase-0-1`), e faça o push ou abra o PR para o CI rodar no GitHub pela primeira vez.
2. **Validar o CI no GitHub.** Ele usa Node 22, e eu testei localmente com Node 24.
3. **Banco local:** já está migrado e populado. Em outra cópia do repositório, rode `docker compose -f docker-compose.dev.yml up -d`, depois `npx prisma migrate dev` e `npm run db:seed`.
4. **Confirmar duas interpretações de regra** (estão no doc 05):
   - Uma sessão que termina depois da meia-noite **não** conta como `night_owl`.
   - Uma sessão retroativa não mexe no streak incremental; o recálculo é que acerta.
5. **Parar o container de desenvolvimento**, se não for usar: `docker compose -f docker-compose.dev.yml down` (os dados ficam no volume).

## 6. Sugestões para as próximas fases

- **T10:**
  - Se o dia da sessão for anterior ao `lastStudyDay`, chame `recomputeProfile` dentro da transação em vez do cálculo incremental.
  - `isFirstOfDay` deve considerar qualquer sessão do dia, inclusive as com menos de 10 min.
  - Use `questsCompletedBy(sessõesAntes, sessõesDepois, coletas)` para montar `questsCompleted`.
- **T12:** o doc não diz o que mostrar como "streak atual" quando `lastStudyDay` é mais antigo que ontem. A sugestão é exibir 0 nesse caso (sem gravar). Vale decidir e registrar no doc 05.
- **T12:** o catálogo `ACHIEVEMENTS` já tem nome, descrição e ícone. Falta uma função pura de progresso por conquista (ex.: `hours_50` → minutos/3000) para o `BadgeGrid`.
- **T22:**
  - A imagem final copia o `node_modules` inteiro, com dependências de desenvolvimento. Dá para enxugar com `output: "standalone"` ou com `npm ci --omit=dev` num estágio próprio, mantendo o `prisma` CLI para o `migrate deploy`.
  - O Prisma 6 avisa que `package.json#prisma` (usado para o seed) será substituído por `prisma.config.ts` no Prisma 7.
- O ESLint roda direto (`eslint .`), porque `next lint` está obsoleto no Next 15.5.
