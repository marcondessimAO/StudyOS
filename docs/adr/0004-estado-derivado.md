# ADR-0004 · Perfil como cache derivado das sessões

- **Status:** aceito
- **Data:** 2026-11-23

## Contexto
XP, nível e streak precisam ser rápidos de ler, mas sessões podem ser editadas ou excluídas, o que tornaria contadores incrementais inconsistentes.

## Decisão
`StudySession` é a fonte da verdade. `Profile` guarda XP/streak como **cache**, atualizado de forma incremental ao criar sessão e **recalculado do zero** (`recomputeProfile`) após edições/exclusões. Cada sessão grava o XP concedido, incluindo bônus aleatórios, para o recálculo ser determinístico.

## Consequências
- Correções de dados nunca deixam o perfil "errado" para sempre.
- O recálculo é O(n) nas sessões; aceitável (milhares de linhas). Se crescer, recalcular a partir de um checkpoint.
