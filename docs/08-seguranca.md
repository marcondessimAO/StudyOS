# 08 · Segurança

Modelo de ameaça: instância pessoal exposta na internet. Principais riscos: acesso não autorizado aos dados,
vazamento de segredos, perda de dados e conteúdo malicioso renderizado nas notas.

## Autenticação

- Senha única (`APP_PASSWORD`) comparada em **tempo constante** (`crypto.timingSafeEqual` sobre hashes).
- Cookie `studyos_auth`: valor = `expiração.assinaturaHMAC-SHA256(AUTH_SECRET)`; flags `HttpOnly`, `Secure`, `SameSite=Lax`, validade de 30 dias.
- Trocar `AUTH_SECRET` invalida todas as sessões.
- Rate limit no login: 5 tentativas/minuto por IP (em memória; suficiente para instância única).
- Middleware do Next.js protege todas as páginas e `/api/*`, exceto `/login` e `/api/login`.

## Proteção de requisições

- Rotas que alteram dados aceitam só JSON e checam o cabeçalho `Origin` contra `DOMAIN` (defesa contra CSRF somada ao `SameSite=Lax`).
- Toda entrada validada por esquema; tamanhos máximos em todos os textos.
- Queries apenas via Prisma (parametrizadas); nenhum SQL concatenado.

## Conteúdo e XSS

- React escapa texto por padrão; não usar `dangerouslySetInnerHTML`.
- Markdown das notas (V2) renderizado com HTML desabilitado e saída sanitizada.
- Cabeçalhos via Caddy: `Content-Security-Policy` restritiva, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `Strict-Transport-Security`.

## Segredos

- Nenhum segredo no repositório; `.env` está no `.gitignore` e só `.env.example` é versionado.
- Chave de IA apenas no servidor.

## Infraestrutura

- Postgres sem porta publicada; acessível só pela rede interna do Compose.
- Contêiner do app roda como usuário não-root (`USER node`).
- Atualizações de imagens base mensais; Dependabot ou `npm audit` no CI.
- Backups diários fora da VPS (ver [07-deploy](07-deploy.md)).

## Checklist antes de ir para produção

- [ ] `APP_PASSWORD` forte e `AUTH_SECRET` aleatório de 32 bytes
- [ ] Porta 5432 fechada no firewall
- [ ] HTTPS ativo e redirecionamento de HTTP
- [ ] Backup rodando e restauração testada
- [ ] Rate limit do login testado
