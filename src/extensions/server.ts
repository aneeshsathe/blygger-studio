// The server half of Studio extensions (docs/extensions.md).
//
// An extension's routes are mounted inside the owner API, behind the same
// middleware as every other /api route: owner session or bearer token, scope
// check (every extension route is a GET, so owner:read), CORS policy and the
// owner/grant work budgets. On top of that, each extension's prefix answers
// 404 unless the extension is enabled in this node's Settings.
//
// Nothing here reaches the wire: extension routes are /api only, never
// blyg.json, a public page or content_html.
import type { RouteConfig, RouteHandler } from "@hono/zod-openapi";
import { contractApp } from "../contract/app.ts";
import type { Env } from "../types.ts";
import { parseEnabledExtensions } from "./names.ts";

/** Registers an extension's read routes. Only routes the extension declared with extensionRoute() are accepted. */
export interface ExtensionRouter {
  get<R extends RouteConfig>(route: R, handler: RouteHandler<R, { Bindings: Env }>): void;
}
export interface ServerExtension {
  /** The extension's name (extensions/catalog.ts). */
  name: string;
  routes(router: ExtensionRouter): void;
}

export async function isExtensionEnabled(db: D1Database, name: string) {
  const row = await db.prepare("SELECT value FROM settings WHERE key = 'extensions'").first<{ value: string }>();
  return parseEnabledExtensions(row?.value).includes(name);
}

/** One Hono app holding every compiled-in extension's routes, each prefix gated on its Settings toggle. */
export function extensionApi(extensions: readonly ServerExtension[]) {
  const app = contractApp();
  for (const extension of extensions) {
    const prefix = `/ext/${extension.name}/`;
    app.use(`${prefix}*`, async (c, next) => {
      if (!(await isExtensionEnabled(c.env.DB, extension.name))) return c.json({ error: `extension ${extension.name} is not enabled` }, 404);
      return next();
    });
    extension.routes({
      get(route, handler) {
        if (route.method !== "get" || !route.path.startsWith(prefix)) throw new Error(`extension ${extension.name} may only add GET routes under /api${prefix}: ${route.method} ${route.path}`);
        app.openapi(route, handler as never);
      },
    });
  }
  return app;
}
