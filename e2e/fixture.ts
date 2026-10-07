import { test as base } from '@playwright/test';
export { expect, type Page, type Locator } from '@playwright/test';

// Each test is a separate browser user at a stable synthetic edge identity.
// Preserve real rate limits; unrelated test histories must not share a budget.
export const test = base.extend<{ edgeIdentity: void }>({
  edgeIdentity: [async ({ context }, use) => {
    const ip = 'fd00:' + crypto.randomUUID().replaceAll('-', '').match(/.{4}/g)!.slice(0, 7).join(':');
    await context.setExtraHTTPHeaders({ 'CF-Connecting-IP': ip });
    await use();
  }, { auto: true }],
});
