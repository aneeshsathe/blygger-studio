# Owner API

The owner API lives at `/api`, including installations with a mounted Studio.
The public Blygger protocol remains separate.
Sign into Studio before calling the API from a browser on the same origin.
Server clients must send the owner session cookie.
OAuth and cross-origin clients belong to the next compatibility phase.

Shared Zod definitions validate JSON bodies, path parameters, and query parameters.
They also define resource responses and generate the OpenAPI 3.1 contract.
Resource projectors validate their output with these schemas.
Contract tests validate successful responses against the same definitions.
Hey API generates the SDK directly from the contract, without changes to generated code.

## Resources and operations

All paths below start with `/api`.
Consult `openapi.json` for every field and response.

| Resource | Read | Write |
| --- | --- | --- |
| Items | `GET /items`, `GET /items/{id}` | `POST /items`, `PATCH /items/{id}`, `DELETE /items/{id}` |
| Versions | `GET /items/{id}/versions/{v}` | `PUT /items/{id}/versions/{version}/pin` |
| Subscriptions | `GET /subscriptions`, `GET /subscriptions/{id}` | `POST /subscriptions`, `PATCH /subscriptions/{id}`, `DELETE /subscriptions/{id}` |
| Hoppers | `GET /hoppers`, `GET /hoppers/{id}` | `POST /hoppers`, `PATCH /hoppers/{id}`, `DELETE /hoppers/{id}` |
| Hopper membership | Included in hopper detail | `PUT` or `DELETE /hoppers/{id}/items/{sub}/{remoteId}` |
| Signals | `GET /signals` | `PUT` or `DELETE /signals/{sub}/{remoteId}` |
| Mentions | `GET /mentions?direction=inbound` or `outbound` | `PATCH /mentions/{id}` with `hidden` |
| Settings | `GET /settings` | `PATCH /settings` |
| Media | Included in item detail | `POST /media` with a multipart file (`inline=true` when the client places it in the text), `DELETE /media/{id}` (detaches; deletes the file only when no published version shows it) |
| Imported items | `GET /imports/{sub}/{id}`, `GET /imports/{sub}/{id}/history`, `GET /imports/{sub}/{id}/versions/{v}` (history and public versions, read from the origin) | The subscription importer manages these items |
| Reading | `GET /reading` | Read only |
| Read state | `readVersion` on each imported Reading entry | `PUT /reading/{sub}/{remoteId}/read`, `POST /reading/read` |
| Change revisions | `GET /changes` | Maintained by database triggers |
| Quote freshness | `GET /freshness`, `GET /items/{id}/freshness` | `POST /items/{id}/refresh` |

Publication, withdrawal, restoration, and generation remain explicit operations:

- `POST /items/{id}/publish` and `POST /items/{id}/withdraw` accept an optional publication note.
- `POST /items/{id}/restore` copies a stored version into the working copy. It does not publish.
- `POST /items/{id}/generate` generates one TK scope.
- `POST /subscriptions/{id}/resync` refreshes a Blyg subscription.
- `POST /items/{id}/note-draft` drafts a changelog note from the change between the published version and the working copy. It never publishes. When the published version is unpinned, the note must not reproduce wording that only that version had; a draft that does returns 422. Send `note_generated: true` with `POST /items/{id}/publish` only when the note is that draft, unedited: it becomes `changelog[].generated` on the wire.
- `POST /items/{id}/refresh` republishes a thread to re-bake quotes whose source has a newer version. See below.

Preview and search use `/preview` and `/search`.
`GET /changes` returns `{ epoch, domains }`, with revision counters for items,
Reading, subscriptions, hoppers, signals, settings and the public feed. It uses
the same current owner/delegated read authorization as other private reads.
Clients can skip unchanged data refreshes, but must capture their target before
loading and acknowledge it only after successful installation. These are change
signals, not row-delta cursors or permission to cache authorization decisions.
The old fork, stub, pause, resume, response-policy, and pin routes no longer exist.
Studio calls the canonical routes through the generated SDK.

## Create an item

One creation route accepts three recipes.
These examples use the generated SDK with an authenticated `client`:

```ts
const blank = await unwrap(BlyggerApi.createItem({
  client,
  body: { mode: "blank", kind: "fragment", content_md: "A new draft" },
}));

const fork = await unwrap(BlyggerApi.createItem({
  client,
  body: {
    mode: "fork",
    source: { origin: "https://example.org/blyg/", id: "source-id", version: 1 },
  },
}));

const response = await unwrap(BlyggerApi.createItem({
  client,
  body: {
    mode: "response",
    source: { subscription_id: "subscription-id", remote_id: "source-id" },
    selection: "An optional passage from the source",
  },
}));
```

Blank creation may omit `mode` or the entire body.
A fork starts from a pinned version and permanently records its source.
A response creates a thread with a citation to the imported source.
Creation returns the item, status 201, and a `Location` header.
Hopper and media creation also return 201.
Subscription creation returns 200 when the owner must accept the proposed subscription, then 201 when it creates the subscription.

## Partial edits

PATCH changes only supplied fields.
Omitted fields retain their values.
Null clears only fields that explicitly allow null, such as an item's `stub_of`.
Unknown JSON fields fail validation rather than disappearing silently.
Preferences use booleans, not database integers or strings such as `"on"`.

