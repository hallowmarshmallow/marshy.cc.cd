import { Link } from './router'

export function NotFoundPage({ thing = 'This page' }: { thing?: string }) {
  return (
    <main className="notfound">
      <h1>Lost in the fog</h1>
      <p>{thing} isn't here — the marsh keeps shifting.</p>
      <Link to="/" className="btn btn-primary">
        Back to the porch
      </Link>
    </main>
  )
}
