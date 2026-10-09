// The Worker suite compiles in every extension in the repository, so its
// results never depend on an operator's extensions.local.json. vitest.config.ts
// substitutes this for build/extensions.names.ts. Each one still starts disabled.
import { EXTENSIONS } from "../../extensions/catalog.ts";

export const compiledExtensionNames: readonly string[] = EXTENSIONS;
