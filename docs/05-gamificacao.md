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

## Missões do dia (MVP)

Três missões fixas, renovadas à meia-noite no fuso `APP_TZ`. Ao completar, a missão fica **coletável**:
o XP só entra quando o usuário clica em **COLETAR** (o clique é parte da recompensa).

| Código | Missão | Condição (no dia) | XP |
|---|---|---|---|
| `study_30` | Estudar 30 min hoje | soma de `minutes` das sessões do dia ≥ 30 | +25 |
| `two_summaries` | Escrever 2 resumos | 2 sessões do dia com `summary` não vazio | +15 |
| `quality_session` | Sessão de qualidade | 1 sessão do dia com ≥ 25 min e nota ≥ 4 | +30 |

- Progresso é **derivado** das sessões do dia (nada é gravado até a coleta).
- A coleta grava um `QuestClaim` (`day`, `code`, `xp`) com unicidade por dia e código: coletar duas vezes é impossível.
- Missão completa e não coletada até a meia-noite **expira** (sem XP). Isso cria um motivo leve para abrir o app no mesmo dia.
- Se uma sessão for excluída depois da coleta, o XP da missão **permanece** (sem punição retroativa).
- V2: missões variadas por dia (sorteio de um catálogo), com a mesma tabela.

## Recálculo (Profile é cache)

`recomputeProfile()` reconstrói tudo a partir das sessões e das coletas, ordenadas por data:
`xp = soma(StudySession.xp) + soma(QuestClaim.xp)`, streak e `bestStreak` pela sequência de dias com sessões válidas, `lastStudyDay`
pelo último dia. É chamado após editar a nota ou excluir/mover sessão e matéria, e disponível como comando de
manutenção. Conquistas já desbloqueadas **não** são revogadas.

## Tela de recompensa (UX)

Sequência validada no protótipo (ver [11-design](11-design.md#sequência-da-recompensa)). Primeiro feedback em < 100 ms,
sequência completa em ~5,5 s. Tudo dirigido por `reward` da API (`xpBefore`, `xpGained`, `levelBefore`, `level`, ...).

| t (ms) | Evento |
|---|---|
| 80 | Selo "SESSÃO SALVA" + confete |
| 250–1450 | Contador de XP sobe de 0 até `xpGained` (passos de ~3, a cada 32 ms) |
| 900 / 1100 / 1300 | Linhas do recibo: XP base, bônus, total |
| 1600 | Card de nível aparece |
| 1850+ | Blocos novos da barra de nível enchem um a um (230 ms cada, cor de destaque) |
| ao encher | Se `levelUp`: selo **LEVEL UP!**, barra zera com o progresso no novo nível, novo confete |
| +700 | Streak gira para o novo valor (se `streakIncreased`) |
| +600 | Meta semanal da matéria enche os blocos novos |
| +600 | Conquistas novas deslizam, uma a uma |
| fim | Botão CONTINUAR pulsa |

- **Som** opcional (desligado por padrão, preferência salva no navegador): bipes curtos com frequência subindo junto do XP, arpejo no level up e na conquista.
- Respeitar `prefers-reduced-motion`: sem confete, sem sequência; tudo aparece já no estado final.
- Tocar em qualquer lugar pula para o estado final (quem tem pressa não espera a animação).

## Guardas contra viés ruim

- Estudo mais longo não rende XP infinito: sessões acima de 4 h exibem aviso de pausa (o servidor aceita até 12 h).
- A gamificação não deve gerar ansiedade: sem notificações de "você vai perder seu streak" por padrão.
