import { codeRanges, inRanges, lineOffsets } from "./code-ranges.ts";
import { DIRECTIVE_LINE, RESERVED_LINE } from "./grammar.ts";
import MarkdownIt from "markdown-it";

const QUOTE_LINE = /^\s*>/;

/** The renderer's block grammar, used here only to measure a blockquote (§10.1, #76). */
const parser = new MarkdownIt({ html: false });

/**
 * How many of `lines` (the first of which is a quote line) the blockquote
 * opening there spans: CommonMark's extent, **lazy continuation included**
 * (spec §10.1 as revised under decision #76). A line without its own `>`
 * belongs to the quote only when it would continue the quote's paragraph — not
 * after a `>` line that is empty, and not when it opens a block of its own (a
 * heading, list item, fence, thematic break). Measured by markdown-it, the
 * parser that renders the selection, so the two cannot disagree about where
 * the quote ends.
 *
 * Two departures from a bare CommonMark parse, both from the grammar being
 * line-based: a quote line's leading whitespace is ignored, as the run of `>`
 * lines always allowed; and an unprefixed directive (or reserved `@vN`) line
 * is never swallowed as lazy text — it is a directive wherever it stands,
 * where CommonMark alone would read it as paragraph continuation.
 */
function quoteExtent(lines: string[]): number {
  // A blockquote never crosses a blank line, so parse only up to the first.
  let end = 0;
  while (end < lines.length && lines[end].trim() !== "") end++;
  const slice = lines.slice(0, end).map((l) => (QUOTE_LINE.test(l) ? l.replace(/^\s*/, "") : l));
  const open = parser.parse(slice.join("\n"), {}).find((t) => t.type === "blockquote_open" && t.level === 0);
  let n = open?.map && open.map[0] === 0 ? Math.min(open.map[1], end) : 1;
  for (let k = 1; k < n; k++) {
    if (!QUOTE_LINE.test(lines[k]) && (DIRECTIVE_LINE.test(lines[k]) || RESERVED_LINE.test(lines[k]))) {
      n = k;
      break;
    }
  }
  return n;
}

/**
 * The blockquote attached to the directive at `lines[i]` — a partial
 * transclusion's selection (§10.1) — and the line after it. `quoteMd` is the
 * quote's markdown with one level of `>` taken off, or null when no quote is
 * attached: the next line is not a quote line (a blank line detaches).
 *
 * Every reader of the partial form — publish, preview, the stub editor, fork
 * flattening, plain text — finds the quote here, so they share one extent.
 */
export function attachedQuote(lines: string[], i: number): { quoteMd: string | null; next: number } {
  if (i + 1 >= lines.length || !QUOTE_LINE.test(lines[i + 1])) return { quoteMd: null, next: i + 1 };
  const n = quoteExtent(lines.slice(i + 1));
  // Strip the marker and at most one following space — the usual markdown
  // convention, and the one that leaves "> > nested" nested. A lazy line has
  // no marker and is kept as written.
  const run = lines.slice(i + 1, i + 1 + n).map((l) => (QUOTE_LINE.test(l) ? l.replace(/^\s*>\s?/, "") : l));
  return { quoteMd: run.join("\n"), next: i + 1 + n };
}

export function extractDirectives(contentMd: string): { count: number; withoutDirectives: string } {
  const lines = contentMd.split("\n");
  const kept: string[] = [];
  let count = 0;
  // Same inert regions as the publish walker: code (§10.1, #54).
  const inert = codeRanges(contentMd);
  const starts = lineOffsets(lines);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (inRanges(inert, starts[i])) {
      kept.push(line);
      continue;
    }
    if (RESERVED_LINE.test(line)) {
      count++;
      continue;
    }
    if (DIRECTIVE_LINE.test(line)) {
      count++;
      // The attached blockquote belongs to the directive, not to the prose:
      // leaving it behind would show the author their own quote twice in a
      // draft preview — once inside the baked snapshot and once as a stray
      // quotation under it.
      i = attachedQuote(lines, i).next - 1;
      continue;
    }
    kept.push(line);
  }
  return { count, withoutDirectives: kept.join("\n") };
}
