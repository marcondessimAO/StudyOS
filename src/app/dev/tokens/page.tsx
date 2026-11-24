import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Replay } from "./Replay";

export const metadata: Metadata = { title: "Tokens · StudyOS (dev)" };

const COLORS: { token: string; hex: string; use: string }[] = [
  { token: "ink", hex: "#0E0F14", use: "Fundo da aplicação" },
  { token: "ink-deep", hex: "#0B0C10", use: "Áreas terminal" },
  { token: "surface", hex: "#171922", use: "Cards" },
  { token: "surface-2", hex: "#1F2230", use: "Blocos vazios fortes, hover" },
  { token: "line", hex: "#2A2E3D", use: "Bordas, blocos vazios" },
  { token: "line-strong", hex: "#3A3F52", use: "Campos, botões secundários" },
  { token: "dot", hex: "#23263A", use: "Grade de pontos" },
  { token: "text", hex: "#F3F4F8", use: "Texto principal" },
  { token: "muted", hex: "#A1A7B8", use: "Texto secundário" },
  { token: "faint", hex: "#7D8396", use: "Placeholders, bloqueados" },
  { token: "violet-600", hex: "#7C3AED", use: "Botão primário, XP acumulado" },
  { token: "violet-500", hex: "#8B5CF6", use: "Matéria Backend, blocos" },
  { token: "violet-400", hex: "#A78BFA", use: "Nível, destaques" },
  { token: "violet-300", hex: "#C4B5FD", use: "Links, rótulos" },
  { token: "violet-deep-1", hex: "#1B1830", use: "Fundo de conquista" },
  { token: "violet-deep-2", hex: "#2B2150", use: "Fundo de conquista" },
  { token: "violet-deep-3", hex: "#4C3A8F", use: "Sombra de conquista" },
  { token: "lime", hex: "#A3E635", use: "Ganho novo" },
  { token: "lime-deep", hex: "#4D7C0F", use: "Sombra do botão de coleta" },
  { token: "orange", hex: "#FB923C", use: "Streak" },
  { token: "orange-ink", hex: "#1A0E05", use: "Texto sobre laranja" },
  { token: "orange-deep", hex: "#4A2E1C", use: "Sombra do streak" },
  { token: "yellow", hex: "#FDE047", use: "Estrelas, aproveitamento" },
];

const HEAT = ["#222533", "#3B2A6B", "#5B3BB0", "#7C3AED", "#A78BFA"];
const SUBJECTS = [
  { bg: "#8B5CF6", text: "#C4B5FD", name: "BACKEND" },
  { bg: "#22C55E", text: "#86EFAC", name: "SEGURANÇA" },
  { bg: "#3B82F6", text: "#93C5FD", name: "INFRA" },
  { bg: "#F97316", text: "#FDBA74", name: "FACULDADE" },
];

const SHADOWS = [
  { cls: "shadow-primary", label: "primary · 4px lime" },
  { cls: "shadow-claim", label: "claim · 3px lime-deep" },
  { cls: "shadow-streak", label: "streak · 6px orange-deep" },
  { cls: "shadow-badge", label: "badge · 4px #4C3A8F" },
  { cls: "shadow-toast", label: "toast · 6px violet-600" },
  { cls: "shadow-overlay", label: "overlay · 5px violet-600" },
];

const FONT_SCALE = [11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 34, 40, 72, 84, 96];
const CONFETTI_COLORS = ["#A3E635", "#A78BFA", "#FB923C", "#FDE047", "#7C3AED"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="label-section font-mono text-[13px] font-bold text-violet-300">{title}</h2>
      {children}
    </section>
  );
}

function segClass(i: number): string {
  if (i < 8) return "seg h-6 w-3 bg-violet-600";
  if (i < 12) return "seg new h-6 w-3 bg-lime";
  return "seg h-6 w-3 bg-line";
}

function SegDemo() {
  return (
    <div className="flex h-6 items-end gap-[3px]" role="img" aria-label="12 de 20 blocos">
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className={segClass(i)}
          style={i >= 8 && i < 12 ? { animationDelay: `${(i - 8) * 230}ms` } : undefined}
        />
      ))}
    </div>
  );
}

