/**
 * Regras de jogo do StudyOS como funções puras. Fonte da verdade: docs/05-gamificacao.md.
 */
import { appTz, hourInTz, previousDayKey, type DayKey } from "./time";

// ---------------------------------------------------------------- XP de uma sessão

export type Rating = 1 | 2 | 3 | 4 | 5;

/** Multiplicador por nota, em décimos (0.6 … 1.4) para o arredondamento não sofrer com float. */
const MULTIPLIER_TENTHS: Record<Rating, number> = { 1: 6, 2: 8, 3: 10, 4: 12, 5: 14 };

export const FIRST_OF_DAY_XP = 20;
export const LUCKY_DOUBLE_MIN_MINUTES = 25;
export const LUCKY_DOUBLE_CHANCE = 0.1;

export type BonusCode = "first_of_day" | "lucky_double";

export interface Bonus {
  code: BonusCode;
  xp: number;
}

export interface SessionXp {
  /** round(minutos × multiplicador). */
  base: number;
  multiplier: number;
  bonuses: Bonus[];
  total: number;
}

export interface SessionXpInput {
  minutes: number;
  rating: Rating;
  isFirstOfDay: boolean;
  /** Sorteio do lucky_double, em [0, 1). Injetado para testes; padrão Math.random. */
  random?: () => number;
}

function assertRating(rating: number): asserts rating is Rating {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new RangeError(`Nota inválida: ${rating} (esperado 1 a 5)`);
  }
}

function assertMinutes(minutes: number): void {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new RangeError(`Minutos inválidos: ${minutes}`);
  }
}

export function sessionXp({
  minutes,
  rating,
  isFirstOfDay,
  random = Math.random,
}: SessionXpInput): SessionXp {
  assertRating(rating);
  assertMinutes(minutes);
  const tenths = MULTIPLIER_TENTHS[rating];
  const base = Math.round((minutes * tenths) / 10);
  const bonuses: Bonus[] = [];
  if (isFirstOfDay) bonuses.push({ code: "first_of_day", xp: FIRST_OF_DAY_XP });
  if (minutes >= LUCKY_DOUBLE_MIN_MINUTES && random() < LUCKY_DOUBLE_CHANCE) {
    bonuses.push({ code: "lucky_double", xp: base });
  }
  const total = base + bonuses.reduce((sum, b) => sum + b.xp, 0);
  return { base, multiplier: tenths / 10, bonuses, total };
}

// ---------------------------------------------------------------- Nível

/** XP total para alcançar o nível L: 50·L·(L−1). */
export function xpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError(`Nível inválido: ${level}`);
  return 50 * level * (level - 1);
}

/** Nível para um XP total: floor((1 + sqrt(1 + xp/12.5)) / 2), corrigido contra erro de float. */
export function levelFromXp(xp: number): number {
  if (!(xp >= 0)) throw new RangeError(`XP inválido: ${xp}`);
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2));
  while (xpForLevel(level + 1) <= xp) level++;
  while (level > 1 && xpForLevel(level) > xp) level--;
  return level;
}

/** XP que falta para o próximo nível: 50·(level+1)·level − xp. */
export function xpToNext(xp: number): number {
  return xpForLevel(levelFromXp(xp) + 1) - xp;
}

export interface LevelProgress {
  level: number;
  /** XP já conquistado dentro do nível atual. */
  current: number;
  /** XP do nível atual até o próximo (100·level). */
  needed: number;
  /** current / needed, de 0 a < 1. */
  fraction: number;
}

export function progressInLevel(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const needed = xpForLevel(level + 1) - floor;
  const current = xp - floor;
  return { level, current, needed, fraction: current / needed };
}

// ---------------------------------------------------------------- Streak

/** Sessões com menos que isso não contam para o streak (ainda rendem XP). */
export const STREAK_MIN_MINUTES = 10;

export interface StreakState {
  lastStudyDay: DayKey | null;
  streak: number;
  bestStreak: number;
}

/**
 * Aplica uma sessão ao streak. `sessionDay` é o dia de `endedAt` no fuso do app.
 * Sessão de um dia anterior ao lastStudyDay (lançada depois) não mexe no estado:
 * o recálculo completo (recomputeProfileFrom) é quem reordena o histórico.
 */
