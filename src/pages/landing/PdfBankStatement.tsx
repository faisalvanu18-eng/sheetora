import LandingLayout from '../LandingLayout'

export default function PdfBankStatement() {
  return (
    <LandingLayout
      path="/pdf-bank-statement-to-excel"
      ctaTo="/bank-statement-to-excel"
      ctaLabel="Upload Bank Statement"
      seoTitle="PDF Bank Statement to Excel – Convert Statements in Your Browser | Sheetora"
      seoDescription="Convert PDF bank statements into structured Excel. Text-based PDFs are read directly and scanned PDFs use OCR, all processed page-by-page in your browser."
      badge="🔒 Processed in Your Browser"
      h1="PDF Bank Statement to Excel"
      intro="Extract transactions from PDF bank statements and export a clean Excel file — digital and scanned PDFs are both supported, processed page-by-page on your device."
      blocks={[
        {
          heading: 'Text-based vs scanned PDFs',
          body: 'Most bank statement PDFs are digitally generated and carry a text layer, which Sheetora reads directly for fast, accurate results. Scanned or photographed statements have no text layer, so Sheetora renders each page and reads it with OCR. It decides automatically per page, so a single document with a mix of both still works.',
        },
        {
          heading: 'Page-by-page for large statements',
          body: 'Long statements can run to dozens or hundreds of pages. Sheetora processes one page at a time and releases each page’s resources before moving on, keeping memory use low and the interface responsive. Progress is shown as “Page X of Y” with a running transaction count.',
        },
        {
          heading: 'Accurate columns and full narrations',
          body: 'Debit, credit and balance columns are detected from the statement’s own structure, and complete narrations are preserved even when they wrap across multiple lines. Anything uncertain is flagged for review rather than guessed.',
        },
      ]}
      faqs={[
        { q: 'Does it work with scanned PDF statements?', a: 'Yes. Pages without a text layer are read with on-device OCR automatically.' },
        { q: 'How large a PDF can I convert?', a: 'Sheetora supports large statements with page-by-page processing, subject to your device and browser memory. Very large files may need to be split.' },
        { q: 'Is the statement uploaded anywhere?', a: 'No. Processing happens entirely in your browser; the file is never sent to a server.' },
      ]}
    />
  )
}
