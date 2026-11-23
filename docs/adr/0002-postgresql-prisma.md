# ADR-0002 · PostgreSQL com Prisma

- **Status:** aceito
- **Data:** 2026-11-23

## Contexto
Dados relacionais simples (matérias, sessões, notas) com agregações por dia e por matéria; futuramente busca full-text em notas.

## Decisão
**PostgreSQL 16** como banco e **Prisma** como ORM e ferramenta de migração.

## Alternativas consideradas
- **SQLite:** mais simples para instância única, mas full-text e concorrência são mais limitados; migrar depois custaria.
- **Drizzle ORM:** mais leve e próximo do SQL; Prisma escolhido pela maturidade das migrações e do Studio.

## Consequências
- Agregações complexas do dashboard podem usar `prisma.$queryRaw` com SQL parametrizado quando necessário.
- Busca de notas pode usar `tsvector` com dicionário `portuguese`.
