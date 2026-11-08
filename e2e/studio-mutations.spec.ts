import { test, expect, type Page } from './fixture';
import { matchesGetItemBatch } from './read-batch';

async function login(page: Page) {
  await page.goto('/studio/login');
  await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click();
  await expect(page.locator('#composer-text')).toBeVisible();
}

test('the shared layout does not fetch the archive beyond the compose window', async ({ page }) => {
  // This endpoint seeds 30 old drafts in the disposable browser-test database.
  for (let i = 0; i < 3; i++) {
    expect((await page.request.post('http://127.0.0.1:8789/__fixture/polling-items')).ok()).toBe(true);
  }
  const reads: string[] = [];
  page.on('request', request => {
    if (request.method() === 'GET' && new URL(request.url()).pathname === '/api/items') reads.push(request.url());
  });
  await login(page);
  await expect(page.locator('.item-row')).toHaveCount(25);
  // Allow any unintended unbounded demand mounted with Layout to start fetching.
  await page.waitForTimeout(250);
  // The route's 25-row view and infinite query's lookahead can each fetch two pages.
  expect(reads.length).toBeLessThanOrEqual(4);
});

test('saving confirms the row without waiting for sorted-window acquisition', async ({ page }) => {
  await login(page);
  await page.locator('#composer-text').fill('Mutation boundary fixture');
  await page.locator('#composer-full').click();
  await expect(page.locator('#md-input')).toHaveValue('Mutation boundary fixture');
  // Finish window acquisition caused by the earlier create before measuring save.
  await page.waitForLoadState('networkidle');
  const id = new URL(page.url()).pathname.split('/').at(-1)!;
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 10_000));
  const reads: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(url => url.pathname === '/api/items' || url.pathname === `/api/items/${id}`, async route => {
    if (route.request().method() !== 'GET') return route.continue();
    reads.push(route.request().url());
    await gate;
    await route.continue();
  });
  await page.route('**/api/read-batch', async route => {
    if (matchesGetItemBatch(route.request(), id)) {
      reads.push(new URL(`/api/items/${id}`, route.request().url()).href);
      await gate;
    }
    await route.continue();
  });
  await page.locator('#md-input').fill('Confirmed without a refetch');
  await page.locator('#save-draft-btn').click();
  try {
    // A changed sort key may acquire a window. Broad invalidation would also
    // reread detail and keep the save pending until these gated reads finish.
    await expect(page.locator('.save-state')).toHaveText('saved');
    expect(reads.filter(url => new URL(url).pathname === `/api/items/${id}`)).toEqual([]);
  } finally { release(); }
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(reads.length).toBeLessThanOrEqual(4);
});

test('a thumb changes before the write completes and rolls back on failure', async ({ page }) => {
  await login(page);
  const path = '/api/signals/parity-native/00000000000000000000000001';
  expect((await page.request.delete(path)).ok()).toBe(true);
  await page.goto('/studio/reading?sub=parity-native');
  const entry = page.locator('.reading-entry').filter({ hasText: 'Native title' });
  const up = entry.getByRole('button', { name: 'thumbs up', exact: true });
  await expect(up).toHaveAttribute('aria-pressed', 'false');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let entered!: () => void;
  const writing = new Promise<void>(resolve => { entered = resolve; });
  await page.route(`**${path}`, async route => {
    entered(); await gate;
    await route.fulfill({ status: 503, json: { code: 'internal', message: 'vote unavailable' } });
  });
  await up.click(); await writing;
  try { await expect(up).toHaveAttribute('aria-pressed', 'true'); }
  finally { release(); }
  await expect(up).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('alert')).toContainText('vote unavailable');
});

test('signals loads only the visible tab and does not fetch the compose archive', async ({ page }) => {
  await login(page);
  await page.waitForLoadState('networkidle');
  const reads: string[] = [];
  page.on('request', request => {
    if (request.method() === 'GET') reads.push(new URL(request.url()).pathname);
  });
  // A document navigation also proves the root loader is independent of Compose.
  await page.goto('/studio/signals');
  await expect(page.getByRole('heading', { name: 'signals', exact: true })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(reads).toContain('/api/thumbs');
  expect(reads).not.toContain('/api/interactions');
  expect(reads).not.toContain('/api/items');
  await page.getByRole('button', { name: /^activity/ }).click();
  await expect.poll(() => reads.includes('/api/interactions')).toBe(true);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
