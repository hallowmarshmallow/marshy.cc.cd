/**
 * GitHub is not the app backend, but it is still an external provider, so all
 * access to it lives here. Features never call the API directly.
 */
import { BackendError } from './errors'

const API_BASE = 'https://api.github.com'
const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_PREFIX = 'hallowmarsh:stars:'

interface CacheEntry {
  stars: number
  at: number
}

function readCache(repo: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(CACHE_PREFIX + repo)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.at > CACHE_TTL_MS) return null
    return entry.stars
  } catch {
    return null
  }
}

function writeCache(repo: string, stars: number): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CacheEntry = { stars, at: Date.now() }
    window.sessionStorage.setItem(CACHE_PREFIX + repo, JSON.stringify(entry))
  } catch {
    // Storage can be unavailable (private mode, quota). Caching is optional.
  }
}

/**
 * Star count for a public repository given as "owner/name".
 * Results are cached for an hour, so a normal visit costs at most one request
 * per repo. The unauthenticated GitHub API allows 60 requests per hour per IP.
 */
export async function getRepoStars(repo: string): Promise<number> {
  const cached = readCache(repo)
  if (cached !== null) return cached

  let response: Response
  try {
    response = await fetch(`${API_BASE}/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
  } catch {
    throw new BackendError('provider_error', 'Could not reach GitHub.')
  }

  if (!response.ok) {
    const rateLimited = response.status === 403 || response.status === 429
    throw new BackendError(
      rateLimited ? 'rate_limited' : 'provider_error',
      'Could not load the star count.',
    )
  }

  const data = (await response.json()) as { stargazers_count?: number }
  const stars = Number(data.stargazers_count ?? 0)
  writeCache(repo, stars)
  return stars
}
