import { test, expect } from './fixture';

test('unchanged Studio polls check revisions without refetching collections, then receive another client change', async ({ page }) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await page.goto('/studio/login'); await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click(); await expect(page.locator('#composer-text')).toBeVisible();
  await page.evaluate(() => fetch('/api/settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ update_check: false, site_title: `Poll settings ${crypto.randomUUID()}` }) }));
  await page.clock.pauseAt(new Date(Date.now() + 10_000));
  async function tick(paths: string[]) {
    const seen = new Set<unknown>();
    const responses = paths.map(path => page.waitForResponse(response => {
      if (response.request().method() !== 'GET' || new URL(response.url()).pathname !== path || seen.has(response)) return false;
      seen.add(response); return true;
    }));
    await page.clock.runFor(15_000);
    await Promise.all(responses.map(async response => (await response).finished()));
    await page.clock.runFor(1); // Let query-collection application finish before the next tick.
    await page.evaluate(() => Promise.resolve());
  }
  await tick(['/api/changes', '/api/changes', '/api/settings', '/api/update-state']);
  const requests: string[] = [];
  page.on('request', request => { if (request.method() === 'GET' && new URL(request.url()).pathname.startsWith('/api/')) requests.push(new URL(request.url()).pathname); });
  await tick(['/api/changes', '/api/changes', '/api/update-state']);
  expect(requests.sort()).toEqual(['/api/changes', '/api/changes', '/api/update-state']);
  requests.length = 0;
  const marker = `Other client ${Date.now()}`;
  await page.evaluate(content_md => fetch('/api/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content_md }) }), marker);
  await tick(['/api/changes', '/api/changes', '/api/items', '/api/update-state']);
  expect(requests).toContain('/api/items');
  await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();
});

test('a failed initial Reading page recovers through the existing retry control', async ({ page }) => {
  await page.clock.install();
  await page.goto('/studio/login'); await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click(); await expect(page.locator('#composer-text')).toBeVisible();
  let fail = true;
  await page.route('**/api/reading?*', route => {
    if (fail) { fail = false; return route.fulfill({ status: 503, json: { error: 'controlled initial read failure' } }); }
    return route.continue();
  });
  await page.goto('/studio/reading?sub=all'); await expect(page.getByRole('alert')).toContainText('controlled initial read failure');
  const received = page.waitForResponse(response => new URL(response.url()).pathname === '/api/reading' && response.status() === 200);
  await page.getByRole('button', { name: 'retry', exact: true }).click();
  await (await received).finished(); await page.clock.runFor(1_000);
  await expect(page.locator('.entry').first()).toBeVisible();
});

test('a buffered query response keeps its pre-fetch revision and receives a later change next poll', async ({ page }) => {
  await page.clock.install();
  await page.goto('/studio/login'); await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click(); await expect(page.locator('#composer-text')).toBeVisible();
  const firstMarker = `First buffered client ${Date.now()}`;
  await page.evaluate(content_md => fetch('/api/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content_md }) }), firstMarker);
  await page.clock.pauseAt(new Date(Date.now() + 10_000));
  let release!: () => void, captured!: () => void;
  const gate = new Promise<void>(done => { release = done; }), ready = new Promise<void>(done => { captured = done; });
  let first = true;
  await page.route('**/api/items?*', async route => {
    if (!first) return route.continue();
    first = false; const response = await route.fetch(); captured(); await gate;
    await route.fulfill({ response });
  });
  try {
    await page.clock.runFor(15_000); await ready;
    const marker = `Buffered client ${Date.now()}`;
    expect(await page.evaluate(async content_md => (await fetch('/api/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content_md }) })).ok, marker)).toBe(true);
    const old = page.waitForResponse(response => new URL(response.url()).pathname === '/api/items' && response.request().method() === 'GET');
    release(); await (await old).finished(); await page.clock.runFor(1_000);
    // The first response can be one page of a larger collection load.
    await expect(page.getByText(firstMarker, { exact: false }).first()).toBeVisible();
    const fresh = page.waitForResponse(async response => new URL(response.url()).pathname === '/api/items' && response.request().method() === 'GET' && (await response.json()).items.some((item: { content_md: string }) => item.content_md === marker));
    await page.clock.runFor(15_000); await (await fresh).finished(); await page.clock.runFor(1_000);
    await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();
  } finally { release(); }
});
