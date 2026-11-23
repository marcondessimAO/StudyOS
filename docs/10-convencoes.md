# 10 · Convenções de desenvolvimento

## Git
- Branch principal: `main`, sempre deployável.
- Branches de trabalho: `feat/<assunto>`, `fix/<assunto>`, `docs/<assunto>`, `chore/<assunto>`.
- Commits no padrão **Conventional Commits**: `feat: cronômetro persistente`, `fix: streak no fuso errado`, `docs: contrato da API`.
- Pull request mesmo trabalhando sozinho, para manter histórico e rodar o CI.

## Código
- TypeScript `strict`. Sem `any` sem justificativa em comentário.
- Regras de negócio em `src/lib/*` como funções puras; handlers de API finos.
- Nomes de código em inglês; textos da interface e documentação em português.
- Formatação com Prettier, lint com ESLint (padrão do Next).

## Testes
- Unitários (Vitest) obrigatórios para `gamification.ts`, `time.ts` e `stats.ts`.
- Casos de borda de data: virada de dia no fuso, horário de verão, sessão que atravessa meia-noite.
- Testes de API para validação de entrada e autenticação.

## CI (GitHub Actions, a configurar)
`npm ci` → lint → typecheck → testes → `docker build`.

## Documentação
- Mudou contrato de API, schema ou regra de gamificação? Atualize o doc correspondente **no mesmo PR**.
- Decisão de arquitetura relevante → novo ADR em `docs/adr/` (copie o formato de um existente).
