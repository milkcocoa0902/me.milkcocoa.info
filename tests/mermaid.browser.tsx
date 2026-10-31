import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {ArticleHtml} from "../src/app/articles/[slug]/_components/ArticleHtml";

const fixtures = JSON.parse(document.getElementById("fixtures")!.textContent!) as {
    article: string;
    mixed: string;
    plain: string;
};
const root = createRoot(document.getElementById("root")!);
const show = (html: string) => root.render(<StrictMode><ArticleHtml html={html} className="article" /></StrictMode>);
const assert = (condition: unknown, message: string) => {
    if (!condition) throw new Error(message);
};
async function until(check: () => boolean) {
    for (let attempt = 0; attempt < 200; attempt++) {
        if (check()) return;
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error("Rendering timed out");
}

async function test() {
    show(fixtures.plain);
    await until(() => !!document.querySelector("pre.shiki"));
    assert(!performance.getEntriesByType("resource").some(entry => entry.name.includes("mermaid") && !entry.name.endsWith("/mermaid.browser.js")), "Mermaid loaded for a plain article");

    show(fixtures.article);
    await until(() => document.querySelectorAll("[data-mermaid] svg").length === 3);
    assert(document.querySelectorAll("[data-mermaid] > pre[hidden]").length === 3, "Source was not hidden after rendering");
    const ids = Array.from(document.querySelectorAll("[data-mermaid] svg"), svg => svg.id);
    assert(new Set(ids).size === 3, "Duplicate SVG ids");
    assert(document.body.scrollWidth <= window.innerWidth, "Diagram overflows the viewport");

    show(fixtures.mixed);
    await until(() => document.querySelectorAll("[data-mermaid] svg").length === 2 && !!document.querySelector("[data-mermaid] > p"));
    assert(document.querySelectorAll("[data-mermaid]").length === 3, "Missing diagram blocks");
    const failed = document.querySelector("[data-mermaid] > p")!.parentElement!;
    assert(!failed.querySelector("pre")!.hidden, "Invalid diagram lost its source");
    assert(!!document.querySelector("pre.shiki"), "Regular syntax highlighting was lost");
    assert(!document.querySelector("[data-mermaid] img"), "Source HTML was executed");

    show(fixtures.plain);
    await until(() => !document.querySelector("[data-mermaid]"));
    assert(!document.querySelector("svg"), "Old SVG survived an article change");
    show(fixtures.article);
    await until(() => document.querySelectorAll("[data-mermaid] svg").length === 3);
    assert(!Array.from(document.querySelectorAll("[data-mermaid] svg"), svg => svg.id).some(id => ids.includes(id)), "Stale render reused after navigation");
    document.body.dataset.testResult = "passed";
    document.body.dataset.testViewport = String(window.innerWidth);
}

test().catch(error => {
    document.body.dataset.testResult = "failed";
    document.body.dataset.testError = String(error);
});
