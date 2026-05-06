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
    <nav className="w-full lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto relative z-[2001]">
      {/* モバイル用: details/summaryを使用 */}
      <div className="lg:hidden">
        <details className="rounded-2xl border border-slate-700/70 bg-slate-900/95 backdrop-blur-md overflow-hidden group">
          <summary 
            className="flex items-center justify-between p-4 cursor-pointer list-none touch-manipulation"
          >
            <h2 className="text-lg font-bold text-white">Table of Contents</h2>
            <div className="text-slate-400 p-1">
              <RiMenuUnfoldLine className="group-open:hidden" size={24} />
              <RiMenuFoldLine className="hidden group-open:block" size={24} />
            </div>
          </summary>
          <ul className="px-4 pb-4 space-y-2 text-sm max-h-[70vh] overflow-y-auto border-t border-slate-700 pt-2">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
              >
                <a
                  href={`#${item.id}`}
                  onClick={handleLinkClick}
                  className={`block transition-colors duration-200 hover:text-teal-300 py-1 ${
                    activeId === item.id
                      ? "text-teal-400 font-bold border-l-2 border-teal-400 pl-2 -ml-2.5"
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
      <div className="hidden lg:block rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4">
        <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Table of Contents</h2>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
            >
              <a
                href={`#${item.id}`}
                className={`block transition-colors duration-200 hover:text-teal-300 py-1 ${
                  activeId === item.id
                    ? "text-teal-400 font-bold border-l-2 border-teal-400 pl-2 -ml-2.5"
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
