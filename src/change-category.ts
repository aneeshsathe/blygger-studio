// Change categories: the words the optional change classifier puts in front of
// a changelog note (session 49). Pure, so the Worker and the Studio's publish
// dialog compose notes with the same code.
//
// **Nothing here reaches the wire as a field.** Spec decision #19 / TN-1
// refuses a version-significance marker on the wire, and decision #77 makes
// "ignore this version" a reader-side derivation from content_hash, not a flag.
// So a category exists in exactly two places: the note *text*, which is the
// author's prose and which the author sees and may edit before publishing, and
// studio-private storage (migration 0030, `change_class`). No item-document,
// changelog, feed or manifest member carries it.

/**
 * The fixed set, smallest first. `refresh` is never asked of a model: it is a
 * republish whose content_hash equals the prior version's, decided locally.
 * The other three are the classifier's options (change-class.ts gives the
 * model their descriptions). No `addition`: whether text was added says
 * nothing about how much a reader should care, which is the one thing these
 * words are for.
 */
export const CHANGE_CATEGORIES = ["refresh", "typo", "minor", "major"] as const;
export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number];

export function isChangeCategory(value: unknown): value is ChangeCategory {
  return typeof value === "string" && (CHANGE_CATEGORIES as readonly string[]).includes(value);
}

const LEADING = new RegExp(`^\\s*(${CHANGE_CATEGORIES.join("|")})\\b`, "i");
/** A leading category prefix as this module writes it: the bare word, or the word and a colon. */
const PREFIX = new RegExp(`^\\s*(${CHANGE_CATEGORIES.join("|")})\\s*(?::\\s*|$)`, "i");

/** The category word a note already starts with ("Typo fix." → typo), or null. */
export function leadingCategory(note: string): ChangeCategory | null {
  const m = LEADING.exec(note);
  return m ? (m[1].toLowerCase() as ChangeCategory) : null;
}

/** The note without a prefix this module would have written ("minor: x" → "x", "minor" → ""). */
export function stripCategory(note: string): string {
  return note.replace(PREFIX, "").trim();
}

/**
 * The note as it publishes with a category. The convention, stated once:
 * - an empty note becomes the bare lowercase word: `minor`;
 * - a note becomes `minor: <note>`;
 * - a note that already starts with a category word is left alone, so an
 *   author who wrote "Typo fix." is not overruled;
 * - no category leaves the note as it is.
 * The Studio applies this in the publish dialog, where the author sees the
 * result; the server never rewrites a note at publish.
 */
export function composeNote(note: string, category: ChangeCategory | null): string {
  const text = note.trim();
  if (!category) return text;
  if (!text) return category;
  if (leadingCategory(text)) return text;
  return `${category}: ${text}`;
}

/** Swap the category on a note the author may have edited: drop a prefix this module wrote, compose the new one. */
export function recategorize(note: string, category: ChangeCategory | null): string {
  return composeNote(stripCategory(note), category);
}

/**
 * Whether a confirmed note is generated (#40, `changelog[].generated`): it is
 * exactly the text the machine produced, unedited. `machine` is the model's
 * drafted note composed with the classifier's category, or the classifier's
 * bare category word when the author left the note empty; undefined when the
 * note began as the author's own words, which a category prefix does not make
 * generated.
 */
export function noteIsGenerated(note: string, machine: string | undefined): boolean {
  const text = note.trim();
  return machine !== undefined && text !== "" && text === machine.trim();
}
