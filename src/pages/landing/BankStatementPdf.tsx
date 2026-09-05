import LandingLayout from '../LandingLayout'

export default function BankStatementPdf() {
  return (
    <LandingLayout
      path="/bank-statement-pdf-to-excel"
      ctaTo="/bank-statement-to-excel"
      ctaLabel="Upload Bank Statement"
      seoTitle="Bank Statement PDF to Excel Converter – Extract Transactions | Sheetora"
      seoDescription="Turn a bank statement PDF into an Excel spreadsheet of transactions with dates, narrations, debit, credit and balance. Private, browser-based, no signup."
      badge="🔒 Private • Browser-based"
      h1="Bank Statement PDF to Excel"
      intro="Convert the transactions inside a bank statement PDF into rows you can sort, filter and reconcile in Excel — without retyping a thing."
      blocks={[
        {
          heading: 'Why move statements into Excel?',
          body: 'A PDF is fine for reading but awful for analysis. Once your transactions are in Excel you can total inflows and outflows, categorise spending, match payments to invoices, and feed the data into accounting software. Sheetora does the tedious extraction so you can get straight to the analysis.',
        },
        {
          heading: 'Flexible column detection',
          body: 'Banks format statements differently — Debit/Credit, Withdrawal/Deposit, or a single Amount column with a Dr/Cr flag. Sheetora reads the header and structure to map columns correctly instead of assuming one fixed layout.',
        },
        {
          heading: 'Built-in review and validation',
          body: 'Every extraction is checked: dates and amounts must be present and numeric, and likely duplicates are flagged. Transactions that need a human eye are marked “Needs Review”, so you export data you can trust.',
        },
      ]}
      faqs={[
        { q: 'Can I convert multiple statement PDFs at once?', a: 'Yes. Upload several files and they are combined into one workbook with a Source File column so you can trace each row.' },
        { q: 'Will long narrations be shortened?', a: 'No. The complete available narration is preserved, including reference and UTR details.' },
        { q: 'Do you store my statement?', a: 'No. There is no server or storage — everything is processed locally and cleared when you are done.' },
      ]}
    />
  )
}
