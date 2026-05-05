"use client";

import React, { useEffect, useState } from "react";
import { TocItem } from "@/lib/toc";
import { RiMenuFoldLine, RiMenuUnfoldLine } from "react-icons/ri";

interface ArticleTocProps {
  items: TocItem[];
}

export const ArticleToc: React.FC<ArticleTocProps> = ({ items }) => {
  const [activeId, setActiveId] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          // 最も上にある要素、または最も交差している要素を選ぶ
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
    
    // スクロール位置がトップに近い場合は activeId をクリアする
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

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  return (
    <nav className="w-full lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 backdrop-blur-md p-4 lg:bg-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2 lg:mb-4">
          <h2 className="text-lg font-bold text-white">Table of Contents</h2>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle Table of Contents"
          >
            {isExpanded ? <RiMenuFoldLine size={24} /> : <RiMenuUnfoldLine size={24} />}
          </button>
        </div>
        
        <ul className={`space-y-2 text-sm overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[70vh] opacity-100 py-2 overflow-y-auto" : "max-h-0 opacity-0 lg:max-h-none lg:opacity-100"
        }`}>
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
      </div>
    </nav>
  );
};
