import { test, expect, type Locator, type Page } from './fixture';

// The lineage glyph, hex view and action ring (lineage.tsx), and the tips
// that fade (option C). Fixture (e2e-server.ts): the native item quotes its
// withdrawn sibling and stubs a plain URL; our mention-target thread has two
// verified mentions, one from the native item and one from a stranger.
const NATIVE = '00000000000000000000000001';
async function login(page: Page) {
  await page.goto('/studio/login'); await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click();
  await expect(page.locator('#composer-text')).toBeVisible();
}
const nativeEntry = (page: Page) => page.locator('.reading-entry').filter({ hasText: 'Native title' });
const retainedEntry = (page: Page) => page.locator('.reading-entry').filter({ hasText: 'Pinned retained text' });
async function openLineage(page: Page, entry: Locator) {
  await entry.locator('[data-action=lineage]').click();
  const sheet = page.getByRole('dialog', { name: 'lineage' });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.lg-graph')).toBeVisible();
  return sheet;
}
/** Preview an action the way this device would: hover with a mouse, one tap on a phone. */
async function previewAt(page: Page, target: Locator) {
  if ((await page.evaluate(() => matchMedia('(pointer: coarse)').matches))) await target.tap();
  else await target.hover();
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.removeItem('blygger.actionTips'));
});

test('the byline glyph counts what a post draws on and what draws on it', async ({ page }) => {
  await page.goto('/studio/reading?sub=parity-native');
  const glyph = nativeEntry(page).locator('[data-action=lineage]');
  await expect(glyph).toHaveAccessibleName('lineage: draws on 2, 0 known to draw on it');
  await expect(glyph.locator('.lg-glyph path.lg-edge')).toHaveCount(2);
  await expect(retainedEntry(page).locator('[data-action=lineage]')).toHaveAccessibleName('lineage: draws on 0, 1 known to draw on it');
  // A legacy feed has no item documents, so no lineage and no glyph.
  await page.goto('/studio/reading?sub=parity-rss');
  await expect(page.locator('.reading-entry').first()).toBeVisible();
  await expect(page.locator('[data-action=lineage]')).toHaveCount(0);
});

test('the hex view shows ancestors, previews a ghost per vertex, and commits on a second press', async ({ page }) => {
  await page.goto('/studio/reading?sub=parity-native');
  const sheet = await openLineage(page, nativeEntry(page));
  const graph = sheet.locator('.lg-graph');
  await expect(graph.locator('.lg-node')).toHaveCount(2);
  await expect(graph.locator('.lg-node').filter({ hasText: 'news.example' })).toContainText('responds to');
  await expect(graph.locator('.lg-node').filter({ hasText: 'Pinned retained' })).toContainText('quotes it');
  await expect(graph).toContainText('nothing known here draws on it yet');
  await expect(sheet.locator('.lg-explain')).toContainText('The bottom corners respond');

  // Each vertex previews: a ghost in the graph, the explanation beside it.
  await previewAt(page, graph.locator('[data-vertex=link]'));
  await expect(graph.locator('[data-ghost=link]')).toContainText('not sent');
  const explain = sheet.locator('.lg-explain');
  await expect(explain).toHaveAttribute('data-action', 'link');
  await expect(explain.locator('.lg-facts')).toContainText('the author is told?no — links are silent');
  await previewAt(page, graph.locator('[data-vertex=stub]'));
  await expect(graph.locator('[data-ghost=stub]')).toContainText('your response');
  await expect(explain.locator('.lg-facts')).toContainText('a response?yes');
  // quote a passage says the passage is chosen in the stub editor, and can run.
  await previewAt(page, graph.locator('[data-vertex=quote]'));
  await expect(explain).toContainText('in the stub editor');
  await expect(explain.getByRole('button', { name: 'quote a passage' })).toBeEnabled();

  // fork: preview, then press again to do it — the fork page for this item.
  const fork = graph.locator('[data-vertex=fork]');
  await previewAt(page, fork);
  await expect(explain).toHaveAttribute('data-action', 'fork');
  await fork.click();
  await expect(page).toHaveURL(new RegExp(`/fork\\?id=${NATIVE}&sub=parity-native`));
});

