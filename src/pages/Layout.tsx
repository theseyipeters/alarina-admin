import { Suspense } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAdmin, useAuth } from '../auth/useAuth.ts'
import Logo from '../components/Logo.tsx'

const NAV = [
  { to: '/', label: 'Overview', end: true },
  { to: '/couples', label: 'Couples', end: false },
  { to: '/vendors', label: 'Vendors', end: false },
  { to: '/payments', label: 'Payments', end: false },
  { to: '/activity', label: 'Activity', end: false },
  { to: '/staff', label: 'Staff', end: false },
]

/** Shell for every staff page: a sidebar on wide screens, a header and tabs on phones. */
export default function Layout() {
  const admin = useAdmin()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="shell">
      <header className="side">
        <div className="side-head">
          <Link to="/" className="brand"><Logo /></Link>
          <span className="badge side-tag">Admin</span>
        </div>
        <nav className="side-nav" aria-label="Admin">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="side-link">
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <span className="side-who">
            {admin.name}
            <span className="muted">{admin.email}</span>
          </span>
          <button
            className="btn btn--secondary btn--sm"
            onClick={async () => {
              await signOut()
              navigate('/signin', { replace: true })
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main id="main" className="main">
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
