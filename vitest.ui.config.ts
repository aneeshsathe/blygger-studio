import { defineConfig } from 'vitest/config';
const seed = process.env.ORACLE_SEED, target = process.env.ORACLE_TARGET;
if (process.env.ORACLE_PATH !== undefined && seed === undefined) throw new Error('ORACLE_PATH requires ORACLE_SEED');
if (seed !== undefined && (target !== 'studio-polling' || !Number.isInteger(Number(seed)))) throw new Error('UI replay requires ORACLE_TARGET=studio-polling and integer ORACLE_SEED');
export default defineConfig({
  define: { __ORACLE_REPLAY__: JSON.stringify({ target, seed, path: process.env.ORACLE_PATH }) },
  test: { include: ['test-ui/**/*.test.ts'], environment: 'node', ...(seed !== undefined ? { testNamePattern: 'studio-polling: replay$' } : {}) },
});
