import { describe, expect, it, vi } from "vitest";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  levelFromXp,
  nextStreak,
  progressInLevel,
  sessionXp,
  xpForLevel,
  xpToNext,
  type AchievementCode,
  type AchievementContext,
} from "./gamification";

const SP = "America/Sao_Paulo";
const noLuck = () => 0.99;

describe("sessionXp", () => {
  it("exemplo do doc 05: 60 min, nota 4, primeira do dia = 92 XP", () => {
    const xp = sessionXp({ minutes: 60, rating: 4, isFirstOfDay: true, random: noLuck });
    expect(xp).toEqual({
      base: 72,
      multiplier: 1.2,
      bonuses: [{ code: "first_of_day", xp: 20 }],
      total: 92,
    });
  });

  it("exemplo do doc 04: 63 min, nota 4, primeira do dia = 96 XP (76 + 20)", () => {
    const xp = sessionXp({ minutes: 63, rating: 4, isFirstOfDay: true, random: noLuck });
    expect(xp.base).toBe(76);
    expect(xp.total).toBe(96);
  });

  it.each([
    [1, 0.6, 30],
    [2, 0.8, 40],
    [3, 1.0, 50],
    [4, 1.2, 60],
    [5, 1.4, 70],
  ] as const)("nota %i usa multiplicador %d (50 min → %i XP)", (rating, multiplier, base) => {
    const xp = sessionXp({ minutes: 50, rating, isFirstOfDay: false, random: noLuck });
    expect(xp).toEqual({ base, multiplier, bonuses: [], total: base });
  });

  it("arredonda o XP base (13 min × 0.6 = 7.8 → 8; 7 min × 1.4 = 9.8 → 10)", () => {
    expect(sessionXp({ minutes: 13, rating: 1, isFirstOfDay: false, random: noLuck }).base).toBe(8);
    expect(sessionXp({ minutes: 7, rating: 5, isFirstOfDay: false, random: noLuck }).base).toBe(10);
  });

  it("lucky_double dobra o XP base em sessão de 25+ min quando o sorteio sai (< 0.1)", () => {
    const xp = sessionXp({ minutes: 25, rating: 3, isFirstOfDay: true, random: () => 0.05 });
    expect(xp.bonuses).toEqual([
      { code: "first_of_day", xp: 20 },
      { code: "lucky_double", xp: 25 },
    ]);
    expect(xp.total).toBe(25 + 20 + 25);
  });

  it("lucky_double não sai com sorteio >= 0.1", () => {
    const xp = sessionXp({ minutes: 60, rating: 3, isFirstOfDay: false, random: () => 0.1 });
    expect(xp.bonuses).toEqual([]);
  });

  it("sessão com menos de 25 min nem sorteia", () => {
    const random = vi.fn(() => 0);
    const xp = sessionXp({ minutes: 24, rating: 5, isFirstOfDay: false, random });
    expect(random).not.toHaveBeenCalled();
    expect(xp.bonuses).toEqual([]);
  });

  it("usa Math.random quando o sorteio não é injetado", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    expect(sessionXp({ minutes: 30, rating: 3, isFirstOfDay: false }).total).toBe(60);
    spy.mockRestore();
  });

  it("rejeita nota ou minutos inválidos", () => {
    // @ts-expect-error nota fora de 1..5
    expect(() => sessionXp({ minutes: 30, rating: 6, isFirstOfDay: false })).toThrow(RangeError);
    expect(() => sessionXp({ minutes: -1, rating: 3, isFirstOfDay: false })).toThrow(RangeError);
    expect(() => sessionXp({ minutes: 1.5, rating: 3, isFirstOfDay: false })).toThrow(RangeError);
  });
});

