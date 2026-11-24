# 01 · Visão e requisitos

## Problema

Estudar sem registro gera a sensação de "estudei muito, mas não sei quanto nem o quê". Planilhas e apps de
Pomodoro resolvem partes isoladas (tempo, tarefas, notas), mas nenhum junta **sessão de estudo + notas +
aproveitamento + revisão** num fluxo que dê vontade de usar todo dia.

## Visão

**StudyOS** é um sistema pessoal de planejamento e registro de estudos, com bloco de notas integrado e IA
opcional, desenhado para ser **rápido de usar** e **gratificante** (feedback imediato, streak, XP).

## Princípios de produto

1. **Atrito mínimo.** Iniciar uma sessão leva no máximo 2 cliques. Registrar o que estudei leva no máximo 15 segundos.
2. **Recompensa imediata.** Toda sessão finalizada termina numa tela de recompensa (XP, streak, meta).
3. **Dados são a fonte da verdade.** Tudo que é exibido (nível, streak, estatísticas) pode ser recalculado a partir das sessões.
4. **IA como ajuda, nunca como dependência.** O app funciona 100% sem a IA configurada.
5. **Pessoal primeiro.** Uso individual no MVP; multiusuário só se fizer sentido depois.

## Persona

**Marcondes** (e quem estuda como ele): estudante de tecnologia, estuda em blocos curtos e variados
(backend, segurança, infra, faculdade), quer enxergar a própria evolução e manter consistência.

## Escopo

### Dentro (MVP e depois)
- Cronômetro de sessão (livre e Pomodoro) com matéria, tópico e tipo de estudo.
- Avaliação de aproveitamento (1 a 5) e resumo de uma linha ao fim da sessão.
- Gamificação: XP, níveis, streak, conquistas, metas semanais, missões do dia.
- Dashboard: horas, heatmap, aproveitamento por matéria.
- Notas em Markdown ligadas a sessões e tópicos.
- Backlog de tópicos e planejamento semanal.
- Revisão espaçada e flashcards.
- IA: resumo de notas, flashcards, relatório semanal.

### Fora (por enquanto)
- Multiusuário, cadastro público, compartilhamento de notas.
- App nativo (o caminho é PWA).
- Sincronização offline completa.
- Integração com calendários externos.

## Requisitos funcionais

| ID | Requisito | Fase |
|---|---|---|
| RF-01 | Autenticar com senha única do dono da instância | MVP |
| RF-02 | CRUD de matérias (nome, cor, meta semanal em minutos) | MVP |
| RF-03 | Iniciar, pausar e finalizar uma sessão com cronômetro que sobrevive a recarregar a página | MVP |
| RF-04 | Ao finalizar: informar aproveitamento (1-5), tipo e resumo; salvar a sessão | MVP |
| RF-05 | Calcular e exibir recompensa (XP, bônus, nível, streak, conquistas) ao finalizar | MVP |
| RF-06 | Dashboard com horas (hoje, semana, mês), heatmap, horas e aproveitamento por matéria | MVP |
| RF-07 | Histórico de sessões com filtro por matéria e período; editar e excluir | MVP |
| RF-08 | Metas semanais por matéria com barra de progresso | MVP |
| RF-09 | Notas em Markdown ligadas a sessão/tópico, com busca | V2 |
| RF-10 | Backlog de tópicos com prioridade e status | V2 |
| RF-11 | Conquistas com notificação visual | MVP |
| RF-12 | Revisão espaçada (1, 3, 7, 14, 30 dias) | V3 |
| RF-13 | IA: resumir notas, gerar flashcards, relatório semanal | V3 |
| RF-14 | PWA instalável e lembretes | V3 |
| RF-15 | Exportar todos os dados (JSON) | V2 |
| RF-16 | Missões do dia com coleta manual de XP | MVP |

## Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Resposta de ações comuns (salvar sessão, abrir dashboard) em menos de 300 ms em condições normais |
| RNF-02 | Feedback visual de recompensa em até 1 s após finalizar a sessão |
| RNF-03 | Funcionar bem em celular (layout responsivo) |
| RNF-04 | Um único `docker compose up -d` sobe o sistema inteiro na VPS |
| RNF-05 | Backup diário do banco com restauração documentada e testada |
| RNF-06 | Nenhum segredo no repositório; configuração por variáveis de ambiente |
| RNF-07 | Todo cálculo de data/streak usa o fuso configurado em `APP_TZ` |
| RNF-08 | O app continua utilizável se a API de IA estiver indisponível ou não configurada |

## Histórias de usuário (MVP)

- Como estudante, quero **iniciar um cronômetro escolhendo só a matéria**, para começar sem burocracia.
- Como estudante, quero **fechar a sessão com uma nota de 1 a 5 e uma linha de resumo**, para registrar o que aprendi.
- Como estudante, quero **ver XP, streak e progresso da meta logo ao terminar**, para sentir que avancei.
- Como estudante, quero **ver um heatmap das últimas semanas**, para enxergar minha consistência.
- Como estudante, quero **corrigir ou apagar uma sessão errada** e ver os números se ajustarem sozinhos.

## Critérios de sucesso

- Uso diário real durante 14 dias seguidos pelo próprio autor.
- Tempo médio para registrar uma sessão (do clique em "finalizar" até salvar) abaixo de 15 s.
- Zero perda de sessão por recarregar a página ou fechar a aba durante o cronômetro.
