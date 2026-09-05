import Seo from '../components/Seo'
import { AdSlotMiddle, AdSlotBottom } from '../components/AdSlot'

const sections = [
  {
    h: 'Acceptance of terms',
    p: 'By using Sheetora you agree to these terms. If you do not agree, please do not use the service.',
  },
  {
    h: 'The service',
    p: 'Sheetora is a free, browser-based tool that extracts data from invoices, bills and receipts and lets you export it to Excel. All processing happens on your device.',
  },
  {
    h: 'No warranty on accuracy',
    p: 'Extraction uses OCR and rule-based parsing, which are not perfect. Results may contain errors. You are responsible for reviewing and correcting all data before relying on it. Sheetora is provided “as is” without warranties of any kind.',
  },
  {
    h: 'Acceptable use',
    p: 'Use Sheetora only for documents you are authorised to process, and in compliance with applicable laws. Do not attempt to disrupt or misuse the service.',
  },
  {
    h: 'Limitation of liability',
    p: 'To the maximum extent permitted by law, Sheetora and its authors are not liable for any loss or damage arising from the use of, or inability to use, the service — including any errors in extracted data.',
  },
  {
    h: 'Changes',
    p: 'These terms may be updated from time to time. Continued use after changes constitutes acceptance of the updated terms.',
  },
]

export default function Terms() {
  return (
    <>
      <Seo
        title="Terms of Use | Sheetora"
        description="The terms of use for Sheetora, a free browser-based invoice to Excel converter. Review accuracy, acceptable use and liability terms."
        path="/terms"
      />

      <section className="container-page pt-12 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Terms of Use</h1>
          <p className="mt-2 text-sm text-ink-400">Last updated: 2026</p>

          <div className="mt-8 space-y-8">
            {sections.slice(0, 3).map((s) => (
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
            {sections.slice(3).map((s) => (
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
