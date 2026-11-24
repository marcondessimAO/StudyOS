import type { Prisma } from "@prisma/client";
import { recomputeProfileFrom, type ProfileSnapshot } from "./gamification";
import { appTz } from "./time";

/** PrismaClient ou o cliente de uma transação ($transaction(async (tx) => ...)). */
export type ProfileDb = Pick<Prisma.TransactionClient, "studySession" | "questClaim" | "profile">;

const PROFILE_ID = 1;

/**
 * Recalcula o Profile do zero a partir das sessões e coletas (ADR-0004) e grava o resultado.
 * Chamar após editar a nota, excluir ou mover sessão e após excluir matéria.
 */
export async function recomputeProfile(db: ProfileDb, tz: string = appTz()): Promise<ProfileSnapshot> {
  const [sessions, claims] = await Promise.all([
    db.studySession.findMany({
      select: { endedAt: true, minutes: true, xp: true },
      orderBy: { endedAt: "asc" },
    }),
    db.questClaim.findMany({ select: { xp: true } }),
  ]);
  const snapshot = recomputeProfileFrom(sessions, claims, tz);
  await db.profile.upsert({
    where: { id: PROFILE_ID },
    update: snapshot,
    create: { id: PROFILE_ID, ...snapshot },
  });
  return snapshot;
}
