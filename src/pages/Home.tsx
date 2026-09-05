import { Link } from 'react-router-dom'
import { Lock, FileUp, ArrowRight, FileText, ScanText, ListChecks, FileSpreadsheet, ShieldCheck, UserRoundCheck, Layers, Pencil, Search, FileDown } from 'lucide-react'
import Seo from '../components/Seo'
import { AdSlotTop, AdSlotMiddle, AdSlotBottom } from '../components/AdSlot'
import { SITE } from '../constants'

const HOW_STEPS = [
  { n: '1', title: 'Upload your statement', body: 'Add a PDF or image bank statement. Multiple files are supported.' },
  { n: '2', title: 'Analyze in your browser', body: 'Sheetora reads each page locally — text layer first, OCR for scans.' },
  { n: '3', title: 'Review transactions', body: 'Check dates, narrations, debit, credit and balance; fix anything flagged.' },
  { n: '4', title: 'Export to Excel', body: 'Download a clean .xlsx or .csv with a summary sheet.' },
]

const FEATURES = [
  { icon: ShieldCheck, title: 'Private', body: 'Statements are processed in your browser and never uploaded.' },
  { icon: UserRoundCheck, title: 'No Signup', body: 'Start converting immediately — no account, no email.' },
  { icon: ListChecks, title: 'Full Narrations', body: 'Complete narrations preserved, including wrapped lines and references.' },
  { icon: Layers, title: 'Any Layout', body: 'Handles Debit/Credit, Withdrawal/Deposit and Amount + Dr/Cr formats.' },
  { icon: Pencil, title: 'Review & Edit', body: 'Verify and correct every transaction before you export.' },
  { icon: FileSpreadsheet, title: 'Excel & CSV', body: 'Export a formatted .xlsx or a clean CSV for accounting tools.' },
]

const SUPPORTED = [
  { icon: FileText, title: 'Text-based PDFs', body: 'Digitally generated statements are read directly for speed and accuracy.' },
  { icon: ScanText, title: 'Scanned PDFs & images', body: 'Scans and photos are read page-by-page with on-device OCR.' },
  { icon: Search, title: 'Multi-page statements', body: 'Long statements are processed page-by-page to keep memory low.' },
  { icon: FileDown, title: 'Multiple statements', body: 'Combine several files into one workbook with a Source File column.' },
]

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Sheetora',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web browser',
    url: SITE.url,
    description:
      'Convert bank statement PDFs and images into structured Excel spreadsheets directly in your browser.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  return (
    <>
      <Seo
        title="Bank Statement to Excel Converter – Convert PDF to Excel | Sheetora"
        description="Convert bank statement PDFs and images into structured Excel spreadsheets. Extract transactions, dates, narrations, debit, credit and balance directly in your browser."
        path="/"
        jsonLd={jsonLd}
      />

      {/* HERO */}
      <section className="container-page pt-12 text-center sm:pt-16">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-600 shadow-sm">
          <Lock size={13} aria-hidden="true" />
          Processed in Your Browser
        </span>

        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Convert Bank Statements to Excel
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-ink-700 sm:text-xl">
          Turn PDF or image bank statements into clean, structured Excel spreadsheets.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-ink-500">
          Extract dates, transactions, debit, credit, balance and full narrations directly in your browser.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/bank-statement-to-excel" className="btn-primary w-full sm:w-auto">
            <FileUp size={18} aria-hidden="true" />
            Upload Bank Statement
          </Link>
          <Link to="/how-it-works" className="btn-secondary w-full sm:w-auto">
            How It Works
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <ul className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-500">
          <li>✓ No signup</li>
          <li>✓ No backend</li>
          <li>✓ Browser-based processing</li>
          <li>✓ Excel export</li>
        </ul>
      </section>

      <AdSlotTop />

      {/* HOW IT WORKS */}
      <section className="container-page py-12 sm:py-16" aria-labelledby="home-how-heading">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="home-how-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            From statement to spreadsheet in four steps
          </h2>
          <p className="mt-3 text-ink-500">A simple, private workflow — nothing leaves your device.</p>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((s) => (
            <li key={s.n} className="card p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">{s.n}</span>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FEATURES */}
      <section id="features" className="container-page py-8 sm:py-12" aria-labelledby="features-heading">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="features-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Built for accurate statement conversion
          </h2>
          <p className="mt-3 text-ink-500">
            Designed for reliable extraction with built-in review and validation.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <AdSlotMiddle />

      {/* SUPPORTED DOCUMENTS */}
      <section className="container-page py-8 sm:py-12" aria-labelledby="supported-heading">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="supported-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Supported statements
          </h2>
          <p className="mt-3 text-ink-500">Sheetora adapts to different banks, layouts and file types.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPORTED.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRIMARY CTA */}
      <section className="container-page pb-4">
        <div className="card flex flex-col items-center gap-4 bg-brand-500 p-8 text-center text-white sm:p-12">
          <h2 className="max-w-xl text-2xl font-bold sm:text-3xl">Ready to convert your bank statement?</h2>
          <p className="max-w-lg text-brand-50">Free, private and fast. No account required.</p>
          <Link to="/bank-statement-to-excel" className="btn min-h-[44px] bg-white px-6 text-brand-700 hover:bg-brand-50">
            <FileUp size={18} aria-hidden="true" />
            Upload Bank Statement
          </Link>
        </div>
      </section>

      <AdSlotMiddle />

      {/* OTHER TOOLS — secondary Invoice converter */}
      <section className="container-page py-8" aria-labelledby="other-tools-heading">
        <h2 id="other-tools-heading" className="text-xl font-bold tracking-tight">Other Useful Converters</h2>
        <p className="mt-1 text-sm text-ink-500">Additional tools from Sheetora.</p>
        <div className="mt-5 max-w-xl">
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-600">
                <FileText size={22} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-semibold">Invoice to Excel</h3>
                <p className="mt-0.5 text-sm text-ink-500">Convert invoices and bills into structured Excel data.</p>
              </div>
            </div>
            <Link to="/invoice-to-excel" className="btn-secondary shrink-0">
              Open Invoice Converter
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <AdSlotBottom />
    </>
  )
}
