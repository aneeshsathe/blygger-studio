/**
 * Linkification must not rebuild a growing token array for each email. The
 * upstream security advisory names this exact complexity fault:
 * https://github.com/markdown-it/markdown-it/security/advisories/GHSA-253c-mchw-3w2r
 * Model: doubling the number of soft-broken email lines permits at most3x token
 * copying plus fixed overhead (a conservative local linear-work guard).
 * Driver: production renderMarkdown with its real linkify configuration. Count
 * the size of token arrays passed to slice during synchronous rendering; keep
 * the native slice result, and restore the instrument in finally.
 * Refinement: output retains every link and copy work grows within the bound.
 * Limits: one named dependency work mechanism, not every regex/CPU/memory path.
 * This is a bounded metamorphic example, not generated grammar coverage.
 */
import { expect, it } from 'vitest';
import { renderMarkdown } from '../src/markdown.ts';
function work(lines: number) {
  const original = Array.prototype.slice;
  let copied = 0;
  Array.prototype.slice = function(...args: Parameters<typeof original>) {
    if (this.length && typeof this[0] === 'object' && this[0] && typeof this[0].type === 'string') copied += this.length;
    return original.apply(this, args);
  };
  try {
    const html = renderMarkdown('a@b.co\n'.repeat(lines));
    expect((html.match(/href="mailto:a@b.co"/g) ?? []).length).toBe(lines);
    return copied;
  } finally { Array.prototype.slice = original; }
}
it('bounds token-copy growth for adversarial soft-broken emails', () => {
  const small = work(256), large = work(512);
  expect(large, `linkify token-copy growth: ${small} -> ${large}`).toBeLessThanOrEqual(3 * small + 10_000);
});
