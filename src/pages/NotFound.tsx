import { Link } from 'react-router'
import { useTitle } from '../lib/useTitle.ts'

export default function NotFound() {
  useTitle('Not found')
  return (
    <>
      <h1>Page not found</h1>
      <p className="muted">This page doesn’t exist in the admin app.</p>
      <Link to="/">Go to the overview</Link>
    </>
  )
}
