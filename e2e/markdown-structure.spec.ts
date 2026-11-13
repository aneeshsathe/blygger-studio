import { fixtureJson } from './api-fixture';
import { test, expect, type Page } from './fixture';

// Markdown's structure in a textarea: Tab and Shift+Tab nest a list item,
// Shift+Enter breaks a line inside a paragraph, and the toolbar has each for a
// keyboard without a Tab key. What is typed must render as what was meant.
async function login(page: Page) {
  await page.goto('/studio/login');
  await page.locator('[name=password]').fill('test-password');
  await page.getByRole('button', { name: 'log in', exact: true }).click();
  await expect(page.locator('#composer-text')).toBeVisible();
}
async function open(page: Page, contentMd: string) {
  await login(page);
  const { json } = await page.evaluate(fixtureJson, { method: 'POST', path: '/api/items', body: { contentMd, kind: 'thread' } });
  await page.goto(`/studio/edit/${json.id}`);
  await expect(page.locator('#md-input')).toBeVisible();
}
const box = (page: Page) => page.locator('#md-input');
const end = async (page: Page) => {
  await box(page).focus();
  await box(page).evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(el.value.length, el.value.length));
};

test('Tab nests a list item, Shift+Tab brings it back, and undo takes the key back', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'a hardware keyboard');
  await open(page, '- fruit\n- apples');
  await end(page);
  await page.keyboard.press('Tab');
  await expect(box(page)).toHaveValue('- fruit\n    - apples');
  await expect(box(page)).toBeFocused();
  await page.keyboard.type('\n    - pears');
  await expect(page.locator('#preview-body ul ul li')).toHaveText(['apples', 'pears']);
  await page.keyboard.press('Shift+Tab');
  await expect(box(page)).toHaveValue('- fruit\n    - apples\n- pears');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
  await expect(box(page)).toHaveValue('- fruit\n    - apples\n    - pears');
});

test('Tab off a list leaves the text alone and moves on', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'a hardware keyboard');
  await open(page, 'Plain prose.');
  await end(page);
  await page.keyboard.press('Tab');
  await expect(box(page)).toHaveValue('Plain prose.');
  await expect(box(page)).not.toBeFocused();
});

test('Shift+Enter breaks a line of verse inside one paragraph', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'a hardware keyboard');
  await open(page, 'Tyger Tyger, burning bright,');
  await end(page);
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('In the forests of the night;');
  await expect(box(page)).toHaveValue('Tyger Tyger, burning bright,\\\nIn the forests of the night;');
  await expect(page.locator('#preview-body p')).toHaveCount(1);
  await expect(page.locator('#preview-body p br')).toHaveCount(1);
});

test('the toolbar does the same without a Tab key, and makes a code block', async ({ page }, info) => {
  await open(page, '- fruit\n- apples');
  await end(page);
  if (info.project.name === 'mobile') await page.locator('.editor-grid').evaluate((el) => el.setAttribute('data-pane', 'draft'));
  const tool = (name: string) => page.locator(`.ed-tools [data-action=md-${name}]`);
  await tool('indent').click();
  await expect(box(page)).toHaveValue('- fruit\n    - apples');
  await expect(box(page)).toBeFocused();
  await tool('outdent').click();
  await expect(box(page)).toHaveValue('- fruit\n- apples');
  await tool('break').click();
  await expect(box(page)).toHaveValue('- fruit\n- apples\\\n');
  await page.keyboard.type('and pears');
  await tool('code').click();
  await page.keyboard.type('let a = 1;');
  await expect(box(page)).toHaveValue('- fruit\n- apples\\\nand pears\n\n```\nlet a = 1;\n```');
  // The first item of a list has nothing to go under.
  await box(page).evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(3, 3));
  await tool('indent').click();
  await expect(page.getByText('Put the cursor on a list item that has another above it.')).toBeVisible();
  await expect(box(page)).toHaveValue(/^- fruit\n/);
});
