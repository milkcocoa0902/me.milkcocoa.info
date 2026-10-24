"use client";

import React, { useEffect, useState } from "react";
import { TocItem } from "@/lib/toc";
import { RiMenuFoldLine, RiMenuUnfoldLine } from "react-icons/ri";

interface ArticleTocProps {
  items: TocItem[];
}

export const ArticleToc: React.FC<ArticleTocProps> = ({ items }) => {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
              if (a.intersectionRatio !== b.intersectionRatio) {
                  return b.intersectionRatio - a.intersectionRatio;
              }
              return a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top;
          });

        if (visible[0]) {
          setActiveId((visible[0].target as HTMLElement).id);
        }
      },
      { 
        rootMargin: "-10% 0px -70% 0px", 
        threshold: [0, 0.25, 0.5, 1] 
      }
    );

    headings.forEach((h) => observer.observe(h));
    
    const handleScroll = () => {
        if (window.scrollY < 100) {
            setActiveId("");
        }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      headings.forEach((h) => observer.unobserve(h));
      window.removeEventListener("scroll", handleScroll);
    };
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    // details要素を閉じる (モバイルのみ)
    if (window.innerWidth < 1024) {
      const details = e.currentTarget.closest('details');
      if (details) {
        details.removeAttribute('open');
      }
    }
  };

  return (
    <nav aria-label="目次" className="w-full lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto relative z-[2001]">
      {/* モバイル用: details/summaryを使用 */}
      <div className="lg:hidden">
        <details className="rounded-sm border border-slate-700/80 bg-slate-900/95 backdrop-blur-md overflow-hidden group">
          <summary 
            className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer list-none touch-manipulation font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-300"
          >
            <span className="flex items-center gap-1.5 font-bold text-teal-300">
              <span aria-hidden="true" className="text-slate-500">[</span>
              <span>Table of Contents</span>
              <span aria-hidden="true" className="text-slate-500">]</span>
            </span>
            <span className="text-slate-400 p-1" aria-hidden="true">
              <RiMenuUnfoldLine className="group-open:hidden" size={20} aria-hidden="true" />
              <RiMenuFoldLine className="hidden group-open:block" size={20} aria-hidden="true" />
            </span>
          </summary>
          <ul className="px-4 pb-4 space-y-1.5 text-sm max-h-[70vh] overflow-y-auto border-t border-slate-800 pt-3">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 2) * 0.85}rem` }}
              >
                <a
                  href={`#${item.id}`}
                  onClick={handleLinkClick}
                  className={`block rounded-xs transition-colors duration-150 hover:text-teal-300 py-1 px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
                    activeId === item.id
                      ? "bg-teal-950/50 text-teal-300 font-semibold border-l-2 border-teal-400"
                      : "text-slate-400"
                  }`}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* デスクトップ用: 常に表示 */}
      <div className="hidden lg:block rounded-sm border border-slate-700/80 bg-slate-900/55 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-950/60 px-3.5 py-1.5 font-mono text-xs">
          <span className="flex items-center gap-1.5 font-medium text-teal-300">
            <span aria-hidden="true" className="text-slate-500">[</span>
            <span>Table of Contents</span>
            <span aria-hidden="true" className="text-slate-500">]</span>
          </span>
          <span aria-hidden="true" className="text-[11px] text-slate-400">
            {items.length}h
          </span>
        </div>
        <ul className="p-3.5 space-y-1.5 text-sm">
          {items.map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 0.85}rem` }}
            >
              <a
                href={`#${item.id}`}
                className={`block rounded-xs transition-colors duration-150 hover:text-teal-300 py-1 px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
                  activeId === item.id
                    ? "bg-teal-950/50 text-teal-300 font-semibold border-l-2 border-teal-400"
                    : "text-slate-400"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
