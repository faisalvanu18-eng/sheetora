import LandingLayout from '../LandingLayout'

export default function PdfInvoice() {
  return (
    <LandingLayout
      path="/pdf-invoice-to-excel"
      seoTitle="PDF Invoice to Excel Converter – Convert PDF Bills to XLSX | Sheetora"
      seoDescription="Convert PDF invoices to Excel in your browser. Digital PDFs are parsed instantly and scanned PDFs are read with OCR. No signup, no backend, no file upload."
      badge="🔒 Local PDF Processing"
      h1="PDF Invoice to Excel Converter"
      intro="Extract invoice data from PDF files and export a clean .xlsx — digital and scanned PDFs are both supported, all processed on your device."
      blocks={[
        {
          heading: 'Digital and scanned PDFs',
          body: 'Sheetora uses PDF.js to read text directly from digital PDFs, which is fast and highly accurate. When a page has little or no embedded text — a scanned or photographed document — the page is rendered to an image and read with OCR automatically, so you get results either way.',
        },
        {
          heading: 'Why convert PDF invoices to Excel?',
          body: 'PDF is great for sharing but painful for bookkeeping. Moving the numbers into Excel lets you sort, filter, sum and reconcile invoices, feed them into accounting software, or prepare tax returns without manual re-entry.',
        },
        {
          heading: 'Multiple PDFs at once',
          body: 'Add several PDF invoices and Sheetora combines them into a single workbook with per-invoice rows, an item-detail sheet and a summary sheet with grand totals.',
        },
      ]}
      faqs={[
        {
          q: 'Does it work with scanned PDFs?',
          a: 'Yes. If a PDF has no selectable text, Sheetora renders the pages and runs OCR on them automatically.',
        },
        {
          q: 'Are my PDFs uploaded?',
          a: 'No. PDF parsing and OCR run entirely in your browser. Your files never leave your device.',
        },
        {
          q: 'What if extraction misses something?',
          a: 'Every field is editable in the Review step, so you can correct or add anything before exporting.',
        },
      ]}
    />
  )
}
