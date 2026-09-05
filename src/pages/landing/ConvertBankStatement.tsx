import LandingLayout from '../LandingLayout'

export default function ConvertBankStatement() {
  return (
    <LandingLayout
      path="/convert-bank-statement-to-excel"
      ctaTo="/bank-statement-to-excel"
      ctaLabel="Upload Bank Statement"
      seoTitle="Convert Bank Statement to Excel – Free Online Converter | Sheetora"
      seoDescription="Convert bank statements to Excel for free. Extract transactions, dates, narrations, debit, credit and balance from PDF or image statements, right in your browser."
      badge="🔒 Free • No signup"
      h1="Convert Bank Statement to Excel"
      intro="A free, private way to convert bank statements into a structured Excel spreadsheet — designed for accountants, businesses, freelancers and individuals."
      blocks={[
        {
          heading: 'Who it is for',
          body: 'Accountants reconciling client books, business owners tracking cash flow, freelancers preparing tax records, and anyone who needs their bank data in a spreadsheet. Because it runs in the browser with no signup, you can convert a statement in seconds without handing your financial data to a third party.',
        },
        {
          heading: 'A simple four-step flow',
          body: 'Upload your statement, let Sheetora analyze it page-by-page, review the extracted transactions and fix anything flagged, then export to Excel or CSV. The review step puts you in control of the final data.',
        },
        {
          heading: 'Data integrity first',
          body: 'Sheetora prioritises correctness over quantity. It never invents dates, amounts, balances or narrations — if something cannot be confidently detected it is flagged for review. There are no “100% accurate” claims here; instead you get reliable extraction plus tools to verify it.',
        },
      ]}
      faqs={[
        { q: 'Is it really free?', a: 'Yes, the converter is free to use with no account required.' },
        { q: 'Which statements are supported?', a: 'PDF, JPG and PNG statements from most banks. The parser adapts to different column layouts.' },
        { q: 'Can I export to CSV?', a: 'Yes. You can export a standard Excel workbook, an accounting-oriented sheet, a custom column set, or a CSV file.' },
      ]}
    />
  )
}
