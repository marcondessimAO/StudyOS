import { describe, expect, it, vi } from "vitest";
import { recomputeProfile, type ProfileDb } from "./profile";

/** Banco falso com só o que recomputeProfile usa. */
function fakeDb(sessions: { endedAt: Date; minutes: number; xp: number }[], claims: { xp: number }[]) {
  const upsert = vi.fn(async (args: unknown) => args);
  const db = {
    studySession: { findMany: vi.fn(async () => sessions) },
    questClaim: { findMany: vi.fn(async () => claims) },
    profile: { upsert },
  };
  return { db: db as unknown as ProfileDb, upsert, raw: db };
}

describe("recomputeProfile", () => {
  it("lê sessões e coletas, calcula com a função pura e grava o Profile id=1", async () => {
    const { db, upsert, raw } = fakeDb(
      [
        { endedAt: new Date("2026-11-22T15:00:00Z"), minutes: 30, xp: 50 },
        { endedAt: new Date("2026-11-23T15:00:00Z"), minutes: 45, xp: 74 },
      ],
      [{ xp: 25 }],
    );

    const snapshot = await recomputeProfile(db, "America/Sao_Paulo");

    const expected = { xp: 149, streak: 2, bestStreak: 2, lastStudyDay: "2026-11-23" };
    expect(snapshot).toEqual(expected);
    expect(raw.studySession.findMany).toHaveBeenCalledWith({
      select: { endedAt: true, minutes: true, xp: true },
      orderBy: { endedAt: "asc" },
    });
    expect(raw.questClaim.findMany).toHaveBeenCalledWith({ select: { xp: true } });
    expect(upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      update: expected,
      create: { id: 1, ...expected },
    });
  });

  it("sem dados zera o perfil", async () => {
    const { db, upsert } = fakeDb([], []);
    await recomputeProfile(db, "UTC");
    const zero = { xp: 0, streak: 0, bestStreak: 0, lastStudyDay: null };
    expect(upsert).toHaveBeenCalledWith({ where: { id: 1 }, update: zero, create: { id: 1, ...zero } });
  });
});
