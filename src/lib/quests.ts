/**
 * Missões do dia (MVP): 3 missões fixas, progresso derivado das sessões do dia.
 * Fonte da verdade: seção "Missões do dia" de docs/05-gamificacao.md. Funções puras, sem banco.
 */

export type QuestCode = "study_30" | "two_summaries" | "quality_session";
export type QuestStatus = "in_progress" | "claimable" | "claimed";

export interface QuestDef {
  code: QuestCode;
  title: string;
  xp: number;
  target: number;
}

/** O que importa de uma sessão do dia para as missões. */
export interface QuestSession {
  minutes: number;
  rating: number;
  summary: string;
}

export interface QuestClaimLike {
  code: string;
}

export interface QuestItem extends QuestDef {
  progress: number;
  status: QuestStatus;
}

export type ClaimError = "unknown_quest" | "already_claimed" | "not_complete";

const QUALITY_MIN_MINUTES = 25;
const QUALITY_MIN_RATING = 4;

// Títulos iguais ao contrato de docs/04-api.md (GET /api/quests).
export const QUESTS: readonly QuestDef[] = [
  { code: "study_30", title: "Estudar 30 min hoje", xp: 25, target: 30 },
  { code: "two_summaries", title: "Escrever 2 resumos", xp: 15, target: 2 },
  { code: "quality_session", title: "Sessão de qualidade (25 min, nota 4+)", xp: 30, target: 1 },
];

const PROGRESS: Record<QuestCode, (sessions: readonly QuestSession[]) => number> = {
  study_30: (sessions) => sessions.reduce((sum, s) => sum + s.minutes, 0),
  two_summaries: (sessions) => sessions.filter((s) => s.summary.trim() !== "").length,
  quality_session: (sessions) =>
    sessions.filter((s) => s.minutes >= QUALITY_MIN_MINUTES && s.rating >= QUALITY_MIN_RATING).length,
};

function findQuest(code: string): QuestDef | undefined {
  return QUESTS.find((q) => q.code === code);
}

function isClaimed(code: string, claims: readonly QuestClaimLike[]): boolean {
  return claims.some((c) => c.code === code);
}

/** Progresso e status das 3 missões, dadas as sessões e as coletas do dia. */
export function questProgress(
  sessionsOfDay: readonly QuestSession[],
  claimsOfDay: readonly QuestClaimLike[],
): QuestItem[] {
  return QUESTS.map((quest) => {
    const progress = PROGRESS[quest.code](sessionsOfDay);
    let status: QuestStatus = progress >= quest.target ? "claimable" : "in_progress";
    if (isClaimed(quest.code, claimsOfDay)) status = "claimed";
    return { ...quest, progress, status };
  });
}

/** Motivo para recusar a coleta, ou null se pode coletar. A API mapeia para 404/409/400. */
export function claimError(
  code: string,
  progress: number,
  claims: readonly QuestClaimLike[],
): ClaimError | null {
  const quest = findQuest(code);
  if (!quest) return "unknown_quest";
  if (isClaimed(code, claims)) return "already_claimed";
  if (progress < quest.target) return "not_complete";
  return null;
}

export function canClaim(code: string, progress: number, claims: readonly QuestClaimLike[]): boolean {
  return claimError(code, progress, claims) === null;
}

/** Missões que passaram a ficar coletáveis com a nova sessão (reward.questsCompleted). */
export function questsCompletedBy(
  sessionsBefore: readonly QuestSession[],
  sessionsAfter: readonly QuestSession[],
  claimsOfDay: readonly QuestClaimLike[],
): QuestCode[] {
  const before = questProgress(sessionsBefore, claimsOfDay);
  const after = questProgress(sessionsAfter, claimsOfDay);
  return after
    .filter((item, i) => item.status === "claimable" && before[i].status === "in_progress")
    .map((item) => item.code);
}