describe("nível", () => {
  it("XP total para cada nível segue 50·L·(L−1) (tabela do doc)", () => {
    expect([1, 2, 3, 4, 5, 6, 10].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000, 1500, 4500]);
  });

  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [299, 2],
    [300, 3],
    [999, 4],
    [1000, 5],
    [1499, 5],
    [1500, 6],
    [4499, 9],
    [4500, 10],
    [980, 4],
    [1076, 5],
  ])("%i XP = nível %i", (xp, level) => {
    expect(levelFromXp(xp)).toBe(level);
  });

  it("é consistente com xpForLevel em níveis altos (sem erro de ponto flutuante)", () => {
    expect(levelFromXp(xpForLevel(1))).toBe(1);
    for (let level = 2; level <= 500; level++) {
      expect(levelFromXp(xpForLevel(level))).toBe(level);
      expect(levelFromXp(xpForLevel(level) - 1)).toBe(level - 1);
    }
  });

  it("xpToNext = 50·(level+1)·level − xp", () => {
    expect(xpToNext(0)).toBe(100);
    expect(xpToNext(99)).toBe(1);
    expect(xpToNext(100)).toBe(200);
    expect(xpToNext(1250)).toBe(250);
  });

  it("progressInLevel devolve o progresso dentro do nível", () => {
    expect(progressInLevel(0)).toEqual({ level: 1, current: 0, needed: 100, fraction: 0 });
    expect(progressInLevel(150)).toEqual({ level: 2, current: 50, needed: 200, fraction: 0.25 });
    expect(progressInLevel(999)).toEqual({ level: 4, current: 399, needed: 400, fraction: 399 / 400 });
    expect(progressInLevel(1000)).toEqual({ level: 5, current: 0, needed: 500, fraction: 0 });
  });

  it("rejeita valores inválidos", () => {
    expect(() => levelFromXp(-1)).toThrow(RangeError);
    expect(() => xpForLevel(0)).toThrow(RangeError);
    expect(() => xpForLevel(2.5)).toThrow(RangeError);
  });
});

describe("nextStreak", () => {
  const empty = { lastStudyDay: null, streak: 0, bestStreak: 0 };

  it("primeira sessão válida começa o streak em 1", () => {
    expect(nextStreak(empty, "2026-11-24", 30)).toEqual({
      lastStudyDay: "2026-11-24",
      streak: 1,
      bestStreak: 1,
    });
  });

  it("estudou hoje e lastStudyDay é ontem → streak + 1 (atravessando mês)", () => {
    const state = { lastStudyDay: "2026-11-30", streak: 7, bestStreak: 7 };
    expect(nextStreak(state, "2026-12-01", 10)).toEqual({
      lastStudyDay: "2026-12-01",
      streak: 8,
      bestStreak: 8,
    });
  });

  it("estudou hoje e lastStudyDay é hoje → inalterado", () => {
    const state = { lastStudyDay: "2026-11-24", streak: 3, bestStreak: 5 };
    expect(nextStreak(state, "2026-11-24", 60)).toEqual(state);
  });

  it("qualquer outro caso reinicia em 1 e preserva bestStreak", () => {
    const state = { lastStudyDay: "2026-11-20", streak: 12, bestStreak: 12 };
    expect(nextStreak(state, "2026-11-24", 30)).toEqual({
      lastStudyDay: "2026-11-24",
      streak: 1,
      bestStreak: 12,
    });
  });

  it("sessão com menos de 10 min não conta para o streak", () => {
    const state = { lastStudyDay: "2026-11-23", streak: 4, bestStreak: 6 };
    expect(nextStreak(state, "2026-11-24", 9)).toEqual(state);
    expect(nextStreak(empty, "2026-11-24", 9)).toEqual(empty);
  });

  it("sessão de exatamente 10 min conta", () => {
    expect(nextStreak(empty, "2026-11-24", 10).streak).toBe(1);
  });

  it("sessão de um dia anterior ao lastStudyDay não mexe no streak (o recálculo corrige)", () => {
    const state = { lastStudyDay: "2026-11-24", streak: 3, bestStreak: 3 };
    expect(nextStreak(state, "2026-11-20", 60)).toEqual(state);
  });

  it("não muta o estado recebido", () => {
    const state = Object.freeze({ lastStudyDay: "2026-11-23", streak: 1, bestStreak: 1 });
    expect(() => nextStreak(state, "2026-11-24", 30)).not.toThrow();
    expect(state.streak).toBe(1);
  });
});

