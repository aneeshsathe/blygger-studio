import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const studio = JSON.parse(readFileSync("package.json", "utf8"));
const sdk = JSON.parse(readFileSync("sdk/package.json", "utf8"));
const spec = JSON.parse(readFileSync("openapi.json", "utf8"));
const tag = process.env.RELEASE_TAG ?? `v${studio.version}`;
if (tag !== `v${studio.version}`) throw new Error(`Tag ${tag} must match package.json version v${studio.version}`);
const output = "build/release";
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const workerName = `blygger-worker-${studio.version}`;
const worker = join(output, workerName);
mkdirSync(worker);
// The shipped model list, without any local models.local.json.
execFileSync("node", ["--import", "tsx", "scripts/build-models.ts"], { stdio: "inherit", env: { ...process.env, BLYG_MODELS_SHIPPED_ONLY: "1" } });
// The shipped extension list (extensions.json), without any extensions.local.json,
// and the Studio bundle rebuilt against it, since the Worker embeds that bundle.
const { BLYG_EXTENSIONS: _override, ...shippedEnv } = process.env;
execFileSync("node", ["--import", "tsx", "scripts/build-extensions.ts"], { stdio: "inherit", env: { ...shippedEnv, BLYG_EXTENSIONS_SHIPPED_ONLY: "1" } });
execFileSync("node", ["--import", "tsx", "scripts/build-spa.ts"], { stdio: "inherit" });
await build({ entryPoints: ["src/index.ts"], outfile: join(worker, "worker.js"), bundle: true, platform: "neutral", conditions: ["workerd"], external: ["cloudflare:*", "node:*"], mainFields: ["module", "main"], format: "esm", target: "es2022", loader: { ".txt": "text" } });
// Use the committed generic template, never a contributor's local deployment config.
const config = execFileSync("git", ["show", "HEAD:wrangler.jsonc"], { encoding: "utf8" });
writeFileSync(join(worker, "wrangler.jsonc"), config.replace('"main": "src/index.ts"', '"main": "worker.js",\n  "no_bundle": true'));
cpSync("migrations", join(worker, "migrations"), { recursive: true });
cpSync("LICENSE", join(worker, "LICENSE"));
cpSync("docs/release-worker.md", join(worker, "README.md"));
execFileSync("tar", ["-czf", join(output, `${workerName}.tar.gz`), "-C", output, workerName]);
const packed = JSON.parse(execFileSync("npm", ["pack", "./sdk", "--json", "--pack-destination", output], { encoding: "utf8" }));
const sdkFile = packed[0].filename;
const specFile = `blygger-openapi-${studio.version}.json`;
cpSync("openapi.json", join(output, specFile));
const manifest = { tag, studioVersion: studio.version, sdkVersion: sdk.version, openapiVersion: spec.info.version, commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), generator: JSON.parse(readFileSync("sdk/generation.json", "utf8")), artifacts: [specFile, `${workerName}.tar.gz`, sdkFile] };
writeFileSync(join(output, "release.json"), `${JSON.stringify(manifest, null, 2)}\n`);
const checksums = [...manifest.artifacts, "release.json"].map(file => `${createHash("sha256").update(readFileSync(join(output, file))).digest("hex")}  ${file}`).join("\n");
writeFileSync(join(output, "SHA256SUMS"), `${checksums}\n`);
console.log(`Release downloads built in ${output}`);
