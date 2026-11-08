// Where `![[id]]` and `[[id]]` are inert text: inside code (spec §10.1,
// decision #54 — "inside code spans and code blocks"; studio#4).
//
// Code *blocks* come from markdown-it's own block parser, the same one that
// renders the text, so fences (``` and ~~~), indented code and fences nested in
// list items or blockquotes are found exactly as the renderer will see them —
// a hand-written fence scanner would disagree with it at the edges. Code
// *spans* are found by the CommonMark rule markdown-it also follows: a run of N
// backticks opens a span that the next run of exactly N backticks closes, and a
// span never crosses a blank line.

import MarkdownIt from "markdown-it";

const parser = new MarkdownIt({ html: false });

export type Range = [start: number, end: number];

export function codeRanges(text: string): Range[] {
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") lineStarts.push(i + 1);
  const at = (line: number) => (line < lineStarts.length ? lineStarts[line] : text.length);

  const ranges: Range[] = [];
  for (const token of parser.parse(text, {})) {
    if ((token.type === "fence" || token.type === "code_block") && token.map) {
      ranges.push([at(token.map[0]), at(token.map[1])]);
    }
  }

  const inBlock = (pos: number) => ranges.some(([s, e]) => pos >= s && pos < e);
  const runs = [...text.matchAll(/`+/g)].filter((m) => !inBlock(m.index!));
  for (let i = 0; i < runs.length; i++) {
    const open = runs[i];
    const n = open[0].length;
    for (let j = i + 1; j < runs.length; j++) {
      const between = text.slice(open.index! + n, runs[j].index!);
      if (/\n[ \t]*\n/.test(between)) break;
      if (runs[j][0].length === n) {
        ranges.push([open.index!, runs[j].index! + n]);
        i = j;
        break;
      }
    }
  }
  return ranges;
}

export function inRanges(ranges: Range[], pos: number): boolean {
  return ranges.some(([s, e]) => pos >= s && pos < e);
}

/** Offsets at which each line of `text` starts, for line-based scanners. */
export function lineOffsets(lines: string[]): number[] {
  const out: number[] = [];
  let at = 0;
  for (const line of lines) {
    out.push(at);
    at += line.length + 1;
  }
  return out;
}
