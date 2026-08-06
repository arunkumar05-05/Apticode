/**
 * Phase 5 — Judge0 language id resolution.
 *
 * Static registry keyed by JUDGE0_API_VERSION (ce | extra | self). When
 * JUDGE0_FETCH_LANGUAGES=true the provider may refresh ids dynamically from
 * GET /languages (TTL-cached) — see provider.ts. Every resolution path falls
 * back to the static map and never throws.
 */
import { config } from '../../config';

export interface LanguageRegistryEntry {
  judge0: {
    ce: number;
    extra?: number;
    self?: number;
  };
}

export const LANGUAGE_REGISTRY: Record<string, LanguageRegistryEntry> = {
  c: { judge0: { ce: 50 } },
  cpp: { judge0: { ce: 54 } },
  java: { judge0: { ce: 62 } },
  javascript: { judge0: { ce: 63 } },
  typescript: { judge0: { ce: 63, extra: 74 } },
  python: { judge0: { ce: 71 } },
  python3: { judge0: { ce: 71 } },
  go: { judge0: { ce: 60 } },
  rust: { judge0: { ce: 73 } },
  ruby: { judge0: { ce: 72 } },
  php: { judge0: { ce: 68 } },
};

const LANGUAGE_SLUGS = Object.keys(LANGUAGE_REGISTRY);

export function isSupportedLanguage(slug: string): boolean {
  return LANGUAGE_SLUGS.includes(slug.toLowerCase());
}

export function staticLanguageId(slug: string, version?: string): number {
  const entry = LANGUAGE_REGISTRY[slug.toLowerCase()];
  if (!entry) return LANGUAGE_REGISTRY.python.judge0.ce;
  const v = version || config.judge0.apiVersion;
  const bucket = v === 'extra' ? entry.judge0.extra : v === 'self' ? entry.judge0.self : entry.judge0.ce;
  return bucket ?? entry.judge0.ce;
}

/**
 * Resolve a language slug to a Judge0 id. Honors JUDGE0_FETCH_LANGUAGES with
 * a TTL cache; falls back to the static map on any failure (never throws).
 */
export async function resolveLanguageId(
  slug: string,
  version?: string,
  deps?: {
    fetchLanguages?: boolean;
    cacheTtlMs?: number;
    fetcher?: (slug: string) => Promise<number | null>;
  }
): Promise<number> {
  const key = slug.toLowerCase();
  const v = version || config.judge0.apiVersion;
  const cacheKey = `${key}:${v}`;

  const cached = cachedIds.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.id;

  const fetcher = deps?.fetcher;
  if (deps?.fetchLanguages && fetcher) {
    try {
      const dynamic = await fetcher(key);
      if (dynamic != null && dynamic > 0) {
        cachedIds.set(cacheKey, { id: dynamic, expiresAt: Date.now() + (deps.cacheTtlMs ?? config.judge0.languagesCacheTtlMs) });
        return dynamic;
      }
    } catch {
      // fall through to static map — never throw
    }
  }

  return staticLanguageId(key, v);
}

const cachedIds = new Map<string, { id: number; expiresAt: number }>();

export function clearLanguageIdCache(): void {
  cachedIds.clear();
}
