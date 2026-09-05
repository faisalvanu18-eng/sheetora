import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, FileUp, ChevronDown } from 'lucide-react'
import Logo from './Logo'
import { NAV_LINKS, NAV_MORE_LINKS } from '../constants'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close the "More" dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'text-brand-600' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) =>
            link.to.startsWith('/#') ? (
              <a key={link.to} href={link.to} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900">
                {link.label}
              </a>
            ) : (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ),
          )}

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
              aria-expanded={moreOpen}
              aria-haspopup="true"
              onClick={() => setMoreOpen((v) => !v)}
            >
              More
              <ChevronDown size={16} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-xl border border-ink-200 bg-white p-1.5 shadow-card">
                {NAV_MORE_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/bank-statement-to-excel" className="btn-primary hidden sm:inline-flex">
            <FileUp size={18} aria-hidden="true" />
            Convert Bank Statement
          </Link>

          <button
            type="button"
            className="btn-ghost min-w-[44px] px-2 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-ink-900/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        {/* Panel — fixed to the viewport so its height always resolves */}
        <div
          id="mobile-drawer"
          className={`fixed inset-y-0 right-0 z-50 flex h-screen w-[82%] max-w-sm flex-col bg-white shadow-xl transition-transform duration-200 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200 px-4">
            <Logo onClick={() => setOpen(false)} />
            <button type="button" className="btn-ghost min-w-[44px] px-2" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X size={24} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4">
            {NAV_LINKS.map((link) =>
              link.to.startsWith('/#') ? (
                <a key={link.to} href={link.to} onClick={() => setOpen(false)} className="flex min-h-[48px] items-center rounded-lg px-4 text-base font-medium text-ink-700 hover:bg-ink-50">
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex min-h-[48px] items-center rounded-lg px-4 text-base font-medium ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ),
            )}
            <div className="my-2 border-t border-ink-100" />
            {NAV_MORE_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center rounded-lg px-4 text-base font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="shrink-0 border-t border-ink-200 p-4">
            <Link to="/bank-statement-to-excel" className="btn-primary w-full">
              <FileUp size={18} aria-hidden="true" />
              Convert Bank Statement
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
