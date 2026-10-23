# Hopper feeds

> **PROPOSED, not in force, pending a Fable ruling** (fable-round-queue item 14).
> The proposed normative text is in blygger-spec `protocol-v0.4.md` (§6.1
> `hoppers`, §12.1 step 7, §12.2, §13.5, §13.5a) on the `proposal/hopper-feeds`
> branch, with the write-up in `docs/proposals/hopper-feeds-proposal.md`. If the
> ruling changes a shape, this build changes to match.

Everything here sits behind one setting, **`hopper_feeds`**, off by default
(Settings, Network, *collection feeds*). With it off, a node behaves exactly as
before: no hopper feed route, no new links on hopper pages, no `hoppers` key in
`blyg.json`, and no hopper match when subscribing.

Every URL shape, name and constant lives in `src/hopper-feed-shape.ts`.

## Publish side

### The feed: `{mount}/h/{slug}/feed.xml`

RSS 2.0 for one **public** hopper (`src/hopper-feed.ts`). A private hopper, an
unknown slug and the setting being off all answer the same 404, so a private
hopper leaks nothing, not even that it exists.

- **Channel:** title `{hopper name} — {site title}`, link to the hopper page,
  description the hopper's description or the page's own fallback ("A collection
  on …"), an `atom:link rel="self"`.
- **No `blyg:` namespace anywhere** (§13.5a rule 2), the owner's own items
  included. A hopper entry carrying `blyg:id` would make the hopper feed a second
  blyg feed for the same origin and collide in rollup. The owner's items reach
  blyg readers through `feed.xml`.
- **The whole list, no window** (rule 3): one `<item>` per current member,
  newest-added first. Members the hopper page shows are the members the feed
  carries (one loader, `loadHopperMembers`), except one withdrawn at its origin
  with no retained pin, which has rolled to null (§13.4) and leaves the feed.
- **Each entry is curation** (rule 4):
  - `<guid isPermaLink="false">hopper:{slug}:{member origin}:{id}</guid>`. Public
    slugs are frozen (migration 0006), so the guid is stable.
  - `<link>`: the held snapshot's declared `page`, else the origin's item
    document (`item` template, else `{origin}items/{id}.json`). Never a
    constructed `f/`/`t/` permalink (#85). An L0 member links to its entry URL.
    An own item links to its own `page`.
  - `<description>`: an excerpt (280 characters), a link to the item, and "via
    {hopper} on {site}". Never the held snapshot. Memberships hold no curator
    note yet; one would lead the body.
  - `<pubDate>`: when the item joined the hopper.
  - `dc:creator` from the member's `author.name`, when it has one.
  - `<source url="{member origin's feed}">{source title}</source>` on every member
    that is not the owner's own.

```xml
<item>
  <guid isPermaLink="false">hopper:picks:https://a.example/blyg/:01j9x…</guid>
  <link>https://a.example/blyg/posts/one/</link>
  <title>Heading One</title>
  <description><![CDATA[<p>Words that carry the argument…</p>
<p><a href="https://a.example/blyg/posts/one/">A Blyg ↗</a> · via <a href="https://example.com/blyg/h/picks/">Picks</a> on <a href="https://example.com/blyg/">My Blyg</a></p>]]></description>
  <pubDate>Sat, 05 Sep 2026 00:00:00 GMT</pubDate>
  <dc:creator>Ann Author</dc:creator>
  <source url="https://a.example/blyg/feed.xml">A Blyg</source>
</item>
```

### Discovery

While the setting is on, the hopper page's `<link rel="alternate"
type="application/rss+xml">` points at the hopper feed instead of the blyg's,
its meta line gains an **RSS** link, and its head carries `<link rel="blyg">` to
the manifest, so §12.1 step 4 finds the manifest from the hopper page under any
mount.

### The manifest's `hoppers` key (§6.1)

```json
"hoppers": [{ "title": "Picks", "page": "h/picks/", "feed": "h/picks/feed.xml" }]
```

Public, slugged hoppers only, origin-relative paths, and only while the setting
is on and at least one hopper is public, so every other manifest is
byte-identical. `PROTOCOL_VERSION` is unchanged. A static export keeps only the
hoppers named with `--hoppers`, and exports their feeds.

### The blyg's own feed is unchanged

`feed.xml` never carries a hopper member (decision #12). A test holds it
byte-identical with the setting on and off.

### Caching

The hopper feed goes through the same edge cache as public HTML
(`src/html-cache.ts`): its key carries the public revision, which moves with the
`hoppers`, `items`, `subscriptions` and `settings` change domains. A membership
change, a hopper taken private, or the setting turned off reads a fresh entry
at once, and a 404 is never cached.

## Subscribe side

### §12.1 step 7, hopper match

`resolve(url, fetch, { hoppers })` in `src/importer/resolve.ts`. When steps 2–5
resolve a manifest that has `hoppers`, the input URL (query and fragment
stripped, before step 1's trailing slash) is compared with each entry's `feed`
and `page`, resolved against the identity origin; a page matches with or without
its slash. A match on an entry with a `feed` resolves to `{ origin, manifest,
hopper_feed }`; a page-only entry, or no match, resolves as the whole blyg. No
extra fetch. Skipped entirely while the setting is off.

The subscribe sheet then offers the hopper, with **subscribe to the whole blyg
instead** (`whole_blyg: true` on `POST /api/subscriptions`).

### §12.2 identity

Migration **0033** adds `subscriptions.hopper_feed` and `hopper_manifest`
(NULL = not a hopper subscription), with a unique index on `hopper_feed`. A
hopper subscription is stored as `kind: "rss"` with `origin = feed_url =
hopper_feed`, so it coexists with a whole-blyg subscription to the same origin,
and nothing that matches subscriptions by origin (stub citations, fork titles,
provenance) mistakes it for that blyg. Its blyg is `hopper_manifest`; the
identity origin is that URL minus its last segment. Its title is `{hopper} —
{blyg}`, which the channel title keeps current.

### Polling (§13.5a rules 5–6)

Entries import as L0 rows scoped to the subscription: excerpts and links, never
a transclusion, link or TK source (`resolveTarget` refuses L0 rows), never a
mention target. Each poll reconciles against the whole list: **an entry that
has disappeared is dropped**, unlike a plain L0 feed, whose entries scroll out
of a window and are kept.

On the daily manifest sync, if the manifest no longer lists the hopper's feed,
polling stops: the subscription is paused, flagged `hopper-unlisted`, and its
entries are dropped as withdrawn. It is never turned into a subscription to the
whole blyg. A manifest that cannot be read changes nothing.
