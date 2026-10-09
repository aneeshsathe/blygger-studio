// The shipped artifact names nobody's deployment (session 28 packaging rule;
// studio#1). Our committed `wrangler.jsonc` is a template: no account, no named
// envs, no routes, no real database id. A copy that carried ours would deploy
// fine and tell every new operator where our infrastructure lives.
//
// This used to be part of `npm test`, which also runs on operators' installs —
// where `wrangler.jsonc` is *supposed* to hold their own deployment, so a correct
// install failed. It is a property of the published repository, so CI checks it
// there, on the committed file. Run from the repo root (npm does).
import { readdirSync, readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { stripJsonComments } from "./deploy-lib.ts";
import { initConfig } from "./init-config.ts";

const config = JSON.parse(stripJsonComments(readFileSync("wrangler.jsonc", "utf8")));
const problems: string[] = [];
if (config.name !== "blyg") problems.push(`name is "${config.name}", not the template's "blyg"`);
if (config.account_id !== undefined) problems.push("account_id must not be committed");
if (config.env !== undefined) problems.push("named env blocks are deployment-specific");
if (config.routes !== undefined) problems.push("routes name a domain");
if (/^[0-9a-f-]{36}$/.test(config.d1_databases?.[0]?.database_id ?? "")) problems.push("database_id is a real UUID; the template carries a placeholder");
// studio#10: 9000_–9999_ is reserved for operators' local migrations, so the
// shipped repo must never use it. (A test would fail on an operator's install
// that rightly has one — the #1 mistake again — so this is CI-only too.)
for (const f of readdirSync("migrations")) {
  const n = Number(/^(\d{4})_/.exec(f)?.[1]);
  if (n >= 9000) problems.push(`migrations/${f} is in the range reserved for local migrations`);
}
// `npm run init` writes its own config rather than copying this one, so every
// runtime setting has to be added in both places. 0.28 added `nodejs_compat`
// here only, and every fresh install's first deploy failed on `node:crypto`.
// Compare everything except the fields that name a deployment.
const generated = JSON.parse(stripJsonComments(initConfig({
  slug: "blyg-example-com",
  accountId: "0".repeat(32),
  host: "blyg.example.com",
  databaseName: "blyg-blyg-example-com",
  databaseId: "00000000-0000-0000-0000-000000000000",
  bucketName: "blyg-blyg-example-com-media",
})));
const runtime = (c: Record<string, any>): Record<string, unknown> => {
  const { name, account_id, routes, ...rest } = c;
  return {
    ...rest,
    d1_databases: c.d1_databases?.map(({ database_name, database_id, ...d }: Record<string, unknown>) => d),
    r2_buckets: c.r2_buckets?.map(({ bucket_name, ...b }: Record<string, unknown>) => b),
  };
};
for (const key of new Set([...Object.keys(runtime(config)), ...Object.keys(runtime(generated))])) {
  if (!isDeepStrictEqual(runtime(config)[key], runtime(generated)[key])) {
    problems.push(`scripts/init-config.ts writes a different "${key}" from wrangler.jsonc`);
  }
}
if (problems.length) {
  console.error(`the repository is not shippable:\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
console.log("shippable: wrangler.jsonc is the template, init writes the same runtime settings, and no migration is in the local range");
