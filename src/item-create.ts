import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Env } from "./types.ts";
import { createDraft } from "./model.ts";
import { parseStubOf } from "./stub.ts";
import { normalizeSelection, quoteLines } from "./markdown.ts";
import { locateSelection } from "./transclusion.ts";
import { getSubscription, getImportedItem } from "./importer/store.ts";
import { sourceTitleAndUrl } from "./importer/util.ts";
import { nowIso } from "./util.ts";

/**
 * The stub action (v0.3-plan §3.1, decision #27) — one gesture, replacing
 * `respond`. Creates a **thread** draft citing exactly one target and opens
 * in the editor; the body is prefilled but entirely the author's to change.
 *
 * A blyg target gets the transclusion directive, because a stub without the
 * quote is not a stub in this medium's aesthetic. An L0 target gets the old
 * respond prefill — a markdown link and nothing else — keeping respond's one
 * real discipline: none of *their* text is copied.
 *
 * `stub_of` is set regardless of whether the body ends up quoting the target:
 * readers rely on the marker, never on body inspection (§2.2).
 *
 * **Partial quotation (§10.1)** changes only the prefill. With a `selection`,
 * the body is the directive plus that passage as an attached blockquote,
 * checked here against the snapshot we hold, so a selection that cannot
 * publish is refused when it is made rather than at publish. Without one the
 * body quotes the whole item, whatever its length (session 37, Venkat: the
 * opening passage was rarely the passage wanted). The reference client no
 * longer sends a selection; it chooses passages in the stub editor instead,
 * but the API keeps the parameter.
 *
 * Both are prefill only. The body remains entirely the author's to change, and
 * `stub_of` is set the same way in every case.
 */
export async function createResponseDraft(c: Context<{ Bindings: Env }>, body: { subscription_id: string; remote_id: string; selection?: string }) {
  const subId = body.subscription_id;
  const remoteId = body.remote_id;
  if (!subId || !remoteId) throw new HTTPException(400, { message: "subscription_id and remote_id required" });
  const sub = await getSubscription(c.env.DB, subId);
  if (!sub) throw new HTTPException(404, { message: "subscription not found" });
  const row = await getImportedItem(c.env.DB, subId, remoteId);
  if (!row) throw new HTTPException(404, { message: "imported item not found" });

  let contentMd: string;
  let stubInput: unknown;
  if (row.l0) {
    const { title, url } = sourceTitleAndUrl(row, sub.origin);
    const label = (title || sub.title || sub.origin).replace(/[[\]]/g, "");
    contentMd = `[${label}](${url})\n\n`;
    // The citation's human half, frozen now (§5.9, decision #55): which feed,
    // and the entry's own title as the caption — more than a hostname says.
    stubInput = {
      url,
      cited: { source: sub.title || "", ...(title ? { excerpt: title } : {}), url, retrieved: nowIso() },
    };
  } else {
    // What a quote of this row would bake: the retained pinned version for a
    // tombstone we kept, the watermark otherwise. An unretained tombstone has
    // no bytes to quote, so the citation stands alone — a response to a
    // withdrawal is legitimate (§2.3.6), it just cannot include the text.
    const quotable = row.state === "current" || row.pinned_version_retained !== null;
    const version = row.state === "tombstone" && row.pinned_version_retained !== null ? row.pinned_version_retained : row.version;
    if (!quotable) {
      contentMd = "";
    } else if (typeof body.selection === "string" && body.selection.trim()) {
      const selection = normalizeSelection(body.selection);
      // Checked now, against the same bytes publish will check against. The
      // alternative — prefill it and find out later — hands the author a draft
      // that cannot be published and no hint as to which part is wrong.
      if (!selection || !locateSelection(row.content_html, selection)) {
        throw new HTTPException(400, { message: "that passage is not in the version we hold of this item" });
      }
      contentMd = `![[${remoteId}]]\n${quoteLines(selection)}\n\n`;
    } else {
      contentMd = `![[${remoteId}]]\n\n`;
    }
    stubInput = { origin: sub.origin, id: remoteId, version };
  }

  const parsed = parseStubOf(stubInput);
  if (!parsed.ok) throw new HTTPException(400, { message: parsed.reason });
  return createDraft(c.env.DB, contentMd, "thread", parsed.stub);
}
