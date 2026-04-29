import {ArticleDetail} from "@/interface/article";
import MarkdownIt from "markdown-it";
import { createHighlighterCore } from "shiki/core"
import { createOnigurumaEngine } from "@shikijs/engine-oniguruma"

import langKotlin from "shiki/langs/kotlin.mjs"
import langJson from "shiki/langs/json.mjs"
import langPython from "shiki/langs/python.mjs"
import langBash from "shiki/langs/bash.mjs"
import langMermaid from "shiki/langs/mermaid.mjs"
import langToml from "shiki/langs/toml.mjs"
import langTsx from "shiki/langs/tsx.mjs"

import shikiWasm from "shiki/wasm"

import themeViteSse from "shiki/themes/vitesse-dark.mjs"


import { container } from "@mdit/plugin-container";
import {fetchOgMetadata, OgMetadata} from "@/lib/ogp";

const engine = await createOnigurumaEngine(shikiWasm)
const highlighter = await createHighlighterCore({
    themes: [themeViteSse],
    langs: [ langKotlin, langPython, langJson, langBash, langMermaid, langToml, langTsx],
    engine: engine
})

export const renderArticle = async (article: ArticleDetail): Promise<string> => {
    // リンクカード対象のURLを抽出
    const urlPattern = /^(https?:\/\/[^\s]+)$/gm;
    const urls = Array.from(article.content.matchAll(urlPattern)).map(match => match[1]);
    const ogDataMap: Record<string, OgMetadata> = {};

    if (urls.length > 0) {
        // 並行数を制限してフェッチ（一度に5つまで）
        const CONCURRENCY = 5;
        for (let i = 0; i < urls.length; i += CONCURRENCY) {
            const chunk = urls.slice(i, i + CONCURRENCY);
            const ogResults = await Promise.all(chunk.map(url => fetchOgMetadata(url)));
            ogResults.forEach(data => {
                ogDataMap[data.url] = data;
            });
        }
    }


    const md = MarkdownIt({
        // Enable HTML tags in source
        html:         false,

        // Use '/' to close single tags (<br />).
        // This is only for full CommonMark compatibility.
        xhtmlOut:     false,

        // Convert '\n' in paragraphs into <br>
        breaks:       false,

        // CSS language prefix for fenced blocks. Can be
        // useful for external highlighters.
        langPrefix:   'language-',

        // Autoconvert URL-like text to links
        linkify:      false,

        // Enable some language-neutral replacement + quotes beautification
        // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.mjs
        typographer:  false,

        // Double + single quotes replacement pairs, when typographer enabled,
        // and smartquotes on. Could be either a String or an Array.
        //
        // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
        // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
        quotes: '“”‘’',

        // Highlighter function. Should return escaped HTML,
        // or '' if the source string is not changed and should be escaped externally.
        // If result starts with <pre... internal wrapper is skipped.
        highlight: function (str, lang, attrs): string {
            console.log(lang, " - ", attrs)
            let filename = "";
            if (attrs.includes(":")) {
                const parts = attrs.split(":");
                filename = parts[1].trim();
            }

            let codeHtml = "";
            if (lang === "diff") {
                codeHtml = highlighter.codeToHtml(str, {
                    lang: "text",
                    theme: "vitesse-dark"
                });
            } else if (highlighter.getLoadedLanguages().includes(lang)) {
                codeHtml = highlighter.codeToHtml(str, {
                    lang: lang,
                    theme: "vitesse-dark"
                });
            } else {
                codeHtml = highlighter.codeToHtml(str, {
                    lang: "text",
                    theme: "vitesse-dark"
                });
            }

            if (filename) {
                return `<div class="code-block-container"><div class="code-block-filename bg-slate-700">${filename}</div>${codeHtml}</div>`;
            }
            return codeHtml;
        }
    })

    md.use((md) => {
        const defaultRender = md.renderer.rules.paragraph_open || ((tokens, idx, options, env, self) => {
            return self.renderToken(tokens, idx, options);
        });

        md.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
            const nextToken = tokens[idx + 1];
            if (nextToken && nextToken.type === "inline") {
                const content = nextToken.content.trim();
                const urlPattern = /^(https?:\/\/[^\s]+)$/;
                if (urlPattern.test(content) && nextToken.children && nextToken.children.length === 1 && nextToken.children[0].type === "text") {
                    // この段落はURLのみで構成されている
                    // 次の次のトークンが paragraph_close であることを確認
                    if (tokens[idx + 2] && tokens[idx + 2].type === "paragraph_close") {
                        const url = content;
                        const og = ogDataMap[url];

                        tokens[idx].type = "link_card_open";
                        tokens[idx + 1].type = "link_card_inline";
                        tokens[idx + 2].type = "link_card_close";

                        if (og) {
                            const title = og.title || url;
                            const description = og.description || "";
                            const image = og.image ? `<div class="flex-none w-48 h-24 sm:w-64 sm:h-32 bg-gray-100"><img src="${og.image}" alt="${title}" class="w-full h-full object-cover m-0!" /></div>` : "";
                            const siteName = og.siteName ? `<span class="text-xs text-gray-500">${og.siteName}</span>` : "";
                            const favicon = og.favicon ? `<img src="${og.favicon}" class="w-3 h-3 inline-block mr-1 m-0!" />` : "";

                            return `
<div class="not-prose my-6">
  <a href="${url}" target="_blank" rel="noopener noreferrer" class="flex border border-gray-200 rounded-xl overflow-hidden hover:bg-gray-50 transition-colors no-underline!">
    <div class="flex-1 p-4 flex flex-col justify-between min-w-0">
      <div class="min-w-0">
        <div class="text-base font-bold text-gray-900 truncate mb-1">${title}</div>
        <div class="text-sm text-gray-600 line-clamp-2 mb-2">${description}</div>
      </div>
      <div class="flex items-center min-w-0">
        ${favicon}
        ${siteName || `<span class="text-xs text-gray-500 truncate">${url}</span>`}
      </div>
    </div>
    ${image}
  </a>
</div><!--`;
                        }

                        return `<div class="not-prose my-4"><a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a></div><!--`;
                    }
                }
            }
            return defaultRender(tokens, idx, options, env, self);
        };

        md.renderer.rules.link_card_inline = () => "";
        md.renderer.rules.link_card_close = () => "-->";
    })
        .use(container, {
            name: "message",
            openRender: (tokens, index, _options) => {
                const token = tokens[index];
                const info = token.info.trim().slice(7).trim(); // "message" の後ろを取得

                let style = "bg-blue-50 border-blue-200 text-blue-800";
                let title = "情報";

                if (info === "warning" || info.startsWith("warning ")) {
                    style = "bg-yellow-50 border-yellow-200 text-yellow-800";
                    title = "注意";
                    const customTitle = info.slice(7).trim();
                    if (customTitle) title = customTitle;
                } else if (info === "alert" || info.startsWith("alert ")) {
                    style = "bg-red-50 border-red-200 text-red-800";
                    title = "警告";
                    const customTitle = info.slice(5).trim();
                    if (customTitle) title = customTitle;
                } else {
                    if (info) title = info;
                }

                return `<div class="mt-8 mb-4 p-2 px-4 border-l-4 rounded ${style}">\n<div class="font-bold mb-1">${title}</div>\n`;
            },
        })
        .use(container, {
            name: "hint",
            openRender: (tokens, index, _options) => {
                const info = tokens[index].info.trim().slice(4).trim();
                return `<div class="my-4 p-4 bg-gray-100 border-l-4 border-gray-400 text-gray-700 rounded">\n<div class="font-bold mb-2">${info || "Hint"}</div>\n`;
            }
        })
        .use(container, {
            name: "details",
            openRender: (tokens, index, _options) => {
                const info = tokens[index].info.trim().slice(7).trim();
                return `<details class="my-4 border border-gray-200 rounded-lg overflow-hidden group">
<summary class="p-4 bg-gray-50 cursor-pointer font-bold list-none flex items-center justify-between hover:bg-gray-100 transition-colors">
  <span>${info || "Details"}</span>
  <svg class="w-5 h-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
  </svg>
</summary>
<div class="p-4 border-t border-gray-200">`;
            },
            closeRender: () => `</div></details>\n`
        });


    return md.render(article.content);
}