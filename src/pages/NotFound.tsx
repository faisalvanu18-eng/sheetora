import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Seo from '../components/Seo'

export default function NotFound() {
  return (
    <>
      <Seo
        title="Page Not Found | Sheetora"
        description="The page you are looking for could not be found."
        path="/404"
      />
      <section className="container-page flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-6xl font-extrabold text-brand-500">404</p>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 max-w-md text-ink-500">
          The page you are looking for doesn’t exist or may have moved.
        </p>
        <Link to="/" className="btn-primary mt-6">
          <Home size={18} aria-hidden="true" />
          Back to Home
        </Link>
      </section>
    </>
  )
}
