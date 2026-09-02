import { useEffect, useState } from 'react'

/**
 * Atmospheric background: soft fog gradients + sparse drifting fireflies.
 * Pure CSS animation, decorative only, hidden from AT, and disabled under
 * prefers-reduced-motion (base.css kills the animation; dots stay static).
 */
export function Atmosphere() {
  const [flies, setFlies] = useState<Array<{ x: number; y: number; d: number; s: number }>>([])

  useEffect(() => {
    // Deterministic-ish scatter; client-only so SSR stays clean.
    const flies = Array.from({ length: 14 }, (_, i) => ({
      x: (i * 67 + 13) % 100,
      y: (i * 41 + 29) % 100,
      d: 6 + ((i * 7) % 9),
      s: 0.7 + ((i * 3) % 10) / 12,
    }))
    setFlies(flies)
  }, [])

  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="fog fog-a" />
      <div className="fog fog-b" />
      <div className="fireflies">
        {flies.map((f, i) => (
          <span
            key={i}
            className="firefly"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              animationDuration: `${f.d}s`,
              animationDelay: `${(i % 5) * 1.3}s`,
              width: `${3 * f.s}px`,
              height: `${3 * f.s}px`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
