import React from "react";

export type TuiBadgeTone =
  | "language"
  | "framework"
  | "library"
  | "tools"
  | "infra"
  | "service"
  | "cyan"
  | "neutral";

export type TuiBadgeProps = {
  tone?: TuiBadgeTone;
  prefix?: string;
  className?: string;
  children: React.ReactNode;
};

const toneStyles: Record<TuiBadgeTone, string> = {
  language: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  framework: "border-cyan-400/35 bg-cyan-400/10 text-cyan-200",
  library: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  tools: "border-violet-400/35 bg-violet-400/10 text-violet-200",
  infra: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  service: "border-rose-400/35 bg-rose-400/10 text-rose-200",
  cyan: "border-teal-400/35 bg-teal-400/10 text-teal-200",
  neutral: "border-slate-700 bg-slate-800/80 text-slate-200",
};

export function TuiBadge({
  tone = "neutral",
  prefix,
  className = "",
  children,
}: TuiBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 font-mono text-xs font-medium tracking-tight ${toneStyles[tone]} ${className}`.trim()}
    >
      {prefix && (
        <span aria-hidden="true" className="opacity-70">
          {prefix}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
