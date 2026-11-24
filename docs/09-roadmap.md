# 09 · Roadmap

Regra: **usar o app no próprio estudo desde o fim do MVP**. Cada fase só começa quando a anterior está em uso diário.

## MVP · núcleo que já dá dopamina
- [ ] Projeto base: Next.js, Prisma, Tailwind, Docker, Caddy
- [ ] Login por senha e middleware de proteção
- [ ] CRUD de matérias
- [ ] Cronômetro (livre e Pomodoro 25/5), persistente no `localStorage`
- [ ] Finalizar sessão: nota, tipo, resumo
- [ ] `gamification.ts` com testes: XP, nível, streak, conquistas
- [ ] Tela de recompensa animada (sequência e level up, ver [11-design](11-design.md))
- [ ] Metas semanais por matéria (barra em blocos)
- [ ] Missões do dia (3 fixas) com coleta de XP
- [ ] Dashboard: hoje/semana, heatmap clicável, metas, log, conquistas, missões
- [ ] Histórico com edição e exclusão + recálculo do perfil
- [ ] `GET /api/health`
- [ ] Deploy na VPS com backup

Plano detalhado, tarefa por tarefa: [12-plano-de-execucao](12-plano-de-execucao.md).

### Progresso do plano de execução
- [x] T01 · Base do projeto e ferramentas
- [ ] T02 · Design tokens, fontes e estilos globais
- [ ] T03 · Banco: schema, migração e seed
- [ ] T04 · Datas no fuso do app
- [ ] T05 · Gamificação: XP, nível, streak, conquistas
- [ ] T06 · Missões do dia
- [ ] T07 · Recálculo do perfil
- [ ] T08 · Autenticação
- [ ] T09 · Matérias
- [ ] T10 · Finalizar sessão
- [ ] T11 · Listar, editar e excluir sessões
- [ ] T12 · Estatísticas do dashboard
- [ ] T13 · Missões e health
- [ ] T14 · Kit de componentes
- [ ] T15 · Login e layout do app
- [ ] T16 · Matérias (tela)
- [ ] T17 · Timer
- [ ] T18 · Fim da sessão
- [ ] T19 · Recompensa
- [ ] T20 · Dashboard
- [ ] T21 · Histórico de sessões
- [ ] T22 · Deploy na VPS
- [ ] T23 · Uso real e polimento

## V2 · organização
- [ ] Notas em Markdown ligadas a sessão/tópico, busca full-text
- [ ] Backlog de tópicos (prioridade, status) e visão "Hoje" com 3 itens
- [ ] Congelamento de streak (1 por semana)
- [ ] Exportar dados em JSON
- [ ] Missões variadas (catálogo sorteado por dia)

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
