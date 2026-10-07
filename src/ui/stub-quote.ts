/*
 * The stub editor's passage chooser (session 37). A stub opens quoting the
 * whole target; choosing a passage writes the partial grammar of §10.1 under
 * the directive, and "quote whole post" removes it again. Pure text in, text
 * out, so the two directions are testable without a browser.
 *
 * The quote is found the way publish finds it — the first own-line
 * `![[id]]` outside code, and the run of `>` lines directly under it
 * (`attachedQuote`) — so the chooser can never edit a different quote from
 * the one publish will check.
 */
import { ID_ALPHABET } from '../identity.ts';
import { codeRanges, inRanges, lineOffsets } from '../code-ranges.ts';
import { attachedQuote } from '../directives.ts';
import { normalizeSelection, quoteLines } from '../markdown.ts';

const DIRECTIVE_LINE = new RegExp(`^\\s*!\\[\\[([${ID_ALPHABET}]{26})\\]\\]\\s*$`);

/** Where the stub's quote of `id` is: its directive line and the line after its attached quote. */
function findQuote(md: string, id: string) {
  const lines = md.split('\n');
  const inert = codeRanges(md);
  const starts = lineOffsets(lines);
  for (let i = 0; i < lines.length; i++) {
    if (inRanges(inert, starts[i])) continue;
    if (DIRECTIVE_LINE.exec(lines[i])?.[1] !== id) continue;
    const { quoteMd, next } = attachedQuote(lines, i);
    return { lines, at: i, next, partial: quoteMd !== null };
  }
  return null;
}

/** 'whole' or 'passage' when the body quotes `id`, null when the author removed the quote. */
export function stubQuoteForm(md: string, id: string): 'whole' | 'passage' | null {
  const found = findQuote(md, id);
  return found ? (found.partial ? 'passage' : 'whole') : null;
}

/**
 * How many partial quotes of `id` the body holds. More than one is a running
 * commentary (Venkat's "Stubs are proto-response actions", session 37), which
 * the grammar has always allowed and the chooser must not collapse.
 */
export function passageCount(md: string, id: string): number {
  const lines = md.split('\n');
  const inert = codeRanges(md);
  const starts = lineOffsets(lines);
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (inRanges(inert, starts[i]) || DIRECTIVE_LINE.exec(lines[i])?.[1] !== id) continue;
    if (attachedQuote(lines, i).quoteMd !== null) count++;
  }
  return count;
}

/**
 * Another partial quote of `id`, inserted as its own block after the line
 * holding `at` (the editor's caret), or at the end when the caret is at the
 * very start or inside a quote's own lines — never splitting a quote.
 */
export function addStubQuote(md: string, id: string, passage: string, at: number): string {
  const selection = normalizeSelection(passage);
  if (!selection) return md;
  const block = `![[${id}]]\n${quoteLines(selection)}`;
  const lines = md.split('\n');
  const starts = lineOffsets(lines);
  let line = at <= 0 ? lines.length - 1 : lines.findIndex((_, i) => i === lines.length - 1 || starts[i + 1] > at);
  // Step past a quote the caret sits in (its `>` lines or its directive).
  while (line + 1 < lines.length && (/^\s*>/.test(lines[line + 1]) || DIRECTIVE_LINE.test(lines[line]) && /^\s*>/.test(lines[line + 1]))) line++;
  const before = lines.slice(0, line + 1).join('\n').replace(/\n+$/, '');
  const after = lines.slice(line + 1).join('\n').replace(/^\n+/, '');
  return `${before}\n\n${block}\n\n${after}`.replace(/\n+$/, '\n\n');
}

/**
 * The body with its quote of `id` set to `passage` (a browser selection), or
 * to the whole item when `passage` is null. A body with no quote of `id`
 * gains one at the top, where the stub action puts it.
 */
export function withStubQuote(md: string, id: string, passage: string | null): string {
  const selection = passage === null ? '' : normalizeSelection(passage);
  const block = [`![[${id}]]`, ...(selection ? [quoteLines(selection)] : [])].join('\n');
  const found = findQuote(md, id);
  if (!found) return `${block}\n\n${md.replace(/^\n+/, '')}`;
  const { lines, at, next } = found;
  return [...lines.slice(0, at), block, ...lines.slice(next)].join('\n');
}
