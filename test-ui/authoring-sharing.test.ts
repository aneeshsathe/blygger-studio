import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { expect, test } from 'vitest';
import { itemTitle, permalink, plainText, textWithLink } from '../src/ui/plain-text.ts';

// Exercise the real copy/share handlers with a loaded first window and an older
// target that only a point read can supply. DOM fallback is not needed here.
const source = readFileSync(new URL('../src/ui/authoring.tsx', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('/** Resolve only own references'), source.indexOf('/** A row’s published words') > 0 ? source.indexOf('/** A row’s published words') : source.indexOf("/** A row's published words"));
const compiled = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const target = '0123456789abcdefghjkmnpqrs';
function harness() {
  const requests: string[] = [], clipboard: string[] = [], shared: unknown[] = [];
  let gate: Promise<void> | undefined, failure: unknown;
  const items = new Map(Array.from({ length: 25 }, (_, i) => [`recent-${i}`, { id: `recent-${i}`, status: 'public', contentMd: 'Recent.' }]));
  const bindings = {
    items, plainText, itemTitle, permalink, textWithLink,
    BlyggerApi: { async getItem({ path }: { path: { id: string } }) { requests.push(path.id); await gate; if (failure) throw failure; return { id: target, status: 'public', contentMd: '# Old title\n\nQuoted source body.' }; } },
    client: {}, unwrap: (value: unknown) => value,
    useSettings: () => ({ siteUrl: 'https://studio.test/' }), mount: '', location: { origin: 'https://studio.test' },
    navigator: { clipboard: { async writeText(text: string) { clipboard.push(text); } }, async share(data: unknown) { shared.push(data); } },
    toast() {}, DOMException,
  };
  const sharing = new Function(...Object.keys(bindings), `${compiled}\nreturn useSharing();`)(...Object.values(bindings));
  const item = { id: 'recent', kind: 'thread', md: `![[${target}]]\n\nSee [[${target}]].` };
  return { sharing, item, requests, clipboard, shared, fail(error: unknown) { failure = error; }, hold() { let release!: () => void; gate = new Promise<void>(resolve => { release = resolve; }); return release; } };
}

test('copy resolves only referenced own targets outside the loaded window', async () => {
  const h = harness(); await h.sharing.copy(h.item);
  expect(h.clipboard).toEqual(['“Old title Quoted source body.”\n\nSee Old title.\n\nhttps://studio.test/t/recent/']);
  expect(h.requests).toEqual([target]);
});

test('share waits for point resolution before sending the text', async () => {
  const h = harness(), release = h.hold();
  const sharing = h.sharing.share(h.item); await Promise.resolve();
  expect(h.shared).toEqual([]); release(); await sharing;
  expect(h.shared).toEqual([{ title: itemTitle(h.item.md), text: '“Old title Quoted source body.”\n\nSee Old title.', url: 'https://studio.test/t/recent/' }]);
  expect(h.requests).toEqual([target]);
});

test('missing own targets retain the existing fallback but read failures do not silently lose text', async () => {
  const missing = harness(); missing.fail(Object.assign(new Error('missing'), { statusCode: 404 }));
  await missing.sharing.copy(missing.item);
  expect(missing.clipboard[0]).toContain(`See ${target}.`);
  const failed = harness(); failed.fail(Object.assign(new Error('unavailable'), { statusCode: 503 }));
  await expect(failed.sharing.copy(failed.item)).rejects.toThrow('unavailable');
  expect(failed.clipboard).toEqual([]);
});
