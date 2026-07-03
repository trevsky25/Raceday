import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-condensed uppercase tracking-widest text-sm px-3 py-2 whitespace-nowrap transition-colors ${
    isActive ? 'text-caution' : 'text-asphalt-400 hover:text-white'
  }`

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
    isActive ? 'text-caution' : 'text-asphalt-400'
  }`

function Tab({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink to={to} className={tabClass} end={to === '/'}>
      <span className="text-xl leading-none" aria-hidden="true">
        {icon}
      </span>
      <span className="font-condensed uppercase tracking-widest text-[10px]">
        {label}
      </span>
    </NavLink>
  )
}

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

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center">
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
              <>
                <span
                  className="font-condensed uppercase tracking-widest text-xs text-leader px-2 whitespace-nowrap"
                  title={`Signed in as ${session.user.email}`}
                >
                  ● {profile?.display_name ?? session.user.email?.split('@')[0]}
                </span>
                <button
                  onClick={() => void signOut()}
                  className="font-condensed uppercase tracking-widest text-sm px-3 py-2 text-asphalt-400 hover:text-penalty transition-colors whitespace-nowrap"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <NavLink to="/signin" className={navLinkClass}>
                Sign In
              </NavLink>
            )}
          </nav>

          {/* Mobile: just the account state; navigation lives in the tab bar */}
          <div className="sm:hidden">
            {session ? (
              <button
                onClick={() => void signOut()}
                className="font-condensed uppercase tracking-widest text-xs px-2 py-2 text-asphalt-400 whitespace-nowrap"
                title={`Signed in as ${session.user.email}`}
              >
                <span className="text-leader">
                  ● {profile?.display_name ?? session.user.email?.split('@')[0]}
                </span>{' '}
                · out
              </button>
            ) : (
              <NavLink to="/signin" className={navLinkClass}>
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <Outlet />
      </main>

      <footer className="border-t border-asphalt-700 mt-16 pb-20 sm:pb-0">
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
        <div className="checker-strip hidden sm:block" />
      </footer>

      {/* Mobile bottom tab bar — thumb-first navigation */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-asphalt-600 bg-asphalt-900/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Tab to="/" icon="🏁" label="Home" />
        <Tab to="/standings" icon="🏆" label="Standings" />
        <Tab to="/drivers" icon="🏎️" label="Garage" />
        <Tab to="/enter" icon="📋" label="My Entry" />
        {profile?.is_admin && <Tab to="/admin" icon="🔧" label="Pit Boss" />}
      </nav>
    </div>
  )
}
