# ADR-0005 · Deploy com Docker Compose na VPS

- **Status:** aceito
- **Data:** 2026-11-23

## Contexto
O autor já tem uma VPS e experiência com deploy; quer controle total e custo fixo.

## Decisão
Docker Compose com `caddy` + `app` + `db`. Caddy faz TLS automático. Migrações rodam no start do app.

## Alternativas consideradas
- **Vercel + Supabase:** zero manutenção, mas separa app e dados em provedores externos e não usa a VPS.
- **Nginx + Certbot:** mais configuração manual que o Caddy para o mesmo resultado.
- **Coolify/Dokploy:** painel conveniente, mas mais uma camada para manter; pode ser adotado depois sem mudar o Compose.

## Consequências
- Responsabilidade por backup, atualizações e firewall é do operador (ver [07-deploy](../07-deploy.md)).