test('the explanation button runs the action: stub ↗ opens a response', async ({ page }) => {
  await page.goto('/studio/reading?sub=parity-native');
  const sheet = await openLineage(page, nativeEntry(page));
  await previewAt(page, sheet.locator('[data-vertex=stub]'));
  const created = page.waitForResponse(response => response.url().endsWith('/api/items') && response.request().method() === 'POST');
  await sheet.locator('.lg-explain').getByRole('button', { name: 'stub ↗', exact: true }).click();
  expect((await created).request().postDataJSON()).toEqual({ mode: 'response', source: { subscription_id: 'parity-native', remote_id: NATIVE } });
  await expect(page).toHaveURL(/\/edit\//);
  // Using it from the lineage counts toward its tip fading.
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('blygger.actionTips') || '{}').stub)).toBe(1);
});

test('pressing the hexagon opens the ring, whose slices animate what they make', async ({ page }) => {
  await page.goto('/studio/reading?sub=parity-native');
  const sheet = await openLineage(page, nativeEntry(page));
  const centre = sheet.getByRole('button', { name: 'open the action ring' });
  await centre.click();
  const ring = sheet.locator('.lg-ring');
  await expect(ring).toHaveClass(/open/);
  await expect(ring.locator('[data-wedge]')).toHaveCount(6);
  await expect(sheet.locator('[data-vertex]')).toHaveCount(0);
  await previewAt(page, ring.locator('[data-wedge=quote]'));
  const explain = sheet.locator('.lg-explain');
  await expect(explain.getByRole('img', { name: 'sketch: what quote a passage makes' })).toBeVisible();
  await expect(explain.locator('.lg-facts')).toContainText('their words in yoursjust the passage');
  await previewAt(page, ring.locator('[data-wedge=link]'));
  await expect(explain.getByRole('img', { name: 'sketch: what link post ↗ makes' })).toContainText('nothing is sent');
  await sheet.getByRole('button', { name: 'close the action ring' }).click();
  await expect(sheet.locator('[data-vertex]')).toHaveCount(6);
});

test('a node re-centres the view, and what you can do follows what is held here', async ({ page }) => {
  await page.goto('/studio/reading?sub=parity-native');
  const sheet = await openLineage(page, nativeEntry(page));
  await sheet.getByRole('button', { name: /^centre on Pinned retained/ }).click();
  await expect(sheet.locator('.lg-crumb')).toContainText('Native source · Pinned retained text.');
  const graph = sheet.locator('.lg-graph');
  await expect(graph.locator('.lg-node').filter({ hasText: 'Native title' })).toContainText('quotes this');
  await previewAt(page, graph.locator('[data-vertex=history]'));
  await expect(sheet.locator('.lg-explain')).toContainText("Its history opens from the post's own ⋯ sheet");
  await sheet.getByRole('button', { name: '← back', exact: true }).click();
  await expect(sheet.locator('.lg-crumb')).toContainText('Native source · Native title');
  // A {url} ancestor is not an item: nothing to centre on.
  await expect(sheet.getByRole('button', { name: /^centre on news\.example/ })).toHaveCount(0);
});

