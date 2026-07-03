import type { ReactNode } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-condensed uppercase tracking-widest text-sm px-3 py-2 whitespace-nowrap transition-colors ${
    isActive ? 'text-caution' : 'text-asphalt-400 hover:text-white'
  }`

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
    isActive ? 'text-caution' : 'text-asphalt-400'
  }`

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function FlagIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M4 22V3" />
      <path d="M4 4h15v10H4" />
      <rect x="5.5" y="5.5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="11.5" y="5.5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="8.5" y="8.5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="14.5" y="8.5" width="3" height="3" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function WheelIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 14.5V21" />
      <path d="M9.6 11.3 3.2 10" />
      <path d="m14.4 11.3 6.4-1.3" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function Tab({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink to={to} className={tabClass} end={to === '/'}>
      {icon}
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
        <Tab to="/" icon={<FlagIcon />} label="Home" />
        <Tab to="/standings" icon={<TrophyIcon />} label="Standings" />
        <Tab to="/drivers" icon={<WheelIcon />} label="Garage" />
        <Tab to="/enter" icon={<ClipboardIcon />} label="My Entry" />
        {profile?.is_admin && <Tab to="/admin" icon={<WrenchIcon />} label="Pit Boss" />}
      </nav>
    </div>
  )
}
