# 07 · Deploy e operação (VPS)

Stack de produção: **Docker Compose** com três serviços: `caddy` (HTTPS automático via Let's Encrypt),
`app` (Next.js) e `db` (PostgreSQL 16). Arquivos: [`docker-compose.yml`](../docker-compose.yml),
[`Dockerfile`](../Dockerfile), [`deploy/Caddyfile`](../deploy/Caddyfile).

## Pré-requisitos na VPS

- Docker Engine e plugin Compose.
- Um domínio (ou subdomínio) com registro **A/AAAA apontando para o IP da VPS**.
- Portas 80 e 443 liberadas no firewall; 5432 **não** deve ser exposta.

## Primeiro deploy

```bash
git clone <url-do-repo> studyos && cd studyos
cp .env.example .env
# edite .env: DOMAIN, APP_PASSWORD, AUTH_SECRET, POSTGRES_PASSWORD
openssl rand -hex 32   # use para AUTH_SECRET
docker compose up -d --build
docker compose logs -f app
```

As migrações rodam automaticamente no start do contêiner `app` (`prisma migrate deploy`).
O Caddy emite o certificado no primeiro acesso ao domínio.

## Atualizar

```bash
git pull
docker compose up -d --build
docker image prune -f
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DOMAIN` | Sim (prod) | Domínio servido pelo Caddy |
| `APP_PASSWORD` | Sim | Senha de acesso ao app |
| `AUTH_SECRET` | Sim | Chave HMAC do cookie (32+ bytes aleatórios) |
| `POSTGRES_PASSWORD` | Sim (prod) | Senha do Postgres |
| `DATABASE_URL` | Sim (dev) | Em produção é montada pelo Compose |
| `APP_TZ` | Não | Fuso para dias/streak (padrão `America/Sao_Paulo`) |
| `AI_API_KEY` | Não (V3) | Habilita os recursos de IA |
| `AI_DAILY_LIMIT` | Não (V3) | Máximo de chamadas de IA por dia |

## Backup e restauração

Backup diário via cron no host:

```bash
# /etc/cron.d/studyos-backup  (03:15 todo dia, mantém 14 dias)
15 3 * * * root cd /opt/studyos && docker compose exec -T db pg_dump -U studyos -Fc studyos > /var/backups/studyos/$(date +\%F).dump && find /var/backups/studyos -name '*.dump' -mtime +14 -delete
```

Restaurar:

```bash
docker compose exec -T db pg_restore -U studyos -d studyos --clean --if-exists < /var/backups/studyos/2026-11-23.dump
```

Recomendado: copiar os dumps para fora da VPS (rclone/S3/outro servidor) e **testar a restauração** uma vez por mês.

## Desenvolvimento local

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d   # só o Postgres
npm install
npx prisma migrate dev
npm run dev                                       # http://localhost:3000
```

## Monitoramento mínimo

- `docker compose ps` e `docker compose logs --tail=100 app`.
- Rota `GET /api/health` (a implementar) retornando `200` com checagem do banco, para um monitor externo (ex.: Uptime Kuma).
