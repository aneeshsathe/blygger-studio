// What the inspect sheet shows: the record this Studio holds for an entry,
// reshaped for reading. Nothing is fetched from the item's origin; this is
// our copy (GET /api/items/{id} for our own, GET /api/imports/{sub}/{id} for
// an imported one).
//
// Two changes, both display only:
//   - content bodies (content_md, content_html) become a character count, so
//     the protocol fields are not buried under the text;
//   - imported rows keep references as JSON strings in *_json columns; those
//     are parsed, so a stub_of or transclusions list reads as a structure.

const BODY = new Set(['content_md', 'content_html']);

export function shapeRecord(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shapeRecord);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => {
      if (BODY.has(key) && typeof field === 'string') return [key, `‹${field.length} characters, not shown›`];
      if (key.endsWith('_json') && typeof field === 'string') {
        try {
          return [key, shapeRecord(JSON.parse(field))];
        } catch {
          return [key, field];
        }
      }
      return [key, shapeRecord(field)];
    }),
  );
}

/** The few fields worth reading first, as label/value pairs; absent ones are left out. */
export function summary(record: Record<string, unknown>): [string, string][] {
  const published = record.published as Record<string, unknown> | null | undefined;
  const transclusions = Array.isArray(published?.transclusions)
    ? published.transclusions.length
    : typeof record.transclusions_json === 'string'
      ? (JSON.parse(record.transclusions_json) as unknown[] | null)?.length ?? 0
      : undefined;
  const rows: [string, unknown][] = [
    ['id', record.id ?? record.remote_id],
    ['kind', record.kind],
    ['version', record.version],
    ['state', record.status ?? record.state],
    ['content hash', published?.content_hash ?? record.content_hash],
    ['stub of', describe(record.stub_of ?? parse(record.stub_of_json))],
    ['forked from', describe(record.forked_from ?? parse(record.forked_from_json))],
    ['transclusions', transclusions],
  ];
  return rows.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)]);
}

function parse(field: unknown) {
  if (typeof field !== 'string') return undefined;
  try {
    return JSON.parse(field) as unknown;
  } catch {
    return undefined;
  }
}

/** A reference in one line: origin + id + version, or a {url} target. */
function describe(ref: unknown) {
  if (!ref || typeof ref !== 'object') return undefined;
  const r = ref as Record<string, unknown>;
  if (typeof r.url === 'string') return r.url;
  return [r.origin, r.id, r.version !== undefined ? `v${r.version}` : undefined].filter(Boolean).join(' ');
}