export function nextStreak(state: StreakState, sessionDay: DayKey, sessionMinutes: number): StreakState {
  if (sessionMinutes < STREAK_MIN_MINUTES) return { ...state };
  const { lastStudyDay } = state;
  if (lastStudyDay !== null && sessionDay <= lastStudyDay) return { ...state };
  const streak = lastStudyDay !== null && lastStudyDay === previousDayKey(sessionDay) ? state.streak + 1 : 1;
  return { lastStudyDay: sessionDay, streak, bestStreak: Math.max(state.bestStreak, streak) };
}

// ---------------------------------------------------------------- Conquistas

export type AchievementCode =
  | "first_session"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "hours_10"
  | "hours_50"
  | "hours_100"
  | "early_bird"
  | "night_owl"
  | "perfect_focus";

export interface AchievementSession {
  startedAt: Date;
  endedAt: Date;
  minutes: number;
  rating: number;
}

/** Estado DEPOIS da sessão que acabou de ser gravada. */
export interface AchievementContext {
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  /** A sessão recém-finalizada; ausente quando só os totais importam. */
  session?: AchievementSession;
}

export interface AchievementDef {
  code: AchievementCode;
  name: string;
  description: string;
  /** Ícone curto para a UI (até 4 caracteres, como no protótipo). */
  icon: string;
  unlocked: (ctx: AchievementContext, tz: string) => boolean;
}

const EARLY_BIRD_HOUR = 7;
const NIGHT_OWL_HOUR = 23;
const PERFECT_FOCUS_MINUTES = 45;

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    code: "first_session",
    name: "Primeiro passo",
    description: "Completar a primeira sessão.",
    icon: "01",
    unlocked: (c) => c.totalSessions >= 1,
  },
  {
    code: "streak_3",
    name: "Pegando ritmo",
    description: "Estudar 3 dias seguidos.",
    icon: "3D",
    unlocked: (c) => c.streak >= 3,
  },
  {
    code: "streak_7",
    name: "Semana perfeita",
    description: "Estudar 7 dias seguidos.",
    icon: "7D",
    unlocked: (c) => c.streak >= 7,
  },
  {
    code: "streak_30",
    name: "Hábito formado",
    description: "Estudar 30 dias seguidos.",
    icon: "30D",
    unlocked: (c) => c.streak >= 30,
  },
  {
    code: "hours_10",
    name: "10 horas",
    description: "600 min acumulados.",
    icon: "10H",
    unlocked: (c) => c.totalMinutes >= 600,
  },
  {
    code: "hours_50",
    name: "50 horas",
    description: "3.000 min acumulados.",
    icon: "50H",
    unlocked: (c) => c.totalMinutes >= 3000,
  },
  {
    code: "hours_100",
    name: "100 horas",
    description: "6.000 min acumulados.",
    icon: "100H",
    unlocked: (c) => c.totalMinutes >= 6000,
  },
  {
    code: "early_bird",
    name: "Madrugador",
    description: "Começar uma sessão antes das 7h.",
    icon: "6AM",
    unlocked: (c, tz) => c.session !== undefined && hourInTz(c.session.startedAt, tz) < EARLY_BIRD_HOUR,
  },
  {
    code: "night_owl",
    name: "Coruja",
    description: "Terminar uma sessão depois das 23h.",
    icon: "23H",
    unlocked: (c, tz) => c.session !== undefined && hourInTz(c.session.endedAt, tz) >= NIGHT_OWL_HOUR,
  },
  {
    code: "perfect_focus",
    name: "Foco total",
    description: "Sessão de 45 min ou mais com nota 5.",
    icon: "45+",
    unlocked: (c) =>
      c.session !== undefined && c.session.minutes >= PERFECT_FOCUS_MINUTES && c.session.rating === 5,
  },
];

/** Códigos recém-desbloqueados (ordem do catálogo), excluindo os que já existiam. */
export function evaluateAchievements(
  context: AchievementContext,
  alreadyUnlocked: Iterable<string>,
  tz: string = appTz(),
): AchievementCode[] {
  const unlocked = new Set(alreadyUnlocked);
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.code) && a.unlocked(context, tz)).map((a) => a.code);
}
