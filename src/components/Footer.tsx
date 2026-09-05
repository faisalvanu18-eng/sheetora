import { Link } from 'react-router-dom'
import Logo from './Logo'
import { SITE } from '../constants'

const productLinks = [
  { label: 'Bank Statement to Excel', to: '/bank-statement-to-excel' },
  { label: 'PDF Bank Statement to Excel', to: '/pdf-bank-statement-to-excel' },
  { label: 'Convert Bank Statement to Excel', to: '/convert-bank-statement-to-excel' },
  { label: 'Bank Statement to CSV', to: '/bank-statement-to-csv' },
  { label: 'Invoice to Excel', to: '/invoice-to-excel' },
]

const companyLinks = [
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-200 bg-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-3 text-sm font-medium text-ink-500">{SITE.tagline}</p>
          <p className="mt-4 max-w-xs text-sm text-ink-500">
            A free, browser-based converter that turns bank statements — and invoices — into
            clean, structured Excel spreadsheets.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink-900">Converters</h2>
          <ul className="mt-3 space-y-2">
            {productLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-ink-500 transition-colors hover:text-brand-600"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink-900">Learn</h2>
          <ul className="mt-3 space-y-2">
            {companyLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-ink-500 transition-colors hover:text-brand-600"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink-900">Private by design</h2>
          <p className="mt-3 text-sm text-ink-500">
            Your files never leave your device. All processing happens locally in your browser.
          </p>
        </div>
      </div>

      <div className="border-t border-ink-200">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 sm:flex-row">
          <p className="text-sm text-ink-400">© 2026 {SITE.name}</p>
          <p className="text-sm font-medium text-ink-400">{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  )
}
