# ADR-0001 · Monólito Next.js

- **Status:** aceito
- **Data:** 2026-11-23

## Contexto
Projeto pessoal, um desenvolvedor, deploy numa VPS. Precisa de interface rica (animações) e uma API simples.

## Decisão
Uma única aplicação **Next.js (App Router) + TypeScript**, com páginas e rotas de API no mesmo projeto.

## Alternativas consideradas
- **Front (React/Vite) + back separado (NestJS ou Spring Boot):** mais próximo de arquitetura corporativa e bom para estudar, mas dobra build, deploy e contrato para manter.
- **Serviço BaaS completo (Supabase/Firebase) sem backend próprio:** rápido, mas tira o controle das regras de negócio e foge da VPS disponível.

## Consequências
- Um contêiner, um deploy, tipos compartilhados entre front e API.
- Se um dia precisar de backend separado (app mobile nativo, outros clientes), as regras já estão isoladas em `src/lib`, o que facilita extrair.
