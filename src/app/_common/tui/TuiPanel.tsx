import React from "react";

export type TuiPanelProps = {
  title?: string;
  meta?: string;
  /** Hide redundant visual labels only; meaningful headings belong in the body. */
  decorativeHeader?: boolean;
  interactive?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
};

export function TuiPanel({
  title,
  meta,
  decorativeHeader = false,
  interactive = false,
  className = "",
  bodyClassName = "p-5 sm:p-6",
  children,
}: TuiPanelProps) {
  const interactiveClasses = interactive
    ? "transition-colors duration-150 hover:border-teal-400/70 hover:bg-slate-900/75 group"
    : "";

  return (
    <div
      className={`relative rounded-sm border border-slate-700/80 bg-slate-900/55 shadow-[0_8px_24px_-16px_rgba(2,6,23,0.9)] ${interactiveClasses} ${className}`.trim()}
    >
      {(title || meta) && (
        <div aria-hidden={decorativeHeader || undefined} className="flex items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/60 px-3.5 py-1.5 font-mono text-xs">
          {title ? (
            <span className="flex items-center gap-1.5 text-teal-300 font-medium truncate">
              <span aria-hidden="true" className="text-slate-500">[</span>
              <span className="truncate">{title}</span>
              <span aria-hidden="true" className="text-slate-500">]</span>
            </span>
          ) : (
            <span />
          )}
          {meta && (
            <span className="shrink-0 text-[11px] text-slate-400">
              {meta}
            </span>
          )}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
