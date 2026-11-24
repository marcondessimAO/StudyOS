/**
 * Datas no fuso do app (APP_TZ). Instantes ficam em UTC (Date); "dia" e "semana" são sempre
 * derivados aqui, como chaves "YYYY-MM-DD". Sem bibliotecas de data: só Intl.DateTimeFormat.
 */

export const DEFAULT_TZ = "America/Sao_Paulo";

/** Chave de dia civil no formato "YYYY-MM-DD". */
export type DayKey = string;

const DAY_MS = 86_400_000;
const DAY_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Fuso do app: APP_TZ ou America/Sao_Paulo. Lido a cada chamada (testes trocam a env). */
export function appTz(): string {
  return process.env.APP_TZ || DEFAULT_TZ;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  let formatter = formatters.get(tz);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(tz, formatter);
  }
  return formatter;
}

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Data e hora de parede do instante no fuso. */
function wallClock(date: Date, tz: string): WallClock {
  const parts: Record<string, number> = {};
  for (const part of formatterFor(tz).formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Diferença (ms) entre o relógio de parede no fuso e o UTC, no instante dado. */
function offsetMs(instant: number, tz: string): number {
  const w = wallClock(new Date(instant), tz);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

function toKey(year: number, month: number, day: number): DayKey {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** Converte a chave em ms UTC da meia-noite UTC daquele dia (aritmética de calendário pura). */
function keyToUtcMidnight(key: DayKey): number {
  const match = DAY_KEY_RE.exec(key);
  if (!match) throw new RangeError(`Dia inválido: "${key}" (esperado YYYY-MM-DD)`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(year, month - 1, day);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== year || back.getUTCMonth() !== month - 1 || back.getUTCDate() !== day) {
    throw new RangeError(`Dia inválido: "${key}"`);
  }
  return ms;
}

function utcMidnightToKey(ms: number): DayKey {
  const d = new Date(ms);
  return toKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Dia civil ("YYYY-MM-DD") do instante no fuso. */
export function dayKey(date: Date, tz: string = appTz()): DayKey {
  const w = wallClock(date, tz);
  return toKey(w.year, w.month, w.day);
}

/** Soma `days` (inteiro, pode ser negativo) a um dia. */
export function addDays(key: DayKey, days: number): DayKey {
  if (!Number.isInteger(days)) throw new RangeError(`Número de dias inválido: ${days}`);
  return utcMidnightToKey(keyToUtcMidnight(key) + days * DAY_MS);
}

/** Dia anterior. */
export function previousDayKey(key: DayKey): DayKey {
  return addDays(key, -1);
}

/** Dia da semana ISO: segunda = 1 ... domingo = 7. */
export function isoWeekday(key: DayKey): number {
  const weekday = new Date(keyToUtcMidnight(key)).getUTCDay(); // 0 = domingo
  return weekday === 0 ? 7 : weekday;
}

/**
 * Primeiro instante do dia no fuso. Normalmente a meia-noite local; se a meia-noite não existir
 * (horário de verão que começa à 00:00), o primeiro instante que já pertence ao dia.
 */
export function startOfDay(key: DayKey, tz: string = appTz()): Date {
  const wall = keyToUtcMidnight(key);
  const firstGuess = wall - offsetMs(wall, tz);
  const secondGuess = wall - offsetMs(firstGuess, tz);
  // Um dos dois palpites sempre cai no próprio dia; o menor deles é o início do dia.
  const candidates = [firstGuess, secondGuess].filter((t) => dayKey(new Date(t), tz) === key);
  return new Date(Math.min(...candidates));
}

/** Segunda-feira (chave) da semana que contém o instante, no fuso. */
export function startOfWeekKey(date: Date, tz: string = appTz()): DayKey {
  const key = dayKey(date, tz);
  return addDays(key, 1 - isoWeekday(key));
}

/** Início (segunda-feira 00:00 local) da semana que contém o instante. */
export function startOfWeek(date: Date, tz: string = appTz()): Date {
  return startOfDay(startOfWeekKey(date, tz), tz);
}

/** Hora local (0–23) do instante no fuso. */
export function hourInTz(date: Date, tz: string = appTz()): number {
  return wallClock(date, tz).hour;
}

/** Os últimos `n` dias terminando em `today` (inclusive), em ordem crescente. Heatmap = 84. */
export function lastNDays(n: number, today: DayKey): DayKey[] {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`n inválido: ${n}`);
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}
