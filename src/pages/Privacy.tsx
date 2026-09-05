import Seo from '../components/Seo'
import { AdSlotMiddle, AdSlotBottom } from '../components/AdSlot'

const sections = [
  {
    h: 'The short version',
    p: 'Sheetora is a static website with no backend, no database and no accounts. When you convert a bank statement or invoice, the file is read and processed entirely inside your browser. Your documents and the data extracted from them are never uploaded to us or to any third party.',
  },
  {
    h: 'How your bank statements are processed',
    p: 'Because bank statements are sensitive financial documents, they are handled carefully. When you select a file, the browser loads it into memory on your device. PDFs are read page-by-page with PDF.js and scanned pages (or image statements) are read with Tesseract.js OCR — all as JavaScript in your browser. Extracted transactions stay in the page while you review them, and the Excel or CSV file is generated locally and downloaded directly by your browser.',
  },
  {
    h: 'What we do not do',
    p: 'We do not send your documents to external services, do not log statement contents, do not put transaction data in URLs, do not permanently store statements, and do not expose your data through analytics. Temporary processing data is cleared when you finish, and sensitive statement contents are not written to local storage.',
  },
  {
    h: 'Third-party libraries',
    p: 'The first time you run OCR, Tesseract.js may download its English language data and WebAssembly engine from a public CDN so it can recognise text. These requests fetch program files needed to run the tool — your statement content is not part of them. PDF.js and SheetJS run from the app bundle itself.',
  },
  {
    h: 'Advertising',
    p: 'This site may display advertisements to support the free tool. Ad networks such as Google AdSense may use cookies to serve and measure ads. Ads are kept separate from the converter and never receive your statement or transaction data. Please refer to the relevant ad provider’s policy for details on their data practices.',
  },
  {
    h: 'Analytics',
    p: 'If basic, privacy-respecting analytics are enabled, they measure page visits only and never capture the contents of your files or transactions.',
  },
  {
    h: 'Changes to this policy',
    p: 'We may update this page as the product evolves. If any external service is ever introduced, this statement will be updated accordingly. Material changes will be reflected here with an updated date.',
  },
]

export default function Privacy() {
  return (
    <>
      <Seo
        title="Privacy Policy – How Sheetora Handles Your Bank Statements | Sheetora"
        description="Sheetora processes bank statements and invoices entirely in your browser. No backend, no storage, no upload. Read exactly how your files and data are handled."
        path="/privacy"
      />

      <section className="container-page pt-12 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-ink-400">Last updated: 2026</p>

          <div className="mt-8 space-y-8">
            {sections.slice(0, 4).map((s) => (
              <div key={s.h}>
                <h2 className="text-xl font-bold">{s.h}</h2>
                <p className="mt-2 text-ink-600">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AdSlotMiddle />

      <section className="container-page">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-8">
            {sections.slice(4).map((s) => (
              <div key={s.h}>
                <h2 className="text-xl font-bold">{s.h}</h2>
                <p className="mt-2 text-ink-600">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AdSlotBottom />
    </>
  )
}
