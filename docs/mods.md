# Modding the Studio

A **mod** is anything that makes a Studio node behave differently from the reference Studio without becoming a different client: a tool that sets up a blyg as a book, an extension that adds a lineage view, a home page order. This page says where a mod can live, what the Studio will add for one, and what it will not. It is the program's position (decision #89 in [blygger-spec](https://github.com/blygger/blygger-spec/blob/main/CLAUDE.md), reasoning in `docs/v0.4-plan.md` §17.1).

The first mod is [blykker](https://github.com/blygger/blykker), which keeps a blyg arranged as a book. The examples below come from it.

## Three surfaces, cheapest first

Try them in this order. Each costs the Studio more than the one before, and each one you avoid is coordination you never have to do.

### 1. Configuration through the owner API

A tool that acts as an editor would: it creates threads and fragments, edits settings, links sections, pins versions, all through `{mount}/api` on a [scoped token](client-access.md). It runs anywhere, in any language, on its own schedule. The Studio does not know it exists.

This surface costs the Studio nothing, and a mod owns everything it does here outright. blykker's whole first phase is a `book.json` and a script on this surface.

A tool that needs to react to changes polls `GET /api/changes`. There are no webhooks (decision #39c).

### 2. Compiled-in extensions

Code in the slots that [`extensions.md`](extensions.md) describes: a reading byline, reading actions, a sheet, a page of its own, owner reads under `/api/ext/<name>/`, a home page order. Its rules stand unchanged:

- Nothing loads at run time. An extension is code the operator chose to compile in.
- Server routes are reads only.
- Writes go through the documented contract, under the same scopes as any client.
- Nothing reaches the wire, except that a feed order may arrange the home page.

An extension can live in your own repository and be vendored into a build through the gitignored `extensions.local.json`, with `npm run ext:add` at a pinned commit ([`extension-vendoring.md`](extension-vendoring.md)). Vendored code must be **browser only**. `openapi.json` has to stay a function of this repository, so a server half is either upstreamed or not run.

### 3. Hooks proposed upstream

When a mod needs a surface the Studio lacks, propose it as a pull request to this repository, as any contributor would. A hook that clears the bar below is welcome. Say which mod needs it and why the first two surfaces do not reach.

## The bar a hook must clear

**General.** A hook is named for what it does, not for the mod that wants it. A "book layout" slot would be refused. An owner stylesheet for public pages would be considered, because any blyg might use one. A general hook keeps the Studio legible to the next mod.

**Wire-silent.** A hook may not change the bake, `feed.xml`, item documents or `blyg.json`. Presentation of the publisher's own pages is open: chrome is presentation (spec §8.4), and the [CSS contract](https://github.com/blygger/blygger-spec/blob/main/docs/css-contract.md)'s classes live in the baked HTML, where no stylesheet can remove them. A presentation hook therefore cannot change what a reader or a forker receives.

**Reads only on the server.** A hook that writes from inside the Worker would be refused. Writes happen in the browser through the extension's `client`, under the owner's session, or from outside on a token. The server half of an extension is where a mod would otherwise acquire the Studio's own authority. Keeping it read-only is what makes "nothing reaches the wire" a property of the code rather than a request.

### How blykker's five proposed hooks fared

| Wanted | Answer | The general form |
| --- | --- | --- |
| Book-like presentation of public pages | Accepted | An owner stylesheet or page-template setting for the whole blyg. The public pages take a custom palette today, not a stylesheet. |
| A custom label on a links-section entry | Accepted | A setting, not a hook. |
| Hiding the feed apparatus on some threads | Accepted | Presentation of the publisher's own page. The item document and the feed are untouched. |
| Dropping marked fragments from `feed.xml` | Refused | The spec says every published item is one event and nothing publishes quietly (§7). To keep notes off the home page, use a home page order, which may leave items out. Readers decide what to bury (§13.7). |
| A server hook that runs on publish | Refused | Poll `GET /api/changes` from a tool on a token, or add an extension action that writes through `client` in the browser. |

## Two promises a mod keeps

**The generator string stays `blygger-studio/x.y.z`.** A mod does not rename the client. The ecosystem census counts clients by that string, and update notices depend on it. If a mod needs an identity, it goes in its extension metadata.

**Not forking is the mod's own promise.** The Studio keeps its extension points as stable as it can and announces breaking changes in [`CHANGELOG.md`](../CHANGELOG.md). It makes no version promise about them yet. A mod that outgrows these surfaces and forks has become another client. That is fine, and the [fork section of the README](../README.md#if-you-fork-this) says what we ask of one.

## No program-hosted registry

The program does not publish an index of third-party extensions or host one on blygger.org. There are four reasons:

- The extension API has no version and no stability promise. An index that pins entries to Studio ranges would promise maintenance the program cannot keep.
- Anything listed under the `blygger` organisation reads as endorsement, whatever the page says. Extension code runs in the owner's session, where it can publish and mint tokens.
- No third-party extension exists yet, and the one real mod needs no browser code.
- The program adds surfaces on measured need, not ahead of it.

The day a second mod with browser code exists is the day to count again. Meanwhile, anyone may publish an index of their own, and [blygger.org/ecosystem](https://blygger.org/ecosystem/) may list an extension the way it lists clients: as an observation, not a recommendation.

## When a mod is on its own

A mod is independent when it lives on the first two surfaces and proposes hooks as any contributor does. It needs no permission and no seat in the program's sessions. blykker meets that already.
