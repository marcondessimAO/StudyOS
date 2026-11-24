import { describe, expect, it, vi } from "vitest";
import {
  nextStreak,
  recomputeProfileFrom,
  sessionXp,
  type ProfileSnapshot,
  type Rating,
  type RecomputeSession,
} from "./gamification";
import { dayKey } from "./time";

const SP = "America/Sao_Paulo";
const MIN = 60_000;

/** Sessão terminando no instante ISO dado. */
const at = (endedIso: string, minutes = 30, xp = 10): RecomputeSession => ({
  endedAt: new Date(endedIso),
  minutes,
  xp,
});

describe("recomputeProfileFrom", () => {
  it("sem sessões nem coletas: perfil zerado", () => {
    expect(recomputeProfileFrom([], [], SP)).toEqual({ xp: 0, streak: 0, bestStreak: 0, lastStudyDay: null });
  });

  it("XP = soma do XP das sessões + soma do XP das coletas", () => {
    const sessions = [at("2026-11-20T15:00:00Z", 30, 56), at("2026-11-21T15:00:00Z", 5, 3)];
    expect(recomputeProfileFrom(sessions, [{ xp: 25 }, { xp: 15 }], SP).xp).toBe(56 + 3 + 25 + 15);
  });

  it("streak e bestStreak pela sequência de dias com sessões válidas (≥ 10 min)", () => {
    const sessions = [
      at("2026-11-01T15:00:00Z"),
      at("2026-11-02T15:00:00Z"),
      at("2026-11-02T20:00:00Z"),
      at("2026-11-03T15:00:00Z"),
      // 04/11 sem estudo
      at("2026-11-05T15:00:00Z"),
      at("2026-11-06T15:00:00Z"),
      at("2026-11-07T15:00:00Z", 9), // < 10 min: não conta para o streak
    ];
    expect(recomputeProfileFrom(sessions, [], SP)).toEqual({
      xp: 70,
      streak: 2,
      bestStreak: 3,
      lastStudyDay: "2026-11-06",
    });
  });

  it("ordem de entrada não importa (ordena por endedAt sem mutar a lista)", () => {
    const ordered = [at("2026-11-01T15:00:00Z"), at("2026-11-02T15:00:00Z"), at("2026-11-03T15:00:00Z")];
    const shuffled = Object.freeze([ordered[2], ordered[0], ordered[1]]);
    expect(recomputeProfileFrom(shuffled, [], SP)).toEqual(recomputeProfileFrom(ordered, [], SP));
    expect(shuffled[0]).toBe(ordered[2]);
  });

  it("o dia de estudo é o dia de endedAt no fuso do app", () => {
    // Em SP: 23:30 de 01/11 e 22:00 de 02/11. Em UTC: 02:30 de 02/11 e 01:00 de 03/11.
    const sessions = [at("2026-11-02T02:30:00Z"), at("2026-11-03T01:00:00Z")];
    expect(recomputeProfileFrom(sessions, [], SP)).toMatchObject({ streak: 2, lastStudyDay: "2026-11-02" });
    expect(recomputeProfileFrom(sessions, [], "UTC")).toMatchObject({
      streak: 2,
      lastStudyDay: "2026-11-03",
    });
  });

  it("usa APP_TZ por padrão", () => {
    vi.stubEnv("APP_TZ", "UTC");
    expect(recomputeProfileFrom([at("2026-11-02T02:30:00Z")], []).lastStudyDay).toBe("2026-11-02");
    vi.stubEnv("APP_TZ", SP);
    expect(recomputeProfileFrom([at("2026-11-02T02:30:00Z")], []).lastStudyDay).toBe("2026-11-01");
    vi.unstubAllEnvs();
  });
});

// ------------------------------------------------------------- propriedade

/** PRNG determinístico (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Scenario {
  sessions: RecomputeSession[];
  claims: { xp: number }[];
  incremental: ProfileSnapshot;
}

/** Gera sessões em ordem cronológica e aplica cada uma de forma incremental, como a API fará. */
function buildScenario(seed: number, tz: string): Scenario {
  const random = mulberry32(seed);
  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const count = int(0, 80);
  let clock = Date.UTC(2026, 0, 1, 12) + int(0, 1440) * MIN;
  const daysSeen = new Set<string>();
  const sessions: RecomputeSession[] = [];
  const claims: { xp: number }[] = [];
  let state: ProfileSnapshot = { xp: 0, streak: 0, bestStreak: 0, lastStudyDay: null };

  for (let i = 0; i < count; i++) {
    // Intervalo entre sessões: de 10 min a ~3 dias (gera dias seguidos, repetidos e buracos).
    clock += int(10, 4320) * MIN;
    const minutes = int(1, 150);
    const endedAt = new Date(clock + minutes * MIN);
    clock = endedAt.getTime();
    const day = dayKey(endedAt, tz);
    const isFirstOfDay = !daysSeen.has(day);
    daysSeen.add(day);
    const gained = sessionXp({ minutes, rating: int(1, 5) as Rating, isFirstOfDay, random });
    sessions.push({ endedAt, minutes, xp: gained.total });
    const streak = nextStreak(state, day, minutes);
    state = { ...streak, xp: state.xp + gained.total };
    if (random() < 0.3) {
      const claimXp = [25, 15, 30][int(0, 2)];
      claims.push({ xp: claimXp });
      state = { ...state, xp: state.xp + claimXp };
    }
  }
  return { sessions, claims, incremental: state };
}

function shuffle<T>(list: readonly T[], random: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

describe("propriedade: incremental == recálculo do zero", () => {
  const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i * 7919);

  it.each(SEEDS)("seed %i em America/Sao_Paulo", (seed) => {
    const { sessions, claims, incremental } = buildScenario(seed, SP);
    expect(recomputeProfileFrom(sessions, claims, SP)).toEqual(incremental);
    const shuffled = shuffle(sessions, mulberry32(seed + 1));
    expect(recomputeProfileFrom(shuffled, claims, SP)).toEqual(incremental);
  });

  it.each(SEEDS.slice(0, 10))("seed %i em UTC", (seed) => {
    const { sessions, claims, incremental } = buildScenario(seed, "UTC");
    expect(recomputeProfileFrom(sessions, claims, "UTC")).toEqual(incremental);
  });

  it("os cenários gerados exercitam streaks longos, reinícios e sessões curtas", () => {
    const all = SEEDS.map((seed) => buildScenario(seed, SP));
    expect(Math.max(...all.map((s) => s.incremental.bestStreak))).toBeGreaterThanOrEqual(5);
    expect(all.some((s) => s.incremental.streak < s.incremental.bestStreak)).toBe(true);
    expect(all.some((s) => s.sessions.some((x) => x.minutes < 10))).toBe(true);
    expect(all.some((s) => s.sessions.length > 50)).toBe(true);
  });
});
