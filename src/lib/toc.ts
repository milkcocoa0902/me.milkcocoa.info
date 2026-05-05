import { parse } from 'node-html-parser';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractToc(html: string): TocItem[] {
  const root = parse(html);
  const headings = root.querySelectorAll('h2, h3');
  
  return headings.map((heading) => ({
    id: heading.getAttribute('id') || '',
    text: heading.textContent || '',
    level: parseInt(heading.tagName.replace('H', ''), 10),
  })).filter(item => item.id !== '');
}
