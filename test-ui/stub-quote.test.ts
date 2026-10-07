import { expect, test } from 'vitest';
import { stubQuoteForm, withStubQuote } from '../src/ui/stub-quote.ts';
import { renderMarkdown, selectionText } from '../src/markdown.ts';
import { attachedQuote } from '../src/directives.ts';

const ID = '7c9wk2mhq0v3xj8tn5rzfd41bg';
const OTHER = '1vgtgz0gq5b2c9k7d3m8r4n6xy';

test('a passage goes under the directive in the partial grammar, and back out again', () => {
  const whole = `![[${ID}]]\n\nMy reply.`;
  expect(stubQuoteForm(whole, ID)).toBe('whole');
  const partial = withStubQuote(whole, ID, 'First paragraph.\nSecond one.');
  expect(partial).toBe(`![[${ID}]]\n> First paragraph.\n>\n> Second one.\n\nMy reply.`);
  expect(stubQuoteForm(partial, ID)).toBe('passage');
  expect(withStubQuote(partial, ID, null)).toBe(whole);
});

test('choosing again replaces the passage rather than adding a second one', () => {
  const partial = `Lead-in.\n\n![[${ID}]]\n> old passage\n\nAfter.`;
  expect(withStubQuote(partial, ID, 'new passage')).toBe(`Lead-in.\n\n![[${ID}]]\n> new passage\n\nAfter.`);
});

test('an unmarked line right under the quote is the author\'s, and stays', () => {
  const md = `![[${ID}]]\n> old\nmy words`;
  expect(withStubQuote(md, ID, null)).toBe(`![[${ID}]]\nmy words`);
});

test('the browser\'s selection is normalized so publish\'s check sees the same text', () => {
  const md = withStubQuote(`![[${ID}]]\n\n`, ID, '  A  line\n\n\n- item one\n');
  const lines = md.split('\n');
  const quote = attachedQuote(lines, 0).quoteMd!;
  // A browser selection of a list item carries no marker; a typed one renders as a list either way.
  expect(selectionText(renderMarkdown(quote))).toBe('A line\nitem one');
});

test('only the stub target\'s directive is touched, and never one inside code', () => {
  const md = `\`\`\`\n![[${ID}]]\n\`\`\`\n\n![[${OTHER}]]\n> theirs\n\n![[${ID}]]\n\nreply`;
  const out = withStubQuote(md, ID, 'mine');
  expect(out).toBe(`\`\`\`\n![[${ID}]]\n\`\`\`\n\n![[${OTHER}]]\n> theirs\n\n![[${ID}]]\n> mine\n\nreply`);
});

test('a body whose quote was deleted gains one at the top', () => {
  expect(stubQuoteForm('just words', ID)).toBeNull();
  expect(withStubQuote('just words', ID, null)).toBe(`![[${ID}]]\n\njust words`);
});

test('a second passage is added as its own quote, not over the first (a running commentary)', async () => {
  const { addStubQuote, passageCount } = await import('../src/ui/stub-quote.ts');
  const md = `![[${ID}]]\n> first passage\n\nMy first point.\n\nMy closing point.`;
  expect(passageCount(md, ID)).toBe(1);
  const caret = md.indexOf('My first point.') + 3;
  const out = addStubQuote(md, ID, 'second passage', caret);
  expect(out).toBe(`![[${ID}]]\n> first passage\n\nMy first point.\n\n![[${ID}]]\n> second passage\n\nMy closing point.`);
  expect(passageCount(out, ID)).toBe(2);
  // A caret inside a quote never splits it; one at the start appends at the end.
  expect(addStubQuote(md, ID, 'x', md.indexOf('first passage'))).toBe(`![[${ID}]]\n> first passage\n\n![[${ID}]]\n> x\n\nMy first point.\n\nMy closing point.`);
  expect(addStubQuote(md, ID, 'x', 0)).toBe(`${md}\n\n![[${ID}]]\n> x\n\n`);
});
