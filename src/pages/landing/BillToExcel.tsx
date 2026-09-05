import LandingLayout from '../LandingLayout'

export default function BillToExcel() {
  return (
    <LandingLayout
      path="/bill-to-excel"
      seoTitle="Bill to Excel Converter – Turn Bills into Spreadsheets | Sheetora"
      seoDescription="Convert bills and vendor statements into Excel spreadsheets in your browser. Extract dates, amounts and line items, review them, and export .xlsx. No signup required."
      badge="🔒 Private Bill Converter"
      h1="Bill to Excel Converter"
      intro="Turn vendor bills, utility bills and purchase bills into tidy Excel spreadsheets you can track and reconcile — all in your browser."
      blocks={[
        {
          heading: 'From a pile of bills to one spreadsheet',
          body: 'Tracking expenses across many bills is tedious when each one is a separate document. Sheetora reads the amounts, dates and vendor details from each bill and lays them out in rows so you can total spending, categorise costs and keep a running expense log.',
        },
        {
          heading: 'Works with photos and PDFs',
          body: 'Snap a photo of a paper bill or drop in a PDF. Images and scanned documents are read with OCR, while digital PDFs are parsed directly for the cleanest possible result.',
        },
        {
          heading: 'Accounting-friendly export',
          body: 'Choose the Accounting format to export voucher-style rows with party name, debit, credit and tax columns, or use the Basic format for a simple expense list. A summary sheet totals everything for you.',
        },
      ]}
      faqs={[
        {
          q: 'What kinds of bills can I convert?',
          a: 'Any bill you can photograph or export as a PDF — vendor bills, utility bills, purchase bills and more. Results depend on how clearly the text is printed.',
        },
        {
          q: 'Can I combine many bills into one file?',
          a: 'Yes. Add multiple bills and they are merged into a single workbook with a summary sheet.',
        },
        {
          q: 'Do you store my bills?',
          a: 'No. There is no server and no storage — everything happens locally in your browser.',
        },
      ]}
    />
  )
}