describe("conquistas", () => {
  // Sessão neutra: 30 min, nota 3, das 14:00 às 14:30 em SP.
  const neutral = {
    startedAt: new Date("2026-11-24T17:00:00Z"),
    endedAt: new Date("2026-11-24T17:30:00Z"),
    minutes: 30,
    rating: 3,
  };
  const ctx = (over: Partial<AchievementContext> = {}): AchievementContext => ({
    totalSessions: 2,
    totalMinutes: 60,
    streak: 1,
    session: neutral,
    ...over,
  });
  // Por padrão first_session já foi desbloqueada (o contexto neutro tem 2 sessões).
  const evalOne = (over: Partial<AchievementContext>, unlocked: AchievementCode[] = ["first_session"]) =>
    evaluateAchievements(ctx(over), unlocked, SP);

  it("catálogo tem os 10 códigos do doc com nome, descrição e ícone curto", () => {
    expect(ACHIEVEMENTS.map((a) => a.code)).toEqual([
      "first_session",
      "streak_3",
      "streak_7",
      "streak_30",
      "hours_10",
      "hours_50",
      "hours_100",
      "early_bird",
      "night_owl",
      "perfect_focus",
    ]);
    for (const a of ACHIEVEMENTS) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(a.icon.length).toBeLessThanOrEqual(4);
    }
    expect(ACHIEVEMENTS.find((a) => a.code === "streak_7")?.icon).toBe("7D");
  });

  it("sessão neutra que não é a primeira não desbloqueia nada", () => {
    expect(evalOne({})).toEqual([]);
  });

  it("first_session: completar a primeira sessão", () => {
    expect(evalOne({ totalSessions: 1 }, [])).toEqual(["first_session"]);
    expect(evalOne({ totalSessions: 0 }, [])).toEqual([]);
  });

  it.each([
    ["streak_3", 3, 2],
    ["streak_7", 7, 6],
    ["streak_30", 30, 29],
  ] as const)("%s com streak %i (não com %i)", (code, hit, miss) => {
    expect(evalOne({ streak: hit })).toContain(code);
    expect(evalOne({ streak: miss })).not.toContain(code);
  });

  it.each([
    ["hours_10", 600],
    ["hours_50", 3000],
    ["hours_100", 6000],
  ] as const)("%s com %i min acumulados", (code, minutes) => {
    expect(evalOne({ totalMinutes: minutes })).toContain(code);
    expect(evalOne({ totalMinutes: minutes - 1 })).not.toContain(code);
  });

  it("early_bird: sessão iniciada antes das 07:00 no fuso do app", () => {
    const at = (iso: string) => ({ ...neutral, startedAt: new Date(iso) });
    expect(evalOne({ session: at("2026-11-24T09:59:00Z") })).toEqual(["early_bird"]); // 06:59 SP
    expect(evalOne({ session: at("2026-11-24T10:00:00Z") })).toEqual([]); // 07:00 SP
    expect(evalOne({ session: at("2026-11-24T05:00:00Z") })).toEqual(["early_bird"]); // 02:00 SP
  });

  it("night_owl: sessão encerrada depois das 23:00 no fuso do app", () => {
    const at = (iso: string) => ({ ...neutral, endedAt: new Date(iso) });
    expect(evalOne({ session: at("2026-11-25T02:00:00Z") })).toEqual(["night_owl"]); // 23:00 SP
    expect(evalOne({ session: at("2026-11-25T02:59:00Z") })).toEqual(["night_owl"]); // 23:59 SP
    expect(evalOne({ session: at("2026-11-25T01:59:00Z") })).toEqual([]); // 22:59 SP
    // 23:30 em UTC é 20:30 em SP: não conta.
    expect(evalOne({ session: at("2026-11-24T23:30:00Z") })).toEqual([]);
  });

  it("perfect_focus: 45 min ou mais com nota 5", () => {
    expect(evalOne({ session: { ...neutral, minutes: 45, rating: 5 } })).toEqual(["perfect_focus"]);
    expect(evalOne({ session: { ...neutral, minutes: 44, rating: 5 } })).toEqual([]);
    expect(evalOne({ session: { ...neutral, minutes: 90, rating: 4 } })).toEqual([]);
  });

  it("não devolve conquistas já desbloqueadas e mantém a ordem do catálogo", () => {
    const over = { totalSessions: 1, streak: 7, totalMinutes: 700 };
    expect(evalOne(over, [])).toEqual(["first_session", "streak_3", "streak_7", "hours_10"]);
    expect(evalOne(over, ["first_session", "streak_3"])).toEqual(["streak_7", "hours_10"]);
  });

  it("sem sessão no contexto (ex.: recálculo) avalia só totais e streak", () => {
    expect(evaluateAchievements({ totalSessions: 5, totalMinutes: 0, streak: 3 }, new Set(), SP)).toEqual([
      "first_session",
      "streak_3",
    ]);
  });

  it("usa APP_TZ por padrão", () => {
    vi.stubEnv("APP_TZ", "UTC");
    const session = { ...neutral, startedAt: new Date("2026-11-24T09:59:00Z") }; // 09:59 UTC
    expect(evaluateAchievements(ctx({ session }), ["first_session"])).toEqual([]);
    vi.unstubAllEnvs();
  });
});
