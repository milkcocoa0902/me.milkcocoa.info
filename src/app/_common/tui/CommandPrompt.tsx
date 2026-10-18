import React from "react";

export type CommandPromptProps = {
  command: string;
  path?: string;
  showCaret?: boolean;
  as?: "h1" | "h2" | "div";
  title?: string;
  id?: string;
  className?: string;
};

export function CommandPrompt({
  command,
  path = "~",
  showCaret = false,
  as: Tag = "div",
  title,
  id,
  className = "",
}: CommandPromptProps) {
  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      <div
        aria-hidden={Boolean(title)}
        className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs sm:text-sm text-slate-400 overflow-x-auto"
      >
        <span className="text-teal-400 font-semibold select-none">milkcocoa@warehouse</span>
        <span className="text-slate-600 select-none">:</span>
        <span className="text-cyan-300 select-none">{path}</span>
        <span className="text-teal-300 font-bold select-none">$</span>
        <span className="text-slate-100 break-all">{command}</span>
        {showCaret && <span aria-hidden="true" className="tui-caret ml-0.5" />}
      </div>
      {title && (
        <Tag
          id={id}
          className={
            Tag === "h1"
              ? "text-2xl sm:text-3xl font-bold tracking-tight text-slate-50"
              : "text-xl sm:text-2xl font-bold tracking-tight text-slate-100"
          }
        >
          {title}
        </Tag>
      )}
    </div>
  );
}
