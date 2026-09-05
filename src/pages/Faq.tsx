import Seo from '../components/Seo'
import FaqAccordion, { type FaqItem } from '../components/FaqAccordion'
import { AdSlotMiddle } from '../components/AdSlot'
import { SITE } from '../constants'

const FAQS: FaqItem[] = [
  { q: 'Is Sheetora free?', a: 'Yes. Sheetora is completely free to use with no usage limits or hidden charges.' },
  { q: 'Do I need an account?', a: 'No. There is no signup or login. Open the converter and start immediately.' },
  {
    q: 'Is my bank statement uploaded?',
    a: 'No. Sheetora is a static web app with no backend. Your statement is read and processed entirely inside your browser and is never transmitted to a server, logged, or permanently stored.',
  },
  {
    q: 'How are long narrations handled?',
    a: 'The complete available narration is preserved. When a narration wraps across multiple lines, those lines are joined into the correct transaction — nothing is truncated or summarised.',
  },
  {
    q: 'Which statement layouts are supported?',
    a: 'Sheetora adapts to Debit/Credit, Withdrawal/Deposit, and single Amount + Dr/Cr layouts, detecting columns from the statement’s own structure rather than assuming one fixed format.',
  },
  {
    q: 'What happens if a value is unclear?',
    a: 'Sheetora never invents data. If a date, amount or debit/credit direction cannot be confidently detected, the transaction is flagged “Needs Review” so you can correct it before export.',
  },
  { q: 'Can I convert scanned statements?', a: 'Yes. Text-based PDFs are read directly, and scanned PDFs or image statements are read page-by-page with on-device OCR.' },
  { q: 'Can I process large or multiple statements?', a: 'Yes. Large PDFs are processed page-by-page to reduce memory use, and multiple statements combine into one workbook with a Source File column.' },
  { q: 'Can I export to CSV?', a: 'Yes. You can download a formatted Excel workbook or a clean CSV for import into accounting tools.' },
  { q: 'Does it work on mobile?', a: 'Yes. Sheetora is mobile-first with searchable transaction cards and mobile-friendly editing.' },
  { q: 'Do you also convert invoices?', a: 'Yes. Invoice to Excel is available as a secondary tool — you can find it under More or in Other Useful Converters.' },
]

export default function Faq() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <Seo
        title="FAQ – Frequently Asked Questions | Sheetora"
        description="Answers to common questions about Sheetora: is it free, are invoices uploaded, does it support PDF and GST, can I edit data, and does it work on mobile?"
        path="/faq"
        jsonLd={jsonLd}
      />

      <section className="container-page pt-12 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-ink-600">
            Everything you might want to know about {SITE.name}.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <FaqAccordion items={FAQS} />
        </div>
      </section>

      <AdSlotMiddle />
    </>
  )
}