test('our own thread lists its verified mentions as what came from it', async ({ page }) => {
  // Other suites publish into the same fixture, so find the page it is on now.
  const index = await page.evaluate(async () => {
    for (let offset = 0; ; offset += 50) {
      const page = await (await fetch(`/api/reading?sub=own&limit=50&offset=${offset}`)).json() as { items: { own?: { contentHtml: string } }[]; total: number };
      const at = page.items.findIndex((row) => row.own?.contentHtml.includes('Mention target fixture'));
      if (at >= 0) return offset + at;
      if (offset + 50 >= page.total) return -1;
    }
  });
  expect(index).toBeGreaterThanOrEqual(0);
  await page.goto(`/studio/reading?sub=own&offset=${Math.floor(index / 25) * 25}`);
  const entry = page.locator('.reading-entry').filter({ hasText: 'Mention target fixture' });
  await expect(entry.locator('[data-action=lineage]')).toHaveAccessibleName('lineage: draws on 0, 2 known to draw on it');
  const sheet = await openLineage(page, entry);
  const list = sheet.locator('.lg-list').filter({ hasText: 'what came from it' });
  await list.locator('summary').click();
  await expect(list.locator('li')).toHaveCount(2);
  await expect(list.locator('li').filter({ hasText: 'Native title' })).toContainText('verified mention');
  await expect(list.locator('li').filter({ hasText: 'Source author' })).toHaveCount(1);
  await previewAt(page, sheet.locator('[data-vertex=stub]'));
  await expect(sheet.locator('.lg-explain')).toContainText('This is your own post');
});

test('tips: pointing at stub ↗ draws its ghost and a coach line until it has been used three times', async ({ page }) => {
  await page.goto('/studio/reading?sub=parity-native');
  const entry = nativeEntry(page);
  const stub = entry.getByRole('button', { name: 'stub ↗', exact: true });
  await stub.focus();
  await expect(entry.locator('[data-coach=stub]')).toContainText('stub ↗ — Respond to this post.');
  await expect(entry.locator('.lg-glyph [data-ghost=stub]')).toHaveCount(1);
  await stub.blur();
  await expect(entry.locator('[data-coach]')).toHaveCount(0);
  // The ⋯ sheet carries the same tips on its rows.
  await entry.getByRole('button', { name: 'more actions', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'actions' });
  await expect(menu.getByRole('button', { name: 'fork', exact: true })).toContainText('Start your own copy of this post.');
  await page.keyboard.press('Escape');
  // Used three times, the words go quiet; the ghost on the glyph stays.
  await page.evaluate(() => localStorage.setItem('blygger.actionTips', JSON.stringify({ stub: 3, fork: 3 })));
  await page.reload();
  await nativeEntry(page).getByRole('button', { name: 'stub ↗', exact: true }).focus();
  await expect(nativeEntry(page).locator('.lg-glyph [data-ghost=stub]')).toHaveCount(1);
  await expect(nativeEntry(page).locator('[data-coach]')).toHaveCount(0);
  await nativeEntry(page).getByRole('button', { name: 'more actions', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'actions' }).getByRole('button', { name: 'fork', exact: true })).not.toContainText('Start your own copy');
  await page.keyboard.press('Escape');
  // "show action tips again" brings them back.
  const sheet = await openLineage(page, nativeEntry(page));
  await sheet.getByRole('button', { name: 'show action tips again' }).click();
  await sheet.getByRole('button', { name: 'close', exact: true }).click();
  await nativeEntry(page).getByRole('button', { name: 'stub ↗', exact: true }).focus();
  await expect(nativeEntry(page).locator('[data-coach=stub]')).toBeVisible();
});

test('quote selection opens the stub editor', async ({ page }) => {
  // Since 0.31 a passage is chosen in the stub editor, not in the reading view.
  await page.goto('/studio/reading?sub=parity-native');
  const sheet = await openLineage(page, nativeEntry(page));
  await previewAt(page, sheet.locator('[data-vertex=quote]'));
  const created = page.waitForResponse(response => response.url().endsWith('/api/items') && response.request().method() === 'POST');
  await sheet.locator('.lg-explain').getByRole('button', { name: 'quote a passage' }).click();
  expect((await created).request().postDataJSON()).toEqual({ mode: 'response', source: { subscription_id: 'parity-native', remote_id: NATIVE } });
  await expect(page).toHaveURL(/\/edit\//);
  await expect(page.locator('[data-action=choose-passage]')).toBeVisible();
});
