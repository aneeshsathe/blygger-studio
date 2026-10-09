// How long an entry takes to read, from the HTML the reading view already
// holds. No fetch, no server half.
//
// Words are runs of letters and digits. Han, kana and Hangul are not written
// with spaces, so those characters are counted one by one at their own rate
// rather than as one enormous "word".

/** Words per minute for space-separated scripts. */
export const WORDS_PER_MINUTE = 230;
/** Characters per minute for Han, kana and Hangul. */
export const CJK_PER_MINUTE = 500;

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;

/** The text of an HTML fragment, near enough for counting: tags become spaces. */
function textOf(html: string) {
  return html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&[#\w]+;/g, ' ');
}

export function readingTime(html: string): { words: number; cjk: number; minutes: number } {
  const text = textOf(html);
  const cjk = text.match(CJK)?.length ?? 0;
  const words = text.replace(CJK, ' ').match(WORD)?.length ?? 0;
  return { words, cjk, minutes: words / WORDS_PER_MINUTE + cjk / CJK_PER_MINUTE };
}

/** "< 1 min", "4 min", or "" when there is nothing to read. */
export function formatMinutes(minutes: number) {
  if (minutes <= 0) return '';
  return minutes < 1 ? '< 1 min' : `${Math.round(minutes)} min`;
}
