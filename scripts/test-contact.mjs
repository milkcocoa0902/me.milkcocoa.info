import {build} from "esbuild";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";

const directory = await mkdtemp(join(tmpdir(), "blog-contact-test-"));
try {
    const outfile = join(directory, "contact.test.cjs");
    await build({entryPoints: ["tests/contact.test.tsx"], outfile, bundle: true, platform: "node", format: "cjs", logLevel: "warning",
        alias: {"server-only": join(process.cwd(), "node_modules/next/dist/compiled/server-only/empty.js")},
    });
    const result = spawnSync(process.execPath, [outfile], {stdio: "inherit"});
    process.exitCode = result.status ?? 1;
} finally {await rm(directory, {recursive: true, force: true});}
