import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { expect, test } from 'vitest';

// Run the actual pane with controlled native-query states. The Node suite has
// no DOM renderer; JSX nodes let us inspect the text and error receiver.
const source = ts.createSourceFile('reader-links.tsx', readFileSync(new URL('../src/ui/reader-links.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const pane = source.statements.find((node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && node.name?.text === 'HistoryPane');
if (!pane) throw new Error('Missing HistoryPane');
const compiled = ts.transpileModule(pane.getText(source), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, jsxFactory: 'jsx', jsxFragmentFactory: 'Fragment' },
}).outputText;
type Element = { type: unknown; props: Record<string, any>; children: unknown[] };
function elements(tree: unknown): Element[] {
  if (!tree || typeof tree !== 'object' || !('props' in tree)) return [];
  const node = tree as Element;
  return [node, ...node.children.flat(Infinity).flatMap(elements)];
}
function text(tree: unknown): string {
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  if (!tree || typeof tree !== 'object' || !('children' in tree)) return '';
  return (tree as Element).children.flat(Infinity).map(text).join('');
}
function harness() {
  const history = { data: [] as any[], isLoading: false, status: 'ready', hasNextPage: false };
  let actionError: unknown, clearError: unknown;
  const bindings = {
    useTrail: () => ({ stack: [], trail: 'current' }),
    useLiveInfiniteQuery: () => history,
    useState: () => [actionError, (error: unknown) => { actionError = error; }],
    useMemo: (read: () => unknown) => read(),
    browse: {}, client: {},
    clearBrowse: async () => { if (clearError) throw clearError; },
    confirm: async () => true, endTrail() {},
    viaWord: () => 'link', ReaderLink: 'ReaderLink', popTo() {},
    Sheet: Object.assign('Sheet', { Close: 'Sheet.Close' }), Button: 'Button', Failure: 'Failure', Fragment: 'Fragment',
    jsx: (type: unknown, props: Record<string, any>, ...children: unknown[]) => ({ type, props: props ?? {}, children }),
  };
  const renderPane = new Function(...Object.keys(bindings), `${compiled}\nreturn HistoryPane;`)(...Object.values(bindings));
  return { history, failClear(error: unknown) { clearError = error; }, render: () => renderPane({ open: true, onClose() {} }) };
}
const step = { id: 1, trail: 'older', at: '2026-10-31T00:00:00Z', parentId: null, origin: 'https://example.com/', remoteId: 'item', via: 'link', title: 'Earlier item' };
const failure = (tree: unknown) => elements(tree).find(node => node.type === 'Failure')?.props.error;

test('history shows loading while its first page is pending', () => {
  const pane = harness(); pane.history.isLoading = true; pane.history.status = 'loading';
  const rendered = pane.render();
  expect(text(rendered)).toMatch(/loading/i);
  expect(text(rendered)).not.toContain('Nothing yet.');
});

test('history shows initial read failure and recovers to the empty state', () => {
  const pane = harness(); pane.history.status = 'error';
  expect(failure(pane.render())).toBeInstanceOf(Error);
  pane.history.status = 'ready';
  expect(failure(pane.render())).toBeUndefined();
  expect(text(pane.render())).toContain('Nothing yet.');
});

test('later-page failure keeps earlier walks visible with an error', () => {
  const pane = harness(); pane.history.data = [step]; pane.history.status = 'error';
  const rendered = pane.render();
  expect(failure(rendered)).toBeInstanceOf(Error);
  expect(text(rendered)).toContain('Earlier item');
});

test('history still shows a clear-action failure', async () => {
  const pane = harness(); pane.history.data = [step];
  const error = new Error('clear failed'); pane.failClear(error);
  const clear = elements(pane.render()).find(node => node.type === 'Button' && text(node).trim() === 'clear history');
  expect(clear).toBeDefined();
  await clear!.props.onClick();
  await Promise.resolve(); await Promise.resolve();
  expect(failure(pane.render())).toBe(error);
});
