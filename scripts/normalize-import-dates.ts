import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeStoredImportDates } from '../src/importer/date-repair.ts';

export { normalizeStoredImportDates };
export async function normalizeImportDates(args: string[]) {
  const result = await normalizeStoredImportDates(async sql => {
    // Remote --file uses D1 import and returns statistics instead of query rows.
    const raw = execFileSync('npx', ['wrangler@4', 'd1', 'execute', 'DB', ...args, '--command', sql, '--json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    const response = JSON.parse(raw);
    if (!Array.isArray(response) || response.length !== 1 || response[0].success !== true || !Array.isArray(response[0].results)) throw new Error('Imported date repair received an invalid D1 result');
    const rows = response[0].results;
    if (rows.some((row: Record<string, unknown>) => !row || typeof row.subscription_id !== 'string' || sql.startsWith('SELECT') && (typeof row.remote_id !== 'string' || !(row.created === null || typeof row.created === 'string') || !(row.updated === null || typeof row.updated === 'string')))) throw new Error('Imported date repair received an invalid metadata row');
    return response[0];
  });
  console.log(`Imported dates normalized: ${result.scanned} inspected, ${result.changed} repaired`);
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) await normalizeImportDates(process.argv.slice(2));
