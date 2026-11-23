# 09 · Roadmap

Regra: **usar o app no próprio estudo desde o fim do MVP**. Cada fase só começa quando a anterior está em uso diário.

## MVP · núcleo que já dá dopamina
- [ ] Projeto base: Next.js, Prisma, Tailwind, Docker, Caddy
- [ ] Login por senha e middleware de proteção
- [ ] CRUD de matérias
- [ ] Cronômetro (livre e Pomodoro 25/5), persistente no `localStorage`
- [ ] Finalizar sessão: nota, tipo, resumo
- [ ] `gamification.ts` com testes: XP, nível, streak, conquistas
- [ ] Tela de recompensa animada
- [ ] Dashboard: hoje/semana/mês, heatmap, por matéria
- [ ] Histórico com edição e exclusão + recálculo do perfil
- [ ] Deploy na VPS com backup

## V2 · organização
- [ ] Metas semanais com barra de progresso
- [ ] Notas em Markdown ligadas a sessão/tópico, busca full-text
- [ ] Backlog de tópicos (prioridade, status) e visão "Hoje" com 3 itens
- [ ] Congelamento de streak (1 por semana)
- [ ] Exportar dados em JSON
- [ ] `GET /api/health`

## V3 · retenção e IA
- [ ] Revisão espaçada (1, 3, 7, 14, 30 dias)
- [ ] Flashcards (manuais e gerados por IA)
- [ ] IA: organizar nota, relatório semanal, planejador
- [ ] PWA instalável e lembretes

## Ideias para depois
- Tutor com contexto das notas
- Multiusuário (portfólio)
- Integração com calendário
- Modo foco (bloqueio de abas, som ambiente)
