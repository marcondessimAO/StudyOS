import { describe, expect, it } from "vitest";
import { QUESTS, canClaim, claimError, questProgress, questsCompletedBy, type QuestSession } from "./quests";

const s = (minutes: number, rating = 3, summary = ""): QuestSession => ({ minutes, rating, summary });
const byCode = (items: ReturnType<typeof questProgress>) => Object.fromEntries(items.map((i) => [i.code, i]));

describe("QUESTS", () => {
  it("tem as 3 missões fixas do doc, com XP e meta", () => {
    expect(QUESTS).toEqual([
      { code: "study_30", title: "Estudar 30 min hoje", xp: 25, target: 30 },
      { code: "two_summaries", title: "Escrever 2 resumos", xp: 15, target: 2 },
      { code: "quality_session", title: "Sessão de qualidade (25 min, nota 4+)", xp: 30, target: 1 },
    ]);
  });
});

describe("questProgress", () => {
  it("dia sem sessões: tudo em andamento com progresso 0", () => {
    const items = questProgress([], []);
    expect(items.map((i) => [i.code, i.progress, i.status])).toEqual([
      ["study_30", 0, "in_progress"],
      ["two_summaries", 0, "in_progress"],
      ["quality_session", 0, "in_progress"],
    ]);
    expect(items[0]).toEqual({
      code: "study_30",
      title: "Estudar 30 min hoje",
      xp: 25,
      progress: 0,
      target: 30,
      status: "in_progress",
    });
  });

  it("study_30 soma os minutos do dia e não limita o progresso à meta (contrato do doc 04)", () => {
    expect(byCode(questProgress([s(20), s(9)], [])).study_30).toMatchObject({
      progress: 29,
      status: "in_progress",
    });
    expect(byCode(questProgress([s(20), s(10)], [])).study_30).toMatchObject({
      progress: 30,
      status: "claimable",
    });
    expect(byCode(questProgress([s(60), s(35)], [])).study_30).toMatchObject({
      progress: 95,
      status: "claimable",
    });
  });

  it("two_summaries conta sessões com resumo não vazio (só espaços não conta)", () => {
    const one = questProgress([s(30, 3, "Resumo"), s(30, 3, "   "), s(30)], []);
    expect(byCode(one).two_summaries).toMatchObject({ progress: 1, status: "in_progress" });
    const two = questProgress([s(30, 3, "A"), s(5, 1, "B")], []);
    expect(byCode(two).two_summaries).toMatchObject({ progress: 2, status: "claimable" });
  });

  it("quality_session exige 25+ min E nota 4+ na mesma sessão", () => {
    expect(byCode(questProgress([s(25, 4)], [])).quality_session).toMatchObject({
      progress: 1,
      status: "claimable",
    });
    expect(byCode(questProgress([s(24, 5)], [])).quality_session.progress).toBe(0);
    expect(byCode(questProgress([s(90, 3)], [])).quality_session.progress).toBe(0);
    expect(byCode(questProgress([s(30, 5), s(40, 4)], [])).quality_session.progress).toBe(2);
  });

  it("coletada fica 'claimed' mesmo se o progresso caiu depois (sessão excluída)", () => {
    const items = byCode(questProgress([s(10)], [{ code: "study_30" }]));
    expect(items.study_30).toMatchObject({ progress: 10, status: "claimed" });
  });

  it("ignora coletas com códigos desconhecidos", () => {
    const items = questProgress([], [{ code: "foo" }]);
    expect(items.every((i) => i.status === "in_progress")).toBe(true);
  });

  it("não muta as listas recebidas", () => {
    const sessions = Object.freeze([Object.freeze(s(30, 5, "x"))]);
    const claims = Object.freeze([Object.freeze({ code: "study_30" })]);
    expect(() => questProgress(sessions, claims)).not.toThrow();
  });
});

describe("canClaim e claimError", () => {
  it("pode coletar missão completa e ainda não coletada", () => {
    expect(canClaim("study_30", 30, [])).toBe(true);
    expect(claimError("study_30", 30, [])).toBeNull();
  });

  it("não pode coletar missão incompleta (400 na API)", () => {
    expect(canClaim("study_30", 29, [])).toBe(false);
    expect(claimError("study_30", 29, [])).toBe("not_complete");
  });

  it("não pode coletar duas vezes no mesmo dia (409 na API)", () => {
    expect(canClaim("two_summaries", 2, [{ code: "two_summaries" }])).toBe(false);
    expect(claimError("two_summaries", 2, [{ code: "two_summaries" }])).toBe("already_claimed");
  });

  it("código inexistente (404 na API)", () => {
    expect(canClaim("nope", 999, [])).toBe(false);
    expect(claimError("nope", 999, [])).toBe("unknown_quest");
  });
});

describe("questsCompletedBy", () => {
  it("lista as missões que passaram a ficar coletáveis com a nova sessão", () => {
    const before = [s(20, 3, "a")];
    const after = [...before, s(25, 4, "b")];
    expect(questsCompletedBy(before, after, [])).toEqual(["study_30", "two_summaries", "quality_session"]);
  });

  it("não lista missões que já estavam coletáveis ou já foram coletadas", () => {
    const before = [s(40, 3, "a")];
    const after = [...before, s(30, 4, "b")];
    expect(questsCompletedBy(before, after, [{ code: "two_summaries" }])).toEqual(["quality_session"]);
  });

  it("sessão que não completa nada devolve lista vazia", () => {
    expect(questsCompletedBy([], [s(5)], [])).toEqual([]);
  });
});
