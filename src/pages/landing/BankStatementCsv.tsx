import LandingLayout from '../LandingLayout'

export default function BankStatementCsv() {
  return (
    <LandingLayout
      path="/bank-statement-to-csv"
      ctaTo="/bank-statement-to-excel"
      ctaLabel="Upload Bank Statement"
      seoTitle="Bank Statement to CSV Converter – Export Transactions | Sheetora"
      seoDescription="Convert bank statements to CSV for import into accounting tools and spreadsheets. Extract transactions from PDF or image statements privately in your browser."
      badge="🔒 Browser-based CSV export"
      h1="Bank Statement to CSV"
      intro="Export your bank statement transactions as a clean CSV file — ideal for importing into accounting software, spreadsheets and data tools."
      blocks={[
        {
          heading: 'Why CSV?',
          body: 'CSV is the universal format for importing transactions into accounting packages, ERPs and analysis tools. Sheetora extracts your statement’s transactions and lets you download them as a plain, well-structured CSV with consistent columns for date, narration, debit, credit and balance.',
        },
        {
          heading: 'Same accurate extraction',
          body: 'The CSV export uses the exact same engine as the Excel export: page-by-page PDF reading, OCR fallback for scans, flexible column detection and full narration preservation. You review the data first, then choose CSV at export time.',
        },
        {
          heading: 'Clean, import-friendly output',
          body: 'Amounts are normalised, narrations are kept complete on a single field, and a Source File column is added when you convert multiple statements together — so downstream imports stay tidy and traceable.',
        },
      ]}
      faqs={[
        { q: 'How do I get a CSV instead of Excel?', a: 'On the review screen, tick “Export as CSV instead of Excel” before downloading.' },
        { q: 'Will the CSV open in Excel and Google Sheets?', a: 'Yes. The CSV is standard comma-separated text that opens in any spreadsheet or accounting tool.' },
        { q: 'Is my data private?', a: 'Yes. The CSV is generated locally in your browser; your statement is never uploaded.' },
      ]}
    />
  )
}
