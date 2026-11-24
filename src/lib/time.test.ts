import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  appTz,
  dayKey,
  hourInTz,
  isoWeekday,
  lastNDays,
  previousDayKey,
  startOfDay,
  startOfWeek,
  startOfWeekKey,
} from "./time";

const SP = "America/Sao_Paulo";
const NY = "America/New_York";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("appTz", () => {
  it("usa APP_TZ quando definido", () => {
    vi.stubEnv("APP_TZ", "UTC");
    expect(appTz()).toBe("UTC");
  });

  it("cai para America/Sao_Paulo quando APP_TZ não existe ou está vazio", () => {
    vi.stubEnv("APP_TZ", "");
    expect(appTz()).toBe(SP);
    vi.stubEnv("APP_TZ", undefined);
    expect(appTz()).toBe(SP);
  });
});

describe("dayKey", () => {
  it("vira o dia à meia-noite de São Paulo, não à meia-noite UTC", () => {
    const lateNightSp = new Date("2026-11-24T02:30:00Z"); // 23:30 de 23/11 em SP
    expect(dayKey(lateNightSp, SP)).toBe("2026-11-23");
    expect(dayKey(lateNightSp, "UTC")).toBe("2026-11-24");
    expect(dayKey(new Date("2026-11-24T03:00:00Z"), SP)).toBe("2026-11-24");
    expect(dayKey(new Date("2026-11-24T02:59:59.999Z"), SP)).toBe("2026-11-23");
  });

  it("usa o fuso de APP_TZ por padrão", () => {
    vi.stubEnv("APP_TZ", "UTC");
    expect(dayKey(new Date("2026-11-24T02:30:00Z"))).toBe("2026-11-24");
    vi.stubEnv("APP_TZ", SP);
    expect(dayKey(new Date("2026-11-24T02:30:00Z"))).toBe("2026-11-23");
  });

  it("sessão que atravessa a meia-noite conta no dia do fim (endedAt)", () => {
    const startedAt = new Date("2026-11-24T02:40:00Z"); // 23:40 de 23/11 em SP
    const endedAt = new Date("2026-11-24T03:20:00Z"); // 00:20 de 24/11 em SP
    expect(dayKey(startedAt, SP)).toBe("2026-11-23");
    expect(dayKey(endedAt, SP)).toBe("2026-11-24");
  });

  it("lida com 29 de fevereiro em ano bissexto", () => {
    expect(dayKey(new Date("2024-02-29T12:00:00Z"), SP)).toBe("2024-02-29");
    expect(dayKey(new Date("2024-03-01T02:00:00Z"), SP)).toBe("2024-02-29");
  });
});

describe("previousDayKey e addDays", () => {
  it("volta um dia, atravessando mês e ano", () => {
    expect(previousDayKey("2026-11-24")).toBe("2026-11-23");
    expect(previousDayKey("2026-03-01")).toBe("2026-02-28");
    expect(previousDayKey("2026-01-01")).toBe("2025-12-31");
  });

  it("respeita o ano bissexto", () => {
    expect(previousDayKey("2024-03-01")).toBe("2024-02-29");
    expect(previousDayKey("2000-03-01")).toBe("2000-02-29");
    expect(previousDayKey("1900-03-01")).toBe("1900-02-28");
  });

  it("addDays anda para frente e para trás", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-28", 2)).toBe("2024-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-24", -7)).toBe("2026-11-17");
    expect(addDays("2026-11-24", 0)).toBe("2026-11-24");
  });

  it("rejeita chaves de dia inválidas", () => {
    expect(() => previousDayKey("2026-2-1")).toThrow(RangeError);
    expect(() => previousDayKey("2026-02-30")).toThrow(RangeError);
    expect(() => previousDayKey("2025-02-29")).toThrow(RangeError);
    expect(() => previousDayKey("ontem")).toThrow(RangeError);
    expect(() => addDays("2026-11-24", 1.5)).toThrow(RangeError);
  });
});

