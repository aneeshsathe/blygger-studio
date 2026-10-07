# Blygger SDK

JavaScript and TypeScript client for the private Studio API, generated with
Hey API. It runs in browsers, Node.js 22+, and Cloudflare Workers using native
Fetch, File, and Blob APIs. No Node stream shim or framework is required.

Download `blygger-sdk-SDK_VERSION.tgz` from a
[Studio release](https://github.com/blygger/blygger-studio/releases), check its
digest against `SHA256SUMS`, and install it with
`npm install ./blygger-sdk-SDK_VERSION.tgz`. Choose the SDK shipped with your
Worker release; `release.json` records both versions. Downloads are on GitHub,
not the npm registry.

## Browser use

Sign into `/studio` first. Create a client for the same origin; the browser sends
its HttpOnly session cookie automatically. The SDK does not create a login
session. Cross-origin apps and OAuth are planned for a later migration.

```js
import { BlyggerApi, createBlyggerClient, unwrap } from "@blygger/sdk";

const client = createBlyggerClient({ baseUrl: window.location.origin });
const draft = await unwrap(BlyggerApi.createItem({
  client, body: { content_md: "Hello", kind: "fragment" },
}));
await unwrap(BlyggerApi.publishItem({ client, path: { id: draft.id } }));
const reading = await unwrap(BlyggerApi.listReading({ client, query: { offset: 0, limit: 25 } }));
```

## Node and Worker use

Create a separate client for each server request or owner so credentials stay
isolated. Node Fetch does not manage browser sessions: supply an existing owner
session cookie in `headers`. To use `auth` for an owner session, supply a callback that returns the raw cookie value only when `scheme.in === "cookie"`; a plain string now also configures Bearer authentication. A custom `fetch` transport is also supported.
Never embed server credentials in browser code.

```js
import { BlyggerApi, createBlyggerClient } from "@blygger/sdk";

const client = createBlyggerClient({
  baseUrl: "https://blyg.example.com",
  headers: { Cookie: ownerSessionCookie }, // received through your login/session flow
});
const { data, error, response } = await BlyggerApi.listReading({ client });
if (error) throw new Error(`Reading failed: ${response?.status}`);
```

Upload with `body: { file: new File([...], "image.png", { type: "image/png" }) }`.
Node callers can use a Blob from `node:fs`'s `openAsBlob()` with native FormData
handling. Filesystem streams are not accepted. Requests take a standard `signal`
for cancellation. Ordinary API calls do not retry automatically.

## Results and errors

Generated methods return typed `{ data, error, request, response }` fields.
`response.status` exposes HTTP status when a response exists; network failures
can have no response. `unwrap()` is an optional throwing interface: it returns
successful data, throws `BlyggerApiError` with `statusCode` and `body` for HTTP
failures, and preserves network/abort errors.

## Generation

Edit `src/contract/` at the repository root, then run `npm run sdk:generate` with
Node 22.18+. The exact generator version is pinned in the root package and
lockfile and recorded in `generation.json`. Generation reads the checked-in
`openapi.json` without overlays, auth removal, or generated-file patches. CI
checks drift.

`npm run build` bundles the package and declarations for browser and server
JavaScript. `npm pack ./sdk` creates the installable archive.

## Bearer tokens

Create a resource-bound token in Studio's access page. For REST, select the API resource and the scopes your tool needs. Tokens work in browsers and Node:

```js
const client = createBlyggerClient({
  baseUrl: 'https://example.com',
  auth: scheme => scheme.scheme === 'bearer' ? accessToken : undefined,
});
```

Browser bearer requests support CORS. Tokens expire and can be revoked; load them from your credential store. See [client access](https://github.com/blygger/blygger-studio/blob/main/docs/client-access.md) for scopes, revocation and the OAuth/MCP implementation status.
