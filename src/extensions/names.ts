// Extension names and the per-node enabled list (docs/extensions.md).

/** Lowercase letters, digits and hyphens: also the directory under extensions/ and the /api/ext/<name>/ prefix. */
export const EXTENSION_NAME = /^[a-z][a-z0-9-]{1,31}$/;

/** The enabled extension names stored in Settings (a JSON array under `extensions`). Anything malformed reads as none. */
export function parseEnabledExtensions(raw: string | undefined | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((name): name is string => typeof name === "string" && EXTENSION_NAME.test(name)))].sort() : [];
  } catch {
    return [];
  }
}
