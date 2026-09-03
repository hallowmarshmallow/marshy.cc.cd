import { useEffect, useState, type ReactNode } from 'react'

/**
 * Minimal hash-based router. Hash routing was chosen over history routing
 * because GitHub Pages serves static files only; the 404.html fallback hack
 * is more fragile and hosts nothing at arbitrary paths without server rules.
 * Routes are simple, stable, and Android-deep-link friendly (§15.1).
 */

export type RoutePattern =
  | '/'
  | '/login'
  | '/feed'
  | '/u/:handle'
  | '/settings'
  | '*'

function currentPath(): string {
  const hash = window.location.hash
  if (!hash || hash === '#') return '/'
  return hash.startsWith('#/') ? hash.slice(1) : '/'
}

export function useRoute(): string {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return path
}

/** Matches `path` against a pattern like '/u/:handle'. Returns params or null. */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (pattern === '/') return path === '/' ? {} : null
  if (pattern === '*') return {}
  if (patParts.length !== pathParts.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < patParts.length; i++) {
    const p = patParts[i]
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(pathParts[i])
    } else if (p !== pathParts[i]) {
      return null
    }
  }
  return params
}

export function navigate(to: string) {
  window.location.hash = to
}

export function Link({
  to,
  children,
  className,
  title,
  'aria-label': ariaLabel,
}: {
  to: string
  children: ReactNode
  className?: string
  title?: string
  'aria-label'?: string
}) {
  return (
    <a
      href={`#${to}`}
      className={className}
      title={title}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (window.location.hash === `#${to}`) e.preventDefault()
      }}
    >
      {children}
    </a>
  )
}
