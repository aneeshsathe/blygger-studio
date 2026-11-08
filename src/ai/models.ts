// The model manifest (models.json, merged with an operator's models.local.json
// by scripts/build-models.ts) and the rules for turning a model id into a
// provider call. Which model each AI function uses is a setting; which secret
// (or binding) each provider needs, and where it is called, is the manifest's.
import manifest from "../../build/models.json";

export type ProviderApi = "anthropic-messages" | "openai-responses" | "gemini-generate" | "workers-ai" | "openai-chat" | "systemone";

export interface ProviderSpec {
  label: string;
  api: ProviderApi;
  /**
   * The Worker secret holding the provider's key. Required for every api except
   * `workers-ai` (which authenticates through its binding) and `openai-chat`,
   * where it may be omitted for a keyless endpoint such as a local Ollama.
   */
  key_secret?: string;
  /** `workers-ai` only: the Worker binding to call (default "AI"). */
  binding?: string;
  /**
   * `openai-chat`: the base URL; requests go to `{base_url}/chat/completions`.
   * `systemone`: optional, default `https://api.typesafe.ai/v1`; requests go to `{base_url}/systemone`.
   */
  base_url?: string;
  /** Extra request-body members sent with every call to this provider. */
  params?: Record<string, unknown>;
  prefixes?: string[];
}
export interface ModelSpec {
  id: string;
  provider: string;
  label: string;
  note?: string;
  /** Extra request-body members for this model, merged over its provider's `params`. */
  params?: Record<string, unknown>;
  /**
   * "decision" marks a decision model (Clef, Jev): it answers typed questions
   * with probabilities and generates no text, so it is offered only for the
   * change classifier, and a text model is never offered for the classifier.
   */
  kind?: "decision";
}
export interface Manifest {
  providers: Record<string, ProviderSpec>;
  models: ModelSpec[];
  /** True when models.local.json contributed to this build. */
  local: boolean;
}

export const MODELS = manifest as Manifest;

/** The AI functions that take a model. Authoring is reserved; nothing calls it yet. */
export const AI_PURPOSES = ["tk", "changelog", "feed"] as const;
export type AiPurpose = (typeof AI_PURPOSES)[number];

/** A model's provider: its manifest entry, else the provider whose prefix the id starts with. */
export function providerFor(modelId: string, m: Manifest = MODELS): { key: string; spec: ProviderSpec; model: ModelSpec | null } | null {
  const listed = m.models.find((x) => x.id === modelId);
  if (listed && m.providers[listed.provider]) return { key: listed.provider, spec: m.providers[listed.provider], model: listed };
  for (const [key, spec] of Object.entries(m.providers)) {
    if ((spec.prefixes ?? []).some((p) => modelId.startsWith(p))) return { key, spec, model: null };
  }
  return null;
}

/**
 * Whether a model id names a decision model: listed with `kind: "decision"`,
 * or served by a `systemone` provider (every System One model is one). An
 * unlisted `@cf/…` id is a text model; a decision model on Workers AI has to be
 * listed so its kind is known.
 */
export function isDecisionModel(modelId: string, m: Manifest = MODELS): boolean {
  const provider = providerFor(modelId, m);
  if (!provider) return false;
  return provider.model?.kind === "decision" || provider.spec.api === "systemone";
}

/** The binding a `workers-ai` provider calls. */
export function bindingName(spec: ProviderSpec): string {
  return spec.binding || "AI";
}

/**
 * Whether a provider can be called on this deployment: its key secret is set,
 * its binding is bound (`workers-ai`), or it needs neither (a keyless
 * `openai-chat` endpoint). Reported by name only; values are never read out.
 */
export function providerConfigured(env: object, spec: ProviderSpec): boolean {
  const vars = env as Record<string, unknown>;
  if (spec.api === "workers-ai") {
    const binding = vars[bindingName(spec)] as { run?: unknown } | undefined;
    return !!binding && typeof binding.run === "function";
  }
  if (!spec.key_secret) return spec.api === "openai-chat";
  return typeof vars[spec.key_secret] === "string" && !!vars[spec.key_secret];
}

/** Which providers are callable, by provider key. */
export function configuredProviders(env: object, m: Manifest = MODELS): Record<string, boolean> {
  return Object.fromEntries(Object.entries(m.providers).map(([key, spec]) => [key, providerConfigured(env, spec)]));
}