describe("startOfDay", () => {
  it("devolve o instante da meia-noite local", () => {
    expect(startOfDay("2026-11-24", SP).toISOString()).toBe("2026-11-24T03:00:00.000Z");
    expect(startOfDay("2026-11-24", "UTC").toISOString()).toBe("2026-11-24T00:00:00.000Z");
    expect(startOfDay("2024-02-29", SP).toISOString()).toBe("2024-02-29T03:00:00.000Z");
  });

  it("usa APP_TZ por padrão", () => {
    vi.stubEnv("APP_TZ", "UTC");
    expect(startOfDay("2026-11-24").toISOString()).toBe("2026-11-24T00:00:00.000Z");
  });

  it("no início do horário de verão sem meia-noite (SP 2018) devolve o primeiro instante do dia", () => {
    // Em 04/11/2018 o relógio de SP pulou de 00:00 para 01:00 (-03 → -02).
    const start = startOfDay("2018-11-04", SP);
    expect(start.toISOString()).toBe("2018-11-04T03:00:00.000Z");
    expect(dayKey(start, SP)).toBe("2018-11-04");
    expect(dayKey(new Date(start.getTime() - 1), SP)).toBe("2018-11-03");
  });

  it("no fim do horário de verão (SP 2019) a meia-noite é a do novo offset", () => {
    // Em 17/02/2019 às 00:00 (-02) o relógio voltou para 23:00 de 16/02 (-03).
    const start = startOfDay("2019-02-17", SP);
    expect(start.toISOString()).toBe("2019-02-17T03:00:00.000Z");
    expect(dayKey(new Date(start.getTime() - 1), SP)).toBe("2019-02-16");
  });

  it("dia com transição fora da meia-noite (Nova York) mantém a meia-noite", () => {
    expect(startOfDay("2026-03-08", NY).toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(startOfDay("2026-03-09", NY).toISOString()).toBe("2026-03-09T04:00:00.000Z");
  });
});

describe("startOfWeek", () => {
  it("a semana começa na segunda-feira", () => {
    const sunday = new Date("2026-11-29T15:00:00Z"); // domingo 12:00 em SP
    expect(startOfWeekKey(sunday, SP)).toBe("2026-11-23");
    expect(startOfWeek(sunday, SP).toISOString()).toBe("2026-11-23T03:00:00.000Z");
  });

  it("segunda-feira logo após a meia-noite já é a nova semana", () => {
    const mondayEarly = new Date("2026-11-30T03:30:00Z"); // segunda 00:30 em SP
    expect(startOfWeekKey(mondayEarly, SP)).toBe("2026-11-30");
  });

  it("domingo à noite em SP ainda é a semana anterior, mesmo sendo segunda em UTC", () => {
    const sundayNight = new Date("2026-11-30T02:30:00Z"); // domingo 23:30 em SP
    expect(startOfWeekKey(sundayNight, SP)).toBe("2026-11-23");
    expect(startOfWeekKey(sundayNight, "UTC")).toBe("2026-11-30");
  });

  it("atravessa a virada do mês e do ano bissexto", () => {
    expect(startOfWeekKey(new Date("2024-03-02T12:00:00Z"), SP)).toBe("2024-02-26");
    expect(startOfWeekKey(new Date("2027-01-01T12:00:00Z"), SP)).toBe("2026-12-28");
  });

  it("usa APP_TZ por padrão", () => {
    vi.stubEnv("APP_TZ", "UTC");
    expect(startOfWeekKey(new Date("2026-11-30T02:30:00Z"))).toBe("2026-11-30");
    expect(startOfWeek(new Date("2026-11-30T02:30:00Z")).toISOString()).toBe("2026-11-30T00:00:00.000Z");
  });
});

describe("isoWeekday", () => {
  it("segunda = 1, domingo = 7", () => {
    expect(isoWeekday("2026-11-23")).toBe(1);
    expect(isoWeekday("2026-11-28")).toBe(6);
    expect(isoWeekday("2026-11-29")).toBe(7);
  });
});

describe("hourInTz", () => {
  it("devolve a hora local de 0 a 23", () => {
    const morning = new Date("2026-11-24T09:15:00Z");
    expect(hourInTz(morning, SP)).toBe(6);
    expect(hourInTz(morning, "UTC")).toBe(9);
    expect(hourInTz(new Date("2026-11-24T03:00:00Z"), SP)).toBe(0);
    expect(hourInTz(new Date("2026-11-24T02:59:00Z"), SP)).toBe(23);
  });

  it("usa APP_TZ por padrão", () => {
    vi.stubEnv("APP_TZ", "UTC");
    expect(hourInTz(new Date("2026-11-24T09:15:00Z"))).toBe(9);
  });
});

describe("lastNDays", () => {
  it("devolve n dias em ordem crescente terminando em hoje", () => {
    expect(lastNDays(3, "2026-03-01")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
    expect(lastNDays(3, "2024-03-01")).toEqual(["2024-02-28", "2024-02-29", "2024-03-01"]);
    expect(lastNDays(1, "2026-11-24")).toEqual(["2026-11-24"]);
    expect(lastNDays(0, "2026-11-24")).toEqual([]);
  });

  it("cobre as 12 semanas do heatmap", () => {
    const days = lastNDays(84, "2026-11-24");
    expect(days).toHaveLength(84);
    expect(days[0]).toBe("2026-09-02");
    expect(days[83]).toBe("2026-11-24");
  });

  it("rejeita n negativo ou fracionário", () => {
    expect(() => lastNDays(-1, "2026-11-24")).toThrow(RangeError);
    expect(() => lastNDays(2.5, "2026-11-24")).toThrow(RangeError);
  });
});