```ts
const item = await unwrap(BlyggerApi.updateItem({
  client,
  path: { id: blank.id },
  body: { content_md: "Revised text", responses: "hide" },
}));
```

Item edits accept `content_md`, `kind`, `stub_of`, and `responses`.
The response policy is `default`, `show`, or `hide`.
Kind becomes fixed after the first publication.
Fork lineage and generation provenance cannot change through PATCH.

All requested changes must pass schema and domain validation before a write.
Item and hopper writes guard the state that their domain rules used.
If that state changes during the request, the API returns 409 without applying the patch.
Reload the resource before deciding whether to repeat the edit.
These guards do not provide general revision control for concurrent text edits.

Pinning uses PUT because repeating the same pin has the same effect.
A pin is permanent, including after withdrawal.
Deletion discards an unpublished draft. Withdraw a published item instead.

## Read and poll

Collection reads return `{ items, total, offset, limit }`.
Use `offset` and `limit` to read another slice.
Reading also returns source counts and the selected source.
Mentions also return the requested direction.

```ts
const reading = await unwrap(BlyggerApi.listReading({
  client,
  query: { offset: 0, limit: 25 },
}));
for (const item of reading.items) console.log(item.key);
```

Reading defaults to 25 entries and accepts at most 50 per request.
Other paginated reads accept at most 100.
Search defaults to 20 results.
Collection queries limit the rows they return before resource conversion.
Totals, sorting, and large offsets can still scan rows in D1.
An offset past the end returns an empty array.
Invalid pagination returns 400.

Poll `/reading` to read the current D1 state.
Polling does not fetch remote feeds. The existing subscription cron still does that.
The planned SPA polls visible reading data every 15 seconds and pauses in hidden tabs.
The API sanitizes imported HTML before it returns reading bodies.

Item detail includes the item fields, `authored_kind`, media, versions, and the published version.
Version resources include their kind, including threads with no transclusions.
Item and version references use objects, and flags use booleans.
Imported protocol metadata retains its existing serialized JSON fields.
Subscription resources omit internal HTTP cache fields.
Hopper detail includes `total` and `source_count`.
Use `?preview=true` for an index preview of three memberships and bodies.
The default hopper detail still includes all memberships and bodies.

## Read state

A client that keeps "read" for imported items can store it here, so a post read
on one device reads as read on the owner's others. Each reading row holds one
number: the highest version the owner has read. It is Studio-private. No public
page, feed, item document, `blyg.json` or export reads it.

- `PUT /reading/{sub}/{remoteId}/read` with `{ version }` stores the larger of
  the held and requested values and returns `{ ok, stored, read_version }`.
  A replay or a stale client never lowers it.
- `POST /reading/read` with `{ items: [{ sub, remote_id, version }] }` does the
  same for up to 500 rows in one transaction and returns `{ ok, received }`.
  Any malformed entry fails the whole request with 400, and nothing is written.
  The batch is one request against the write budget, however many rows it marks.
- A row this server does not hold, by subscription or by item, is acknowledged
  with 200 and `stored: false`, never 404. Clients may read a 404 from these
  routes as "this server keeps no read state".
- `GET /reading` returns `read_state: true`, and each imported entry carries
  `readVersion`: an integer, or null when unread. A client can rely on the flag
  rather than probing the write routes.

Version is an integer from 1 (items start there) to 2^32 − 1. Both writes need `owner:manage`, like
signals. Read state goes with its imported item or subscription when either is
deleted, and a change advances the `reading` revision in `GET /changes`.

## Quote freshness

A thread bakes each quote at the version it held when it published. A quote is
**stale** when a newer version of the item it quoted exists, either here (our
own item was republished, or the importer already pulled the source's new
version) or only at the source's origin. Only the direct relation counts: a
quote of a thread is not stale because that thread's own quotes moved.

- `GET /freshness` lists every published thread with a stale quote or one that
  would block a republish. It reads only D1.
- `GET /items/{id}/freshness` reports each quote in the published version:
  `baked` (the version in the thread), `held` (what a republish would bake now),
  `live` (what the origin serves, from `{origin}items/{id}.json`), and a
  `status` of `current`, `refreshable`, `behind`, `passage-missing`,
  `unresolvable` or `retained`. It probes origins unless `?probe=false`. A
  failed probe reads as `live: null`, never as stale.
- `POST /items/{id}/refresh` with an optional `note` re-imports the sources
  that are behind, then republishes. A refresh **is** a publish: it creates a
  new version, a feed entry, and mentions for the references whose target
  version changed. The words do not change, so `content_hash` stays the same.
  It returns 409 when the working copy holds anything other than the published
  words, when a quote would make the republish fail, or when nothing is stale.

## Errors and generation

Errors return JSON with an `error` string.
Validation errors also include issue paths and messages.
Domain errors may include details such as unresolved references.
Unknown routes return 404. A known route with the wrong method returns 405 and an `Allow` header.

Generated methods expose data, errors, and the HTTP response.
`unwrap()` throws for a failed response.
The SDK does not automatically retry writes.

Run `npm run sdk:generate` after changing the shared contract.
Commit `openapi.json` and `sdk/generated/` with the server changes.
CI validates generation drift, Worker behavior, browser flows, and packaged release artifacts.
See [SDK usage](../sdk/README.md) for browser and server transports.
