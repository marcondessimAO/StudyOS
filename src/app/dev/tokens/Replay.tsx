"use client";

import { useState, type ReactNode } from "react";

type ReplayProps = {
  label: string;
  children: ReactNode;
};

/** Remonta o conteúdo a cada clique para reiniciar a animação (só na página /dev/tokens). */
export function Replay({ label, children }: ReplayProps) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex min-h-[120px] flex-col gap-3 border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="label-section font-mono text-[12px] text-muted">{label}</span>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="press min-h-[44px] border border-line-strong px-3 font-mono text-[12px] text-text"
        >
          REPLAY
        </button>
      </div>
      <div key={run} className="relative flex flex-1 items-center justify-center overflow-hidden">
        {children}
      </div>
    </div>
  );
}
