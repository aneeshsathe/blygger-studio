import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const oracleTarget = process.env.ORACLE_TARGET, oracleSeed = process.env.ORACLE_SEED;
if (process.env.ORACLE_PATH !== undefined && oracleSeed === undefined) throw new Error("ORACLE_PATH requires ORACLE_SEED");
if (oracleSeed !== undefined && (!oracleTarget || !["item-lifecycle", "pagination", "patch-atomicity", "authorization", "oauth-storage", "polling-cache"].includes(oracleTarget) || !Number.isInteger(Number(oracleSeed)))) throw new Error("Replay requires a known ORACLE_TARGET and integer ORACLE_SEED");

export default defineConfig({
  define: {
    __ORACLE_REPLAY__: JSON.stringify({ target: process.env.ORACLE_TARGET, seed: process.env.ORACLE_SEED, path: process.env.ORACLE_PATH }),
  },
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readD1Migrations(path.join(import.meta.dirname, "migrations"));
      return {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          // Background delivery and update checks cannot reach the real network.
          outboundService: () => new Response(null, { status: 503 }),
          bindings: {
            TEST_MIGRATIONS: migrations,
            OWNER_PASSWORD: "test-password",
            COOKIE_SECRET: "test-cookie-secret",
            // Pin the default mount explicitly (matches wrangler.jsonc vars);
            // mount.test.ts exercises other mounts via makeApp() directly.
            MOUNT: "/blyg",
            // The owner's per-minute API budget (0.28) is a production guard.
            // Property tests issue far more than 120 writes a minute and failed
            // about one run in six on it; tests of the budget set their own.
            API_READ_LIMIT: "100000",
            API_WRITE_LIMIT: "100000",
          },
        },
      };
    }),
  ],
  test: {
    ...(oracleSeed !== undefined ? { testNamePattern: `${oracleTarget}: replay$` } : {}),
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/apply-migrations.ts"],
  },
});
