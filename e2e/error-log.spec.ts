import { test, expect, type Page } from './fixture';

// The error log (ROADMAP row 59): a banner can vanish before it is read, so what
// it said is kept on the device, linked from the banner and listed in Settings.
async function login(page: Page) {
  await page.goto('/studio/login');
  await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click();
  await expect(page.locator('#composer-text')).toBeVisible();
}
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('blyg-error-log') ?? '[]'));

test('a failed save shows a banner that leads to the logged error in Settings', async ({ page, context }, info) => {
  await login(page);
  // Leaving a page drops its requests in flight, which is not an error to log.
  await page.goto('/studio/settings');
  await expect(page.locator('#error-log-empty')).toBeVisible();
  expect(await stored(page)).toEqual([]);
  // The server refuses this save.
  await page.route('**/api/settings', (route) =>
    route.request().method() === 'GET'
      ? route.fallback()
      : route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'the disk is on fire', code: 'test-failure' }) }));
  // A save with nothing changed asks the server nothing, so change something.
  await page.getByLabel('Site title').fill(`error log ${info.project.name}`);
  await page.getByRole('button', { name: 'save settings', exact: true }).click();
  const banner = page.locator('.error-banner', { hasText: 'the disk is on fire' });
  await expect(banner).toBeVisible();
  await banner.getByRole('link', { name: 'details', exact: true }).click();
  await expect(page).toHaveURL(/\/studio\/settings#errors$/);
  const row = page.locator('.error-log li').first();
  await expect(row.locator('summary')).toContainText('the disk is on fire');
  await row.locator('summary').click();
  await expect(row.locator('pre')).toContainText('status 500 · code test-failure · ');
  await expect(row.locator('pre')).toContainText('/api/settings');
  await expect(row.locator('pre')).toContainText(/from banner · at \S*\/studio\/settings · /);
  const [entry] = await stored(page);
  expect(entry).toMatchObject({ message: 'the disk is on fire', status: 500, code: 'test-failure', source: 'banner', count: 1 });

  // It is still there after a reload, which the banner is not.
  await page.unroute('**/api/settings');
  await page.reload();
  await expect(page.locator('.error-banner')).toHaveCount(0);
  await expect(page.locator('.error-log li')).toHaveCount(1);

  if (info.project.name === 'desktop') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#error-log-copy').click();
    await expect(page.locator('#error-log-copy')).toHaveText('copied');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toMatch(/^blygger-studio \d+\.\d+\.\d+\nuser agent: Mozilla/);
    expect(text).toContain('BlyggerApiError: the disk is on fire');
  }
  // Sharing needs a real share sheet; the download is what a desktop gets.
  if (info.project.name === 'desktop') {
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#error-log-export').click()]);
    expect(download.suggestedFilename()).toMatch(/^blygger-studio-errors-\d{4}-\d\d-\d\d-\d\d-\d\d-\d\d\.json$/);
    const exported = JSON.parse((await (await import('node:fs/promises')).readFile(await download.path(), 'utf8')));
    expect(exported.client.name).toBe('blygger-studio');
    expect(exported.device['user agent']).toContain('Mozilla');
    expect(exported.device.window).toMatch(/^\d+×\d+$/);
    expect(exported.entries).toHaveLength(1);
    expect(exported.entries[0]).toMatchObject({ message: 'the disk is on fire', status: 500 });
  }
  await page.locator('#error-log-clear').click();
  await expect(page.locator('#error-log-empty')).toBeVisible();
  expect(await stored(page)).toEqual([]);
});

test('an error no banner shows is logged too; a cancelled request is not', async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.removeItem('blyg-error-log'));
  await page.evaluate(() => {
    setTimeout(() => { throw new Error('thrown outside React'); });
    void Promise.reject(new Error('nobody awaited this'));
    void Promise.reject(new DOMException('The operation was aborted', 'AbortError'));
  });
  await expect.poll(async () => (await stored(page)).map((entry: { message: string; source: string }) => `${entry.source}: ${entry.message}`).sort())
    .toEqual(['rejection: nobody awaited this', 'uncaught: thrown outside React']);
});
