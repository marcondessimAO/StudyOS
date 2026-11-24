/**
 * Dados de exemplo para desenvolvimento: 4 matérias e ~10 semanas de sessões realistas.
 * Rodar com `npm run db:seed`. APAGA sessões, coletas, conquistas e o perfil antes de popular.
 * Nunca roda com NODE_ENV=production.
 */
import { PrismaClient } from "@prisma/client";

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
const DAYS = 70;
const DAY_MS = 86_400_000;
// O seed usa o fuso fixo de São Paulo (UTC-3, sem horário de verão desde 2019).
const TZ_OFFSET_HOURS = 3;

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

const MULTIPLIER_TENTHS = [6, 8, 10, 12, 14];

interface SeedSession {
  subjectIndex: number;
  topic: string;
  kind: string;
  startedAt: Date;
  endedAt: Date;
  minutes: number;
  rating: number;
  summary: string;
  xp: number;
}

function buildSessions(now: Date): SeedSession[] {
  const todaySp = new Date(now.getTime() - TZ_OFFSET_HOURS * 3_600_000);
  const sessions: SeedSession[] = [];
  for (let back = DAYS - 1; back >= 0; back--) {
    const day = new Date(
      Date.UTC(todaySp.getUTCFullYear(), todaySp.getUTCMonth(), todaySp.getUTCDate()) - back * DAY_MS,
    );
    // Últimos 8 dias sempre com estudo (streak visível); antes disso, ~25% dos dias de folga.
    if (back >= 8 && random() < 0.25) continue;
    const hours = [...START_HOURS]
      .sort(() => random() - 0.5)
      .slice(0, int(1, 3))
      .sort((a, b) => a - b);
    let first = true;
    for (const hour of hours) {
      const minutes = int(15, 90);
      const startedAt = new Date(day.getTime() + (hour + TZ_OFFSET_HOURS) * 3_600_000 + int(0, 50) * 60_000);
      const endedAt = new Date(startedAt.getTime() + minutes * 60_000);
      if (endedAt > now) continue;
      const rating = pick([2, 3, 3, 4, 4, 4, 5, 5]);
      const subjectIndex = int(0, SUBJECTS.length - 1);
      // Mesma fórmula de docs/05-gamificacao.md (sem o sorteio do lucky_double).
      const xp = Math.round((minutes * MULTIPLIER_TENTHS[rating - 1]) / 10) + (first ? 20 : 0);
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
      first = false;
    }
  }
  return sessions;
}

async function main(): Promise<void> {
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

  const sessions = buildSessions(new Date());
  await prisma.studySession.createMany({
    data: sessions.map(({ subjectIndex, ...rest }) => ({ ...rest, subjectId: subjectIds[subjectIndex] })),
  });

  // TODO(T07): trocar pelo recálculo oficial (recomputeProfileFrom) quando ele existir.
  const xp = sessions.reduce((sum, s) => sum + s.xp, 0);
  await prisma.profile.create({ data: { id: 1, xp } });

  console.log(`seed: ${SUBJECTS.length} matérias, ${sessions.length} sessões, ${xp} XP.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
