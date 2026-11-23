# 05 · Gamificação

Objetivo: tornar cada sessão gratificante **sem** premiar enrolação. Aproveitamento (nota 1-5) pesa no XP,
então estudar bem rende mais do que só deixar o relógio rodando.

Todas as regras abaixo vivem em `src/lib/gamification.ts` como **funções puras** e têm testes unitários.

## XP de uma sessão

```
multiplicador(rating) = 0.6, 0.8, 1.0, 1.2, 1.4   para rating 1, 2, 3, 4, 5
xpBase = round(minutos * multiplicador)
```

Bônus (somados ao `xpBase`):

| Código | Regra | XP |
|---|---|---|
| `first_of_day` | Primeira sessão do dia (fuso `APP_TZ`) | +20 |
| `lucky_double` | Sessão de 25 min ou mais, sorteio de 1 em 10 | dobra o `xpBase` (+`xpBase`) |

O bônus `lucky_double` é a pequena imprevisibilidade que mantém o ganho interessante; o resultado é gravado
em `StudySession.xp`, então o recálculo nunca reroda o sorteio.

Exemplo: 60 min, nota 4, primeira do dia → `round(60*1.2) = 72` + 20 = **92 XP**.

## Nível

XP total necessário para alcançar o nível `L`: `50 * L * (L - 1)`.

| Nível | XP total |
|---|---|
| 1 | 0 |
| 2 | 100 |
| 3 | 300 |
| 4 | 600 |
| 5 | 1000 |
| 10 | 4500 |

Inverso: `level = floor((1 + sqrt(1 + xp / 12.5)) / 2)`.
`xpToNext = 50 * (level + 1) * level - xp`.

## Streak

- "Dia de estudo" = dia civil de `endedAt` no fuso `APP_TZ`.
- Estudou hoje e `lastStudyDay` é ontem → `streak + 1`.
- Estudou hoje e `lastStudyDay` é hoje → inalterado.
- Qualquer outro caso → `streak = 1`.
- `bestStreak = max(bestStreak, streak)`.
- Uma sessão só conta para o streak se tiver **pelo menos 10 minutos líquidos** (evita "streak de 1 minuto"); sessões menores ainda rendem XP.
- **V2:** 1 "congelamento" por semana para não punir um dia ruim. Exige novos campos em `Profile`.

## Conquistas (MVP)

| Código | Nome | Condição |
|---|---|---|
| `first_session` | Primeiro passo | Completar a primeira sessão |
| `streak_3` | Pegando ritmo | Streak de 3 dias |
| `streak_7` | Semana perfeita | Streak de 7 dias |
| `streak_30` | Hábito formado | Streak de 30 dias |
| `hours_10` | 10 horas | 600 min acumulados |
| `hours_50` | 50 horas | 3000 min acumulados |
| `hours_100` | 100 horas | 6000 min acumulados |
| `early_bird` | Madrugador | Sessão iniciada antes das 07:00 (fuso `APP_TZ`) |
| `night_owl` | Coruja | Sessão encerrada depois das 23:00 (fuso `APP_TZ`) |
| `perfect_focus` | Foco total | Sessão de 45 min ou mais com nota 5 |

Conquistas são avaliadas ao finalizar cada sessão; as novas aparecem na tela de recompensa.

## Recálculo (Profile é cache)

`recomputeProfile()` reconstrói tudo a partir das sessões, ordenadas por `endedAt`:
`xp = soma(StudySession.xp)`, streak e `bestStreak` pela sequência de dias com sessões válidas, `lastStudyDay`
pelo último dia. É chamado após editar a nota ou excluir/mover sessão e matéria, e disponível como comando de
manutenção. Conquistas já desbloqueadas **não** são revogadas.

## Tela de recompensa (UX)

Ordem da animação, tudo em até ~1 s para o primeiro feedback:
1. Contador de XP subindo (`+92 XP`) com som curto opcional.
2. Barra de nível enchendo; se subiu de nível, destaque e confete.
3. Streak (chama) incrementando.
4. Barra da meta semanal da matéria.
5. Conquistas novas, uma a uma.

Respeitar `prefers-reduced-motion`: sem confete nem movimentos bruscos, apenas as informações.

## Guardas contra viés ruim

- Estudo mais longo não rende XP infinito: sessões acima de 4 h exibem aviso de pausa (o servidor aceita até 12 h).
- A gamificação não deve gerar ansiedade: sem notificações de "você vai perder seu streak" por padrão.
