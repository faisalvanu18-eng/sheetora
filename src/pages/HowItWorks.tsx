import { Link } from 'react-router-dom'
import { FileUp, ScanText, ListChecks, FileSpreadsheet } from 'lucide-react'
import Seo from '../components/Seo'
import { AdSlotMiddle } from '../components/AdSlot'

const steps = [
  {
    icon: FileUp,
    title: '1. Upload your bank statement',
    body: 'Drag and drop or browse for a PDF or image statement. You can add several statements at once and convert them together.',
  },
  {
    icon: ScanText,
    title: '2. Analyze page-by-page in your browser',
    body: 'For each PDF page, Sheetora first reads the embedded text layer with PDF.js. If a page has no text (a scanned statement), it renders the page and reads it with Tesseract.js OCR. Pages are processed one at a time and their resources released, keeping memory low.',
  },
  {
    icon: ListChecks,
    title: '3. Transactions detected and reviewed',
    body: 'Dates, full narrations, debit, credit and balance are extracted using flexible column detection. Wrapped narrations are joined into the right transaction. Anything uncertain is flagged “Needs Review” — never guessed — so you can correct it.',
  },
  {
    icon: FileSpreadsheet,
    title: '4. Export to Excel or CSV',
    body: 'Choose Standard, Accounting or a Custom column set, then download a formatted .xlsx (with a Summary sheet) or a clean .csv. Multiple statements combine into one workbook with a Source File column.',
  },
]

export default function HowItWorks() {
  return (
    <>
      <Seo
        title="How It Works – Bank Statement to Excel Conversion Explained | Sheetora"
        description="Learn how Sheetora converts bank statements to Excel entirely in your browser: upload, analyze page-by-page with PDF.js and OCR, review transactions, then export .xlsx or CSV."
        path="/how-it-works"
      />

      <section className="container-page pt-12 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How It Works</h1>
          <p className="mt-3 text-ink-600">
            Sheetora is a static web app — there is no server involved. Here is exactly what happens when you convert a
            bank statement.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card flex gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-ink-600">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/bank-statement-to-excel" className="btn-primary">
            <FileUp size={18} aria-hidden="true" />
            Convert a Bank Statement
          </Link>
        </div>
      </section>

      <AdSlotMiddle />
    </>
  )
}
