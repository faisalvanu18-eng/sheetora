import { Link } from 'react-router-dom'

interface LogoProps {
  className?: string
  onClick?: () => void
}

/** Sheetora wordmark + spreadsheet/transform mark. */
export default function Logo({ className = '', onClick }: LogoProps) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Sheetora home"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="3" width="10" height="14" rx="2" fill="#fff" />
          <rect x="6" y="6" width="6" height="1.4" rx="0.7" fill="#8fb6ff" />
          <rect x="6" y="9" width="6" height="1.4" rx="0.7" fill="#8fb6ff" />
          <rect x="6" y="12" width="4" height="1.4" rx="0.7" fill="#8fb6ff" />
          <path
            d="M13 19h6m0 0l-2.2-2.2M19 19l-2.2 2.2"
            stroke="#bbf7d0"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-ink-900">Sheetora</span>
    </Link>
  )
}
