import { Link, NavLink } from 'react-router-dom'
import { NAV_LINKS } from '../constants'
import MarketMindsLogo from './MarketMindsLogo'

function NavIcon({ type }) {
  if (type === 'watchlist') {
    return (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 18l4-6 4 4 8-10" />
      </svg>
    )
  }

  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  )
}

export default function Navbar() {
  return (
    <header className="border-b border-[#1e293b] px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex items-center justify-between gap-3">
        <Link to="/watchlist" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <MarketMindsLogo className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
          <span className="truncate text-base font-bold sm:text-lg">
            <span className="text-white">Market</span>
            <span className="text-[#3b82f6]">Minds</span>
          </span>
        </Link>

        <nav
          className="flex shrink-0 items-center gap-3 sm:gap-8"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 pb-1 text-xs font-medium transition sm:gap-2 sm:text-sm ${
                  isActive
                    ? 'border-b-2 border-[#3b82f6] text-[#3b82f6]'
                    : 'border-b-2 border-transparent text-[#94a3b8] hover:text-white'
                }`
              }
            >
              <NavIcon type={link.icon} />
              <span className="whitespace-nowrap">
                {link.to === '/options' ? (
                  <>
                    <span className="sm:hidden">Options</span>
                    <span className="hidden sm:inline">{link.label}</span>
                  </>
                ) : (
                  link.label
                )}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
