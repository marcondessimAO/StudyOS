# 11 · Design

Identidade visual e de interação do StudyOS, extraída do protótipo aprovado.
**Protótipo interativo:** [canvas de design](https://claude.ai/artifact/V3VPeHjuP5wMYxbJmTmMYH) (Dashboard, Timer, Fim da sessão, Recompensa).

> Regra para implementar: o app deve ficar **visualmente idêntico** ao protótipo. Na dúvida, o protótipo vence este documento; se divergirem, atualize este documento.

## Conceito

**"Painel de jogo + terminal."** Escuro, números grandes em fonte mono, cantos retos, sombras duras deslocadas,
barras de progresso em **blocos** (como barra de vida) e feedback animado em toda ação. O objetivo é que cada
sessão pareça uma partida terminada com recompensa.

Princípios:
1. **Toda ação responde.** Clique, coleta, minuto completo e nota escolhida têm feedback visual em < 100 ms.
2. **Progresso é visível em blocos.** Nada de barras lisas: blocos contáveis dão sensação de conquista discreta.
3. **Recompensa em sequência.** Ganhos aparecem um por vez (XP → nível → streak → meta → conquista), nunca tudo junto.
4. **Movimento é opcional.** Com `prefers-reduced-motion`, tudo aparece no estado final, sem perder informação.

## Tokens

### Cores

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#0E0F14` | Fundo da aplicação |
| `ink-deep` | `#0B0C10` | Áreas "terminal" (log, campo de comando, recibo) |
| `surface` | `#171922` | Cards |
| `surface-2` | `#1F2230` | Blocos vazios fortes, hover |
| `line` | `#2A2E3D` | Bordas padrão, blocos vazios |
| `line-strong` | `#3A3F52` | Bordas de campos e botões secundários |
| `dot` | `#23263A` | Grade de pontos do fundo |
| `text` | `#F3F4F8` | Texto principal |
| `muted` | `#A1A7B8` | Texto secundário (contraste ≥ 4.5:1 sobre `surface`) |
| `faint` | `#7D8396` | Placeholders, itens bloqueados |
| `violet-600` | `#7C3AED` | Botão primário (texto branco), XP acumulado |
| `violet-500` | `#8B5CF6` | Cor da matéria Backend, blocos preenchidos |
| `violet-400` | `#A78BFA` | Nível, destaques, heatmap máximo |
| `violet-300` | `#C4B5FD` | Links, rótulos em destaque |
| `violet-deep` | `#1B1830` / `#2B2150` / `#4C3A8F` | Fundos e sombras de conquista |
| `lime` | `#A3E635` | **Ganho novo** (XP, blocos recém-preenchidos, sucesso), sombra do botão primário |
| `lime-deep` | `#4D7C0F` | Sombra de botão de coleta |
| `orange` | `#FB923C` | Streak (fundo do card) |
| `orange-ink` | `#1A0E05` | Texto sobre laranja |
| `orange-deep` | `#4A2E1C` | Sombra do card de streak |
| `yellow` | `#FDE047` | Estrelas, aproveitamento |

Heatmap (0 → máx.): `#222533`, `#3B2A6B`, `#5B3BB0`, `#7C3AED`, `#A78BFA`. Dia selecionado: contorno `lime`.

Cores das matérias (o usuário escolhe; padrões sugeridos): `#8B5CF6`, `#22C55E`, `#3B82F6`, `#F97316`.
Texto colorido de matéria usa a versão clara: `#C4B5FD`, `#86EFAC`, `#93C5FD`, `#FDBA74`.

**Regra semântica:** verde-limão = *acabou de ganhar*. Violeta = *acumulado*. Laranja = *streak*. Não usar limão para outra coisa.

### Tipografia

| Papel | Fonte | Peso | Exemplos |
|---|---|---|---|
| Display | **Unbounded** | 700–800 | Saudação, "+94 XP", "LEVEL UP!", número do streak |
| Dados e rótulos | **JetBrains Mono** | 500–800 | Relógio, estatísticas, rótulos `// HOJE`, botões, log |
| Texto | **Inter** | 400–600 | Títulos de tópicos, descrições |

- Carregar com `next/font/google` (sem requisição externa em produção).
- Números sempre com `font-variant-numeric: tabular-nums`.
- Rótulos de seção em mono, maiúsculas, `letter-spacing: 0.08em`, estilo `METAS_DA_SEMANA`.

Escala usada: 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 34, 40, 72, 84, 96 px.

### Forma, espaço e sombra

- **Raio: 0** em tudo. Exceção nenhuma.
- Espaçamento em múltiplos de 2/4: gaps comuns 4, 6, 8, 10, 12, 16, 20, 24 px; padding de card 16–28 px.
- Bordas: 1 px `line`; campos e secundários `line-strong`; selecionado 2 px `text` ou `violet-400`.
- **Sombras duras** (sem blur), deslocadas para baixo e direita:
  - Botão primário: `4px 4px 0 lime`
  - Início rápido: `3px 3px 0 <cor da matéria>`
  - Streak: `6px 6px 0 orange-deep`
  - Conquista desbloqueada: `4px 4px 0 #4C3A8F`
  - Toast / overlays: `5–6px 5–6px 0 violet-600`
- Fundo: grade de pontos `radial-gradient(dot 1px, transparent 1px)` a cada 22 px.
- Alvos de toque ≥ 44 px.

## Componentes

| Componente | Descrição | Onde |
|---|---|---|
| `SegBar` | Barra em blocos. Props: `total`, `filled`, `newFrom` (blocos a partir daqui pintados de `lime` com animação `segpop`), `color`, `height`, `gap` | Nível (20), metas (12), missões (10), conquistas (10) |
| `HardButton` | Botão retangular mono, sombra dura; hover sobe 2 px, active afunda 3 px e some a sombra. Variantes: `primary` (violeta + sombra limão), `ghost` (borda, inverte no hover), `claim` (limão) | Global |
| `StatStrip` | Faixa única com 4 estatísticas separadas por linhas verticais; números contam do zero ao montar | Dashboard |
| `StreakCard` | Card laranja, número gigante em Unbounded, chama tremulando, 7 quadrados da semana | Dashboard, Timer (chip), Recompensa |
| `CommandBar` | Campo `>` em mono com atalho `Ctrl K` e botões de início rápido por matéria | Dashboard |
| `Heatmap` | 12 semanas × 7 dias, células clicáveis (hover aumenta 1,35×), detalhe do dia acima | Dashboard |
| `SessionLog` | Linhas estilo terminal: horário, matéria colorida, tópico, duração, estrelas, `+XP` em limão | Dashboard |
| `QuestCard` | Missão com `SegBar` de 10, estados `in_progress` / `claimable` (fundo verde escuro, botão pulsando) / `claimed` (riscada) | Dashboard |
| `BadgeGrid` | Conquistas 3 colunas; clique mostra detalhe e progresso abaixo | Dashboard |
| `BlockTimer` | Relógio mono 84 px + grade de blocos (Pomodoro 5×5, livre 10×6); bloco atual pisca em limão | Timer |
| `RatingBars` | 5 barras crescentes tipo "sinal"; seleciona até N; rótulo e multiplicador abaixo | Fim da sessão |
| `RewardScreen` | Sequência animada (abaixo) | Recompensa |
| `Toast` | Canto inferior direito, borda limão, sombra violeta; some em ~3 s | Global |
| `Confetti` | Quadrados (pixels) de 5–10 px caindo e girando, 30–40 peças | Recompensa, bloco completo |

## Movimento

Keyframes (copiar do protótipo):

| Nome | Efeito | Duração / curva |
|---|---|---|
| `segpop` | Bloco cresce de 10% a 160% e assenta, com brilho | 450–500 ms, `cubic-bezier(.2,1.8,.4,1)` |
| `float` | "+N XP" sobe 40 px e some | 1,1 s, ease-out |
| `fall` | Confete cai 900 px girando 720° | 2,2–2,4 s, atraso 0–700 ms por peça |
| `flip` | Número gira no eixo X (troca de streak) | 550 ms |
| `lvup` | Selo entra de 20% com leve rotação e passa de 100% | 900 ms, `cubic-bezier(.2,1.6,.4,1)` |
| `bump` | Escala 1,08 (contador de XP) | 250 ms |
| `pulse` / `claim` | Pulsação contínua do CTA / botão coletar | 1,2 / 1,0 s, infinito |
| `blink` | Cursor e bloco atual do timer | 1 s, `steps(2)` |
| `flame` | Chama do streak tremula | 1,4 s, infinito |
| `toast` | Sobe 30 px e aparece | 500 ms |
| `rv` | Revelação: opacidade + 16 px + escala 0,97 | 300–500 ms |

- Hover em cards: `translate(-3px,-3px)`. Pressionar botão: `translate(3px,3px)` e sombra zerada.
- Contadores: easing `easeOutCubic` em ~900 ms ao montar.
- Toda animação dentro de `@media (prefers-reduced-motion: reduce)` é desligada; sequências JS checam `matchMedia` e pulam para o fim.

## Sequência da recompensa

Implementar como hook `useRewardSequence(reward)` que devolve o estado de cada etapa. Linha do tempo em
[05-gamificacao](05-gamificacao.md#tela-de-recompensa-ux). Detalhes visuais:

- XP em Unbounded 72 px, limão, `text-shadow: 5px 5px 0 violet-600`.
- Recibo em mono, borda tracejada, linhas com pontilhado até o valor.
- Nível: 20 blocos; blocos antigos `violet-600`, novos `lime` com `segpop`. No level up: selo "LEVEL UP!" limão sobre o card, rótulo `LV.NN` vira limão, barra recomeça.
- Toque na tela pula para o estado final.

## Som (opcional)

Web Audio, sem arquivos. Desligado por padrão; preferência em `localStorage` (`studyos.sound`).

| Evento | Som |
|---|---|
| Ganho de XP (a cada ~9 XP) | onda quadrada 40 ms, 400 Hz + 6 Hz por XP |
| Bloco de nível | quadrada 70 ms, 520 / 640 / 760 Hz |
| Level up | triângulo, arpejo 523-659-784-1046 Hz, 90 ms entre notas |
| Conquista | triângulo 784-988-1175 Hz |
| Minuto completo / missão coletada | quadrada 60 ms, 700 Hz |

Volume 0,06 com decaimento exponencial. Criar o `AudioContext` só após um clique do usuário.

## Telas

| Tela | Rota | Referência no protótipo |
|---|---|---|
| Dashboard | `/` | `Main.dc.html` |
| Sessão em andamento | `/sessao` | `Timer.dc.html` |
| Fim da sessão | `/sessao/fim` | `Avaliar.dc.html` |
| Recompensa | `/sessao/recompensa` | `Recompensa.dc.html` |
| Login | `/login` | (seguir os tokens; campo único estilo `CommandBar`) |
| Matérias | `/materias` | (lista com cor, meta e `SegBar`) |
| Histórico | `/sessoes` | (`SessionLog` paginado com editar/excluir) |

Layout: dashboard fluido até `max-width: 1360px`; no celular as seções empilham, o log rola na horizontal e as
telas de sessão ocupam a tela inteira (projetadas em 390 × 844).

## Acessibilidade

- Contraste ≥ 4.5:1 para texto. `text`, `muted` e as cores de destaque passam sobre `ink` e `surface`; `faint` fica perto do limite e é só para placeholders e itens bloqueados, nunca para informação necessária.
- Botões reais (`<button>`, `<a>`), `aria-pressed` em seleções, `aria-label` em botões só com ícone e nas barras em blocos (`role="img"` + texto como "4h10 de 6h").
- Valores que mudam ao vivo (XP, detalhe do heatmap) em `aria-live="polite"`.
- Cor nunca é o único sinal: blocos novos também animam; estados de missão têm texto.
