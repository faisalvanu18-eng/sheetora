import LandingLayout from '../LandingLayout'

export default function ReceiptToExcel() {
  return (
    <LandingLayout
      path="/receipt-to-excel"
      seoTitle="Receipt to Excel Converter – Digitise Receipts to XLSX | Sheetora"
      seoDescription="Convert receipts into Excel for expense tracking. Photograph or upload receipts, extract totals and dates, review and export .xlsx — all privately in your browser."
      badge="🔒 On-Device Receipt Reader"
      h1="Receipt to Excel Converter"
      intro="Digitise receipts into an Excel expense sheet — capture the merchant, date and total, review, and export without anything leaving your phone or laptop."
      blocks={[
        {
          heading: 'Expense tracking made simple',
          body: 'Receipts pile up fast. Sheetora reads the merchant, date and amount from a receipt photo and adds it to a spreadsheet, so building an expense report or reimbursement claim becomes a matter of minutes rather than manual typing.',
        },
        {
          heading: 'Take a photo and go',
          body: 'On mobile you can use your camera directly. Sheetora runs OCR on the image in your browser to pull out the details, then lets you tidy them up before export — handy for travel, meals and office supplies.',
        },
        {
          heading: 'Review keeps you in control',
          body: 'Receipt print quality varies a lot, so treat the extracted values as a starting point. Everything is editable in the Review step, which keeps your expense records accurate.',
        },
      ]}
      faqs={[
        {
          q: 'Can I use my phone camera?',
          a: 'Yes. On supported mobile browsers the Take Photo button opens your camera so you can capture a receipt directly.',
        },
        {
          q: 'How accurate is receipt reading?',
          a: 'It depends on the receipt. Faded thermal paper or crumpled receipts read less reliably, which is why every field is editable before export.',
        },
        {
          q: 'Are receipts uploaded anywhere?',
          a: 'No. OCR runs locally in your browser and nothing is sent to a server.',
        },
      ]}
    />
  )
}
