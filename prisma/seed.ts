/**
 * Dados de exemplo para desenvolvimento: 4 matérias e ~10 semanas de sessões realistas.
 * Rodar com `npm run db:seed`. APAGA sessões, coletas, conquistas e o perfil antes de popular.
 * Nunca roda com NODE_ENV=production.
 */
import { PrismaClient } from "@prisma/client";
import {
  evaluateAchievements,
  nextStreak,
  sessionXp,
  type AchievementCode,
  type Rating,
  type StreakState,
} from "../src/lib/gamification";
import { recomputeProfile } from "../src/lib/profile";
import { addDays, appTz, dayKey, startOfDay } from "../src/lib/time";

if (process.env.NODE_ENV === "production") {
  console.error("seed: recusado com NODE_ENV=production (o seed apaga dados).");
  process.exit(1);
}

const prisma = new PrismaClient();

const SUBJECTS = [
  {
    name: "Backend",
    color: "#8B5CF6",
    weeklyGoal: 360,
    topics: ["Índices no PostgreSQL", "Transações e isolamento", "REST vs RPC", "Filas com Redis"],
  },
  {
    name: "Segurança",
    color: "#22C55E",
    weeklyGoal: 240,
    topics: ["OWASP Top 10: injeção", "JWT e sessões", "CSP e XSS", "Hash de senhas"],
  },
  {
    name: "Infra",
    color: "#3B82F6",
    weeklyGoal: 180,
    topics: ["Docker Compose: redes", "Caddy e HTTPS", "Backup do Postgres", "Logs e métricas"],
  },
  {
    name: "Faculdade",
    color: "#F97316",
    weeklyGoal: 300,
    topics: ["Engenharia de requisitos", "Estatística", "Banco de dados II", "Gestão de projetos"],
  },
] as const;

const KINDS = ["estudo", "leitura", "pratica", "revisao", "projeto"] as const;
const SUMMARIES = [
  "Entendi quando usar índice composto.",
  "Revisei os exemplos e anotei as dúvidas.",
  "Fiz os exercícios da lista até a metade.",
  "Montei um resumo com os pontos principais.",
  "",
];
const START_HOURS = [6, 8, 10, 14, 16, 19, 20, 21, 22];
const RATINGS: readonly Rating[] = [2, 3, 3, 4, 4, 4, 5, 5];
const DAYS = 70;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/** PRNG determinístico (mulberry32): o seed gera sempre os mesmos dados. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20261124);
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)];
const int = (min: number, max: number): number => min + Math.floor(random() * (max - min + 1));

interface SeedSession {
  subjectIndex: number;
  topic: string;
  kind: string;
  startedAt: Date;
  endedAt: Date;
  minutes: number;
  rating: Rating;
  summary: string;
  xp: number;
}

/** Sessões em ordem cronológica, com o XP calculado pelas regras oficiais (gamification.ts). */
function buildSessions(now: Date, tz: string): SeedSession[] {
  const today = dayKey(now, tz);
  const sessions: SeedSession[] = [];
  for (let back = DAYS - 1; back >= 0; back--) {
    // Últimos 8 dias sempre com estudo (streak visível); antes disso, ~25% dos dias de folga.
    if (back >= 8 && random() < 0.25) continue;
    const dayStart = startOfDay(addDays(today, -back), tz).getTime();
    const hours = [...START_HOURS]
      .sort(() => random() - 0.5)
      .slice(0, int(1, 3))
      .sort((a, b) => a - b);
    let isFirstOfDay = true;
    for (const hour of hours) {
      const minutes = int(15, 90);
      const startedAt = new Date(dayStart + hour * HOUR_MS + int(0, 50) * MINUTE_MS);
      const endedAt = new Date(startedAt.getTime() + minutes * MINUTE_MS);
      if (endedAt > now) continue;
      const rating = pick(RATINGS);
      const subjectIndex = int(0, SUBJECTS.length - 1);
      const xp = sessionXp({ minutes, rating, isFirstOfDay, random }).total;
      sessions.push({
        subjectIndex,
        topic: pick(SUBJECTS[subjectIndex].topics),
        kind: pick(KINDS),
        startedAt,
        endedAt,
        minutes,
        rating,
        summary: pick(SUMMARIES),
        xp,
      });
      isFirstOfDay = false;
    }
  }
  return sessions;
}

/** Conquistas como se cada sessão tivesse sido finalizada na ordem (unlockedAt = endedAt). */
function buildAchievements(sessions: readonly SeedSession[], tz: string) {
  const unlocked: { code: AchievementCode; unlockedAt: Date }[] = [];
  let streak: StreakState = { lastStudyDay: null, streak: 0, bestStreak: 0 };
  let totalMinutes = 0;
  sessions.forEach((session, i) => {
    totalMinutes += session.minutes;
    streak = nextStreak(streak, dayKey(session.endedAt, tz), session.minutes);
    const context = { totalSessions: i + 1, totalMinutes, streak: streak.streak, session };
    const codes = evaluateAchievements(
      context,
      unlocked.map((a) => a.code),
      tz,
    );
    unlocked.push(...codes.map((code) => ({ code, unlockedAt: session.endedAt })));
  });
  return unlocked;
}

async function main(): Promise<void> {
  const tz = appTz();
  await prisma.$transaction([
    prisma.studySession.deleteMany(),
    prisma.questClaim.deleteMany(),
    prisma.achievement.deleteMany(),
    prisma.profile.deleteMany(),
  ]);

  const subjectIds: number[] = [];
  for (const s of SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { name: s.name },
      update: { color: s.color, weeklyGoal: s.weeklyGoal },
      create: { name: s.name, color: s.color, weeklyGoal: s.weeklyGoal },
    });
    subjectIds.push(subject.id);
  }

  const sessions = buildSessions(new Date(), tz);
  await prisma.studySession.createMany({
    data: sessions.map(({ subjectIndex, ...rest }) => ({ ...rest, subjectId: subjectIds[subjectIndex] })),
  });
  const achievements = buildAchievements(sessions, tz);
  await prisma.achievement.createMany({ data: achievements });
  const profile = await recomputeProfile(prisma, tz);

  console.log(
    `seed: ${SUBJECTS.length} matérias, ${sessions.length} sessões, ${achievements.length} conquistas, ` +
      `${profile.xp} XP, streak ${profile.streak} (melhor ${profile.bestStreak}).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
