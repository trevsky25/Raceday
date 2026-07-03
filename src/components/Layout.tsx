import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-condensed uppercase tracking-widest text-sm px-3 py-2 transition-colors ${
    isActive ? 'text-caution' : 'text-asphalt-400 hover:text-white'
  }`

export default function Layout() {
  const { session, profile, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <div className="checker-strip" />
      <header className="border-b border-asphalt-700 bg-asphalt-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <Link to="/" className="display-head text-2xl leading-none">
            RACE<span className="text-caution">DAY</span>
          </Link>
          <nav className="flex items-center">
            <NavLink to="/standings" className={navLinkClass}>
              Standings
            </NavLink>
            <NavLink to="/drivers" className={navLinkClass}>
              Drivers
            </NavLink>
            <NavLink to="/enter" className={navLinkClass}>
              My Entry
            </NavLink>
            {profile?.is_admin && (
              <NavLink to="/admin" className={navLinkClass}>
                Pit Boss
              </NavLink>
            )}
            {session ? (
              <button
                onClick={() => void signOut()}
                className="font-condensed uppercase tracking-widest text-sm px-3 py-2 text-asphalt-400 hover:text-penalty transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <NavLink to="/signin" className={navLinkClass}>
                Sign In
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-asphalt-700 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center space-y-3">
          <p className="font-condensed italic text-asphalt-400">
            &ldquo;...because tomorrow morning it's the fastest who get paid, and
            it's the fastest who get laid.&rdquo;
          </p>
          <p className="text-xs text-asphalt-400 max-w-xl mx-auto">
            This site tracks scores only and does not process payments or wagers.
            Player contact info is never shown publicly — pool names only.
          </p>
        </div>
        <div className="checker-strip" />
      </footer>
    </div>
  )
}
