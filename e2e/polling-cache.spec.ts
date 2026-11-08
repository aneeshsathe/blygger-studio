import { test, expect } from './fixture';

test('unchanged Studio polls check revisions without refetching collections, then receive another client change', async ({ page }) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await page.goto('/studio/login'); await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click(); await expect(page.locator('#composer-text')).toBeVisible();
  await page.evaluate(() => fetch('/api/settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ updateCheck: false, siteTitle: `Poll settings ${crypto.randomUUID()}` }) }));
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
  await tick(['/api/changes', '/api/update-state']);
  const requests: string[] = [];
  page.on('request', request => { if (request.method() === 'GET' && new URL(request.url()).pathname.startsWith('/api/')) requests.push(new URL(request.url()).pathname); });
  await tick(['/api/changes', '/api/update-state']);
  // Each native window/boundary/summary observer checks revisions. An unchanged
  // poll must still fetch no collection bodies or summaries.
  expect(requests.filter(path => path === '/api/changes').length).toBeGreaterThan(0);
  expect(requests.filter(path => path !== '/api/changes')).toEqual(['/api/update-state']);
  requests.length = 0;
  const marker = `Other client ${Date.now()}`;
  await page.evaluate(content_md => fetch('/api/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contentMd: content_md }) }), marker);
  await tick(['/api/changes', '/api/items', '/api/update-state']);
  expect(requests).toContain('/api/items');
  await expect(page.getByText(marker, { exact: false }).first()).toBeVisible();
});

test('a failed initial Reading page recovers through the existing retry control', async ({ page }) => {
  await page.clock.install();
  await page.goto('/studio/login'); await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click(); await expect(page.locator('#composer-text')).toBeVisible();
  let fail = true;
  await page.route('**/api/reading?*', route => {
    if (fail) { fail = false; return route.fulfill({ status: 503, json: { code: 'internal', message: 'controlled initial read failure' } }); }
    return route.continue();
  });
  await page.goto('/studio/reading?sub=all'); await expect(page.getByRole('alert')).toContainText('controlled initial read failure');
  const received = page.waitForResponse(response => new URL(response.url()).pathname === '/api/reading' && response.status() === 200);
  await page.getByRole('button', { name: 'retry', exact: true }).click();
  await (await received).finished(); await page.clock.runFor(1_000);
  await expect(page.locator('.entry').first()).toBeVisible();
});

test('a buffered cursor page receives a later change by the next poll', async ({ page, request }) => {
  await page.clock.install();
  await page.goto('/studio/login'); await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click(); await expect(page.locator('#composer-text')).toBeVisible();
  // Reach continuation requests even when this case runs alone.
  expect((await request.post('http://127.0.0.1:8789/__fixture/polling-items')).status()).toBe(204);
  const firstMarker = `First buffered client ${Date.now()}`;
  await page.evaluate(content_md => fetch('/api/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contentMd: content_md }) }), firstMarker);
  await page.clock.pauseAt(new Date(Date.now() + 10_000));
  let release!: () => void, captured!: () => void;
  const gate = new Promise<void>(done => { release = done; }), ready = new Promise<void>(done => { captured = done; });
  let first = true;
  let capturedRequest!: object, capturedStatus!: number;
  let capturedPage!: { items: { contentMd: string }[]; page: { nextCursor: string | null } };
  await page.route('**/api/items?*', async route => {
    const query = new URL(route.request().url()).searchParams;
    if (!first || query.has('cursor') || query.has('id') || query.has('updated')) return route.continue();
    first = false; capturedRequest = route.request();
    const response = await route.fetch(); capturedStatus = response.status();
    capturedPage = await response.json(); captured(); await gate;
    await route.fulfill({ response });
  });
  try {
    await page.clock.fastForward(15_000); await ready;
    expect(capturedStatus).toBe(200);
    expect(capturedPage.items.some(item => item.contentMd === firstMarker)).toBe(true);
    expect(capturedPage.page.nextCursor).toBeTruthy();
    const marker = `Buffered client ${Date.now()}`;
    // A native underfilled window may acquire the fresh generation immediately.
    // Observe it before the write; cursor-expired errors are not item pages.
    const fresh = page.waitForResponse(async response => new URL(response.url()).pathname === '/api/items' && response.request().method() === 'GET' && response.status() === 200 && (await response.json()).items.some((item: { contentMd: string }) => item.contentMd === marker));
    const old = page.waitForResponse(response => response.request() === capturedRequest);
    expect(await page.evaluate(async content_md => (await fetch('/api/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contentMd: content_md }) })).ok, marker)).toBe(true);
    expect(capturedPage.items.some(item => item.contentMd === marker)).toBe(false);
    release(); await (await old).finished(); await page.clock.fastForward(1_000);
    // A changed continuation can discard the old acquisition before any row renders.
    await page.clock.fastForward(15_000); await (await fresh).finished();
    // Network completions can schedule collection application after a clock advance.
    // Advance rendering frames while waiting, without another 15-second poll.
    await expect.poll(async () => {
      await page.clock.runFor(16);
      return Promise.all([firstMarker, marker].map(text => page.getByText(text, { exact: false }).first().isVisible()));
    }).toEqual([true, true]);
  } finally { release(); }
});

// Delivery was never the delay: live mentions verify in seconds. What lagged
// was every view of them. A verified mention written by the receiver (here the
// fixture's stand-in for verifyMention) must reach an open mentions view within
// one poll, and a view resumed from the background must check at once.
test('a newly verified mention reaches the open mentions view in one poll, and a resumed view checks at once', async ({ page, request }) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await page.goto('/studio/login'); await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click(); await expect(page.locator('#composer-text')).toBeVisible();
  const marker = `Live mention target ${crypto.randomUUID()}`;
  const item = await page.evaluate(async content_md => {
    const created = await (await fetch('/api/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contentMd: content_md, kind: 'thread' }) })).json() as { id: string; revision: number };
    await fetch(`/api/items/${created.id}/publish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ expectedRevision: created.revision }) });
    return created.id;
  }, marker);
  await page.goto('/studio/mentions');
  await expect(page.locator('.mention-group').first()).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 10_000));
  const group = page.locator('.mention-group').filter({ hasText: marker });
  await expect(group).toHaveCount(0);
  const id = `live${Date.now()}`;
  expect((await request.post('http://127.0.0.1:8789/__fixture/verified-mention', { data: { id, item, origin: 'https://responder.example/' } })).status()).toBe(204);
  await page.clock.runFor(15_000);
  await expect(group).toContainText('1 responses');
  await expect(group).toContainText('Live responder');
  await expect(group.getByRole('button', { name: 'hide from page', exact: true })).toBeVisible();

  // Seeing the new row does not mean every group's lookahead read has finished.
  // Drain that visible read wave before testing background polling. The clock
  // remains short of the next 15-second tick.
  for (let frame = 0; frame < 2; frame++) {
    await page.clock.runFor(16);
    await page.waitForLoadState('networkidle');
  }

  // Backgrounded: no reads at all, however long it stays hidden.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  });
  const reads: string[] = [];
  page.on('request', r => {
    const path = new URL(r.url()).pathname;
    if (path.startsWith('/api/') && (r.method() === 'GET' || path === '/api/read-batch')) reads.push(path);
  });
  expect(await page.evaluate(async id => (await fetch(`/api/mentions/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hidden: true }) })).ok, id)).toBe(true);
  await page.clock.runFor(60_000);
  expect(reads).toEqual([]);
  // Resumed: the check runs on the visibility change, not at the next tick.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  });
  // The clock stays paused: dispatch the batch and rendering frames, without
  // advancing to another 15-second poll.
  await expect.poll(async () => {
    await page.clock.runFor(16);
    return group.getByRole('button', { name: 'show on page', exact: true }).isVisible();
  }).toBe(true);
  expect(reads).toContain('/api/changes');
});
