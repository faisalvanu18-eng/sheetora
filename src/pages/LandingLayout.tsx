import { Link } from 'react-router-dom'
import { FileUp } from 'lucide-react'
import Seo from '../components/Seo'
import { AdSlotTop, AdSlotMiddle, AdSlotBottom } from '../components/AdSlot'
import FaqAccordion, { type FaqItem } from '../components/FaqAccordion'

export interface ContentBlock {
  heading: string
  body: string
}

interface LandingLayoutProps {
  seoTitle: string
  seoDescription: string
  path: string
  badge: string
  h1: string
  intro: string
  blocks: ContentBlock[]
  faqs: FaqItem[]
  ctaTo?: string
  ctaLabel?: string
}

export default function LandingLayout({
  seoTitle,
  seoDescription,
  path,
  badge,
  h1,
  intro,
  blocks,
  faqs,
  ctaTo = '/invoice-to-excel',
  ctaLabel = 'Open the Converter',
}: LandingLayoutProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <Seo title={seoTitle} description={seoDescription} path={path} jsonLd={jsonLd} />

      <section className="container-page pt-12 text-center sm:pt-16">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-600 shadow-sm">
          {badge}
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          {h1}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink-600">{intro}</p>
        <div className="mt-7">
          <Link to={ctaTo} className="btn-primary">
            <FileUp size={18} aria-hidden="true" />
            {ctaLabel}
          </Link>
        </div>
      </section>

      <AdSlotTop />

      <section className="container-page py-8">
        <div className="mx-auto max-w-3xl space-y-10">
          {blocks.map((b) => (
            <div key={b.heading}>
              <h2 className="text-2xl font-bold">{b.heading}</h2>
              <p className="mt-2 text-ink-600">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <AdSlotMiddle />

      <section className="container-page py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-4">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>

      <AdSlotBottom />
    </>
  )
}
