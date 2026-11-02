import { expect, test } from 'vitest';
import { itemTitle, permalink, plainText, textWithLink } from '../src/ui/plain-text.ts';

const A = '0123456789abcdefghjkmnpqrs';
const B = 'abcdefghjkmnpqrstvwxyz0123';

test('markdown syntax is stripped to its words, paragraph by paragraph', () => {
  const md = '# On maintenance\n\nSome **bold** and _soft_ words, a [link](https://example.com) and `code`.\n\n![a figure](/media/x.png)\n\n- one\n- two';
  expect(plainText(md)).toBe('On maintenance\n\nSome bold and soft words, a link and code.\n\none\n\ntwo');
});

test('a quote directive becomes “…”: its passage when it has one, else the quoted item', () => {
  const resolve = (id: string, form: string) => (id === A && form === 'quote' ? 'The whole quoted item.' : undefined);
  expect(plainText(`Before.\n\n![[${A}]]\n> a *chosen*\n> passage\n\nAfter.`, resolve)).toBe('Before.\n\n“a chosen passage”\n\nAfter.');
  expect(plainText(`![[${A}]]\n\nMine.`, resolve)).toBe('“The whole quoted item.”\n\nMine.');
  // Nothing known about it: the quote is left out rather than shown empty.
  expect(plainText(`![[${B}]]\n\nMine.`, resolve)).toBe('Mine.');
});

test('a passage’s lazy continuation lines are part of it, as publish reads them (§10.1, #76)', () => {
  expect(plainText(`![[${A}]]\n> a chosen\npassage\n\nAfter.`)).toBe('“a chosen passage”\n\nAfter.');
  expect(plainText(`![[${A}]]\n> a chosen passage\n>\nMine.`)).toBe('“a chosen passage”\n\nMine.');
});

test('an ordinary blockquote is a quote too', () => {
  expect(plainText('> Someone said\n> this.\n\nI agree.')).toBe('“Someone said this.”\n\nI agree.');
});

test('generated text is kept, impyrt included; an ungenerated scope contributes nothing', () => {
  expect(plainText('Mine. [TK]impyrt=A model wrote this.[/TK] Mine again.')).toBe('Mine. A model wrote this. Mine again.');
  expect(plainText('Start. [TK]summarise[=]The summary.[/TK]')).toBe('Start. The summary.');
  expect(plainText('Start.[TK]not yet[/TK]')).toBe('Start.');
});

test('[[id]] becomes the linked item’s text, or its id when nothing is known', () => {
  const resolve = (id: string, form: string) => (id === A && form === 'link' ? 'On protocols' : undefined);
  expect(plainText(`See [[${A}]] and [[${B}]].`, resolve)).toBe(`See On protocols and ${B}.`);
});

test('the grammar is inert inside code', () => {
  expect(plainText(`\`\`\`\n![[${A}]]\n\`\`\``, () => 'resolved')).toBe(`![[${A}]]`);
});

test('a title, the clipboard shape and the permalink', () => {
  expect(itemTitle('# Heading\n\nBody text.')).toBe('Heading');
  expect(itemTitle(`![[${A}]]\n\nJust **words** here.`)).toBe('Just words here.');
  expect(textWithLink('Words.', 'https://b.example/f/x/')).toBe('Words.\n\nhttps://b.example/f/x/');
  expect(permalink('https://b.example/blyg', 'thread', 'x')).toBe('https://b.example/blyg/t/x/');
  expect(permalink('https://b.example/', 'fragment', 'x')).toBe('https://b.example/f/x/');
});
