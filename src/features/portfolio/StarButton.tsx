import { useEffect, useState } from 'react'
import { getRepoStars } from '../../services'

/**
 * Star count for a repository, linked to the repo so it can be starred.
 * If the count cannot be loaded the button still works and shows the label.
 */
export function StarButton({ repo }: { repo: string }) {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    getRepoStars(repo)
      .then((count) => {
        if (active) setStars(count)
      })
      .catch(() => {
        // Leave the count off; the link is still useful.
      })
    return () => {
      active = false
    }
  }, [repo])

  return (
    <a
      className="star-btn"
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noreferrer"
      title={`Star ${repo} on GitHub`}
    >
      <i className="fa-regular fa-star" aria-hidden="true" />
      {stars === null ? 'Star' : stars}
    </a>
  )
}