function ConfettiDemo() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="fall block"
          style={{
            left: `${(i * 8 + 4) % 100}%`,
            width: 5 + (i % 6),
            height: 5 + (i % 6),
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i * 60) % 700}ms`,
          }}
        />
      ))}
    </div>
  );
}

function ColorsSection() {
  return (
    <Section title="CORES">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {COLORS.map((c) => (
          <div key={c.token} className="border border-line bg-surface">
            <div className="h-14 border-b border-line" style={{ background: c.hex }} />
            <div className="flex flex-col gap-1 p-2 font-mono text-[11px]">
              <span className="font-bold text-text">{c.token}</span>
              <span className="text-muted tabular-nums">{c.hex}</span>
              <span className="text-faint">{c.use}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-6 font-mono text-[12px] text-muted">
        <div className="flex items-center gap-2">
          HEATMAP
          {HEAT.map((h, i) => (
            <span key={h} className="block h-4 w-4" style={{ background: h }} title={`nível ${i}`} />
          ))}
          <span className="block h-4 w-4 outline-2 outline-lime" style={{ background: HEAT[4] }} />
        </div>
        {SUBJECTS.map((s) => (
          <span key={s.name} className="flex items-center gap-2">
            <span className="block h-4 w-4" style={{ background: s.bg }} />
            <span style={{ color: s.text }}>{s.name}</span>
          </span>
        ))}
      </div>
    </Section>
  );
}

function TypographySection() {
  return (
    <Section title="TIPOGRAFIA">
      <div className="flex flex-col gap-3 border border-line bg-surface p-5">
        <p className="font-display text-[40px] font-extrabold">Unbounded · +94 XP</p>
        <p className="font-mono text-[24px] font-bold tabular-nums">
          JetBrains Mono · 25:00 · METAS_DA_SEMANA
        </p>
        <p className="font-sans text-[16px]">Inter · Índices compostos no PostgreSQL</p>
        <div className="flex flex-wrap items-baseline gap-4 font-mono text-muted">
          {FONT_SCALE.map((size) => (
            <span key={size} style={{ fontSize: size }} className="tabular-nums">
              {size}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ShapeSection() {
  return (
    <Section title="FORMA E SOMBRAS (RAIO 0)">
      <div className="flex flex-wrap gap-8">
        {SHADOWS.map((s) => (
          <div
            key={s.cls}
            className={`lift ${s.cls} border border-line bg-surface px-4 py-6 font-mono text-[12px]`}
          >
            {s.label}
          </div>
        ))}
        <button
          type="button"
          className="press min-h-[44px] bg-violet-600 px-5 font-mono text-[14px] font-bold text-white shadow-primary"
        >
          ▶ PRIMÁRIO
        </button>
        <button
          type="button"
          className="ghost min-h-[44px] border border-line-strong px-5 font-mono text-[14px] text-text"
        >
          GHOST
        </button>
        <button
          type="button"
          className="press claim min-h-[44px] bg-lime px-5 font-mono text-[14px] font-bold text-ink shadow-claim"
        >
          COLETAR
        </button>
      </div>
    </Section>
  );
}

function AnimationsSection() {
  return (
    <Section title="ANIMAÇÕES">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Replay label="segpop">
          <SegDemo />
        </Replay>
        <Replay label="float">
          <span className="float font-mono text-[16px] font-extrabold text-lime">+25 XP</span>
          <span className="font-mono text-[12px] text-muted">missão coletada</span>
        </Replay>
        <Replay label="fall (confete)">
          <ConfettiDemo />
        </Replay>
        <Replay label="flip">
          <span className="flip inline-block font-display text-[40px] font-extrabold text-orange">8</span>
        </Replay>
        <Replay label="lvup">
          <span className="lvup inline-block bg-lime px-3 py-1 font-display text-[22px] font-extrabold text-ink">
            LEVEL UP!
          </span>
        </Replay>
        <Replay label="bump">
          <span className="bump inline-block font-display text-[40px] font-extrabold text-lime">+96</span>
        </Replay>
        <Replay label="pulse / claim">
          <div className="flex gap-4">
            <span className="pulse inline-block bg-violet-600 px-4 py-2 font-mono font-bold text-white">
              CONTINUAR
            </span>
            <span className="claim inline-block bg-lime px-4 py-2 font-mono font-bold text-ink">COLETAR</span>
          </div>
        </Replay>
        <Replay label="blink">
          <span className="font-mono text-[18px]">
            &gt; estudar<span className="blink">_</span>
          </span>
          <span className="blink ml-4 block h-5 w-5 bg-lime" />
        </Replay>
        <Replay label="flame">
          <span className="flame inline-block bg-orange px-4 py-2 font-display text-[34px] text-orange-ink">
            8
          </span>
        </Replay>
        <Replay label="toast">
          <span className="toast inline-block border border-lime bg-surface px-4 py-3 font-mono text-[13px] shadow-toast">
            +25 XP · missão coletada
          </span>
        </Replay>
        <Replay label="rv (revelação)">
          <span className="rv on inline-block border border-line px-4 py-3 font-mono text-[13px]">
            Conquista desbloqueada
          </span>
        </Replay>
        <Replay label="press / lift">
          <div className="flex gap-4">
            <span className="lift inline-block border border-line bg-surface-2 px-4 py-3 font-mono text-[12px]">
              hover: lift
            </span>
            <button
              type="button"
              className="press min-h-[44px] bg-violet-600 px-4 font-mono text-[12px] text-white shadow-primary"
            >
              clique: press
            </button>
          </div>
        </Replay>
      </div>
    </Section>
  );
}

export default function TokensPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex max-w-[1360px] flex-col gap-10 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-2">
        <span className="label-section font-mono text-[12px] text-muted">{"// DEV · TOKENS"}</span>
        <h1 className="font-display text-[34px] font-extrabold">Design tokens do StudyOS</h1>
        <p className="text-[14px] text-muted">
          Fonte: docs/11-design.md e docs/design/prototipo. Página só existe em desenvolvimento.
        </p>
      </header>
      <ColorsSection />
      <TypographySection />
      <ShapeSection />
      <AnimationsSection />
    </main>
  );
}
