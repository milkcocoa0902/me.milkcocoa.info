import {build} from "esbuild";
import {mkdtemp, readFile, writeFile, symlink, rm} from "node:fs/promises";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import assert from "node:assert/strict";

const directory = await mkdtemp(join(tmpdir(), "blog-mermaid-test-"));
let server;
try {
    await symlink(join(process.cwd(), "node_modules"), join(directory, "node_modules"));
    await build({entryPoints: ["src/lib/md.ts"], outfile: join(directory, "renderer.mjs"), bundle: true, packages: "external", platform: "node", format: "esm"});
    const {renderArticle} = await import(pathToFileURL(join(directory, "renderer.mjs")).href);
    const article = await readFile("articles/lambda-web-adapter-poc.md", "utf8");
    const diagrams = [...article.matchAll(/```mermaid\n[\s\S]*?```/g)].map(match => match[0]);
    assert.equal(diagrams.length, 3);
    const render = content => renderArticle({content});
    const plain = await render('```python\nprint("hello")\n```');
    assert.match(plain, /class="shiki/);
    const unsafe = await render('```mermaid\n<img src=x onerror="alert(1)">\n```');
    assert.ok(!unsafe.includes("<img"));
    assert.match(unsafe, /&lt;img/);
    const fixtures = {
        plain,
        article: await render(diagrams.join("\n\n")),
        mixed: await render([diagrams[0], '```mermaid\nnot-a-diagram <img src=x>\n```', '```mermaid\nsequenceDiagram\nAlice->>Bob: Hello\n```', '```python\nprint("hello")\n```'].join("\n\n")),
    };
    await build({entryPoints: ["tests/mermaid.browser.tsx"], outdir: directory, bundle: true, splitting: true, format: "esm", platform: "browser", define: {"process.env.NODE_ENV": '"development"'}, logLevel: "warning"});
    const stylesheet = (await readFile("src/app/globals.css", "utf8")).match(/\.mermaid-output > svg \{[\s\S]*?\n\}/)[0];
    await writeFile(join(directory, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#02132b;color:#e2e8f0;font-family:sans-serif}.article{max-width:900px;margin:auto;padding:16px}.mermaid-diagram{overflow-x:auto;margin-block:24px;padding:16px;border:1px solid #334155;border-radius:12px}pre{overflow:auto}${stylesheet}</style><div id="root"></div><script id="fixtures" type="application/json">${JSON.stringify(fixtures).replace(/</g, "\\u003c")}</script><script type="module" src="/mermaid.browser.js"></script>`);
    server = createServer(async (request, response) => {
        const filename = request.url === "/" ? "index.html" : request.url?.slice(1);
        if (!filename || filename.includes("..")) {response.writeHead(404).end(); return;}
        try {
            const data = await readFile(join(directory, filename));
            response.setHeader("Content-Type", filename.endsWith(".js") ? "text/javascript" : "text/html");
            response.end(data);
        } catch {response.writeHead(404).end();}
    });
    await new Promise((resolve, reject) => {server.once("error", reject); server.listen(0, "127.0.0.1", resolve);});
    for (const width of [1280, 390]) {
        const output = await new Promise((resolve, reject) => {
            const screenshot = process.env.MERMAID_SCREENSHOT_DIR ? [`--screenshot=${join(process.env.MERMAID_SCREENSHOT_DIR, `mermaid-${width}.png`)}`] : [];
            const browser = spawn(process.env.CHROME_BIN || "google-chrome", ["--headless", "--disable-gpu", "--no-first-run", `--user-data-dir=${join(directory, `profile-${width}`)}`, `--window-size=${width},1000`, "--virtual-time-budget=30000", ...screenshot, "--dump-dom", `http://127.0.0.1:${server.address().port}/`]);
            let stdout = "";
            let stderr = "";
            browser.stdout.on("data", data => {stdout += data;});
            browser.stderr.on("data", data => {stderr += data;});
            const timeout = setTimeout(() => browser.kill(), 60000);
            browser.on("error", reject);
            browser.on("close", code => {clearTimeout(timeout); code === 0 ? resolve(stdout) : reject(new Error(stderr));});
        });
        assert.ok(/data-test-result="passed"/.test(output), output.match(/data-test-error="[^"]*"/)?.[0] ?? "Browser tests did not complete");
        const viewport = output.match(/data-test-viewport="(\d+)"/)?.[1];
        console.log(`Mermaid browser tests passed (viewport ${viewport}px): article diagrams, mixed syntax, escaping, StrictMode, navigation, fallback`);
    }
} finally {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await rm(directory, {recursive: true, force: true});
}
