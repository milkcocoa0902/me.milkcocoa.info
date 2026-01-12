// 投稿詳細画面
import { notFound } from "next/navigation";
import {getArticle, getAllArticles} from "../../../lib/api";
import { BlogMainContent } from "./_lib/content";
import type { Metadata } from 'next'
import React from "react";
import Shiki from "@shikijs/markdown-it";
import { transformerNotationDiff } from "@shikijs/transformers";
import MarkdownIt from "markdown-it";
import { container } from "@mdit/plugin-container";
import { fetchOgMetadata, OgMetadata } from "../../../lib/ogp";
import { bundledLanguages, bundledThemes, createHighlighter } from 'shiki'
import {diffLines} from "diff";

type ArticlePageProps = {
    params: Promise<{ slug: string }>
}

export const generateStaticParams = async  () => {
    const articles = await getAllArticles()

    return articles.map((article) => ({
        slug: article.slug,
    }));
};


function convertToDateString(date: Date){
    const [y, mo, d] = [date.getFullYear(), date.getMonth() + 1, date.getDay()]
    return `${y}-${mo.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`
}

export async function generateMetadata({ params }: ArticlePageProps ): Promise<Metadata> {
    const slug = (await params).slug
    const article = await getArticle(slug)
    return {
        title: article?.title ?? "",
        openGraph: {
            title: article?.title,
            description: article?.description,
            url: `https://me.milkcocoa.info/blog/${slug}`,
            images: {
                url: `https://me.milkcocoa.info/blog/${slug}/opengraph-image`,
                alt: article?.title,
                width: 1200,
                height: 630,
                type: "image/webp",
            }
        },
        twitter: {
            title: article?.title,
            card: "summary_large_image",
            description: article?.description,
            images: {
                url: `https://me.milkcocoa.info/blog/${slug}/opengraph-image`,
                alt: article?.title,
                width: 1200,
                height: 630,
                type: "image/webp"
            }
        },
    };
}



export default async function Article({params}: ArticlePageProps ) {
    const slug = (await params).slug
    const article = await getArticle(slug)
    if (!article) {
        notFound()
    }

    // リンクカード対象のURLを抽出
    const urlPattern = /^(https?:\/\/[^\s]+)$/gm;
    const urls = Array.from(article.content.matchAll(urlPattern)).map(match => match[1]);
    const ogDataMap: Record<string, OgMetadata> = {};

    if (urls.length > 0) {
        const ogResults = await Promise.all(urls.map(url => fetchOgMetadata(url)));
        ogResults.forEach(data => {
            ogDataMap[data.url] = data;
        });
    }
    const highlighter = await createHighlighter({
        themes: ["vitesse-dark"],
        langs: Object.keys(bundledLanguages),
    })

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
        });

    return (
        <React.Fragment>
            <div className="mt-8 mb-0 flex items-center justify-center">
                <img
                    className="m-auto"
                    src={`https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.4/2/svg/${article.emoji.codePointAt(0)?.toString(16)}.svg`}
                    width="64"
                    height="64"
                    alt=""
                />
            </div>
            <div className="m-8">
                <h1 className="text-center text-4xl font-bold">
                    {article.title}
                </h1>
                <p className="text-center text-base text-[#666666]">
                    {
                        (() => {
                            let date = new Date(article.date);
                            return `${convertToDateString(date)} に公開`;
                        })()
                    }
                </p>
            </div>
            <div className="bg-white p-4 md:p-8 my-4 rounded-2xl">
                <div className="flex justify-start items-center gap-2 overflow-x-auto mb-4">
                    {
                        article.topics.map((topic) => (
                            <React.Fragment key={topic}>
                                <div className="bg-blue-50 rounded-2xl px-3 py-1 shrink-0">
                                    <span className="text-sm text-[#666666]">
                                        {topic}
                                    </span>
                                </div>
                            </React.Fragment>
                        ))
                    }
                </div>
                <BlogMainContent
                    html={md.render(article.content)}
                />
            </div>
        </React.Fragment>
    )
}


const diffTextShiki = (oldText: string, newText: string): string => {
    const diffs = diffLines(oldText, newText);

    return diffs
        .reduce((acc, diff) => {
            if (diff.added) {
                const concat =
                    acc +
                    diff.value
                        .split("\n")
                        .map((line) => (line ? line + "// [!code ++]" : ""))
                        .join("\n");
                return concat.endsWith("\n") ? concat : concat + "\n";
            } else if (diff.removed) {
                const concat =
                    acc +
                    diff.value
                        .split("\n")
                        .map((line) => (line ? line + "// [!code --]" : ""))
                        .join("\n");
                return concat.endsWith("\n") ? concat : concat + "\n";
            } else {
                return acc + diff.value;
            }
        }, "")
        .trim();
};