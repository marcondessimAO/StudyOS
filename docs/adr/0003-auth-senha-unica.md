# ADR-0003 · Autenticação por senha única

- **Status:** aceito
- **Data:** 2026-11-23

## Contexto
Uso pessoal; não há cadastro de usuários. Mesmo assim a instância fica pública na internet.

## Decisão
Senha única em `APP_PASSWORD` e cookie assinado com HMAC (`AUTH_SECRET`), sem biblioteca de auth.

## Alternativas consideradas
- **Auth.js/NextAuth com OAuth do GitHub:** robusto, mas depende de app OAuth e é excessivo para um usuário.
- **Basic Auth no Caddy:** simples, mas experiência ruim no celular/PWA e sem logout.

## Consequências
- Implementação pequena e auditável (ver [08-seguranca](../08-seguranca.md)).
- Migrar para multiusuário exige trocar por Auth.js ou equivalente.
