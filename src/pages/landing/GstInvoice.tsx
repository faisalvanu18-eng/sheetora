import LandingLayout from '../LandingLayout'

export default function GstInvoice() {
  return (
    <LandingLayout
      path="/gst-invoice-to-excel"
      seoTitle="GST Invoice to Excel Converter – Export CGST, SGST & IGST | Sheetora"
      seoDescription="Convert GST invoices to Excel with GSTIN, HSN/SAC and CGST/SGST/IGST columns. Build purchase and sales registers in your browser — no signup, no upload."
      badge="🔒 Browser-Based GST Converter"
      h1="GST Invoice to Excel Converter"
      intro="Turn GST invoices into register-ready Excel sheets with GSTIN, HSN/SAC and tax breakups — processed entirely on your device."
      blocks={[
        {
          heading: 'Built for GST registers',
          body: 'Sheetora recognises GSTIN numbers and separates the CGST, SGST and IGST components so you can export a GST Purchase Register or GST Sales Register directly. Each line keeps its HSN/SAC code and taxable value, which makes reconciliation and return filing far quicker than retyping figures by hand.',
        },
        {
          heading: 'CGST, SGST and IGST explained',
          body: 'Intra-state supplies usually split tax into CGST (central) and SGST (state), while inter-state supplies use a single IGST. Sheetora keeps these in dedicated columns so your spreadsheet mirrors how the tax actually appears on the invoice, and totals roll up on the Summary sheet.',
        },
        {
          heading: 'Review before you export',
          body: 'OCR and PDF parsing are never perfect, so every detected GSTIN, tax rate and amount is fully editable. Fix anything that needs a correction, add missing HSN/SAC codes, and only then generate the workbook.',
        },
      ]}
      faqs={[
        {
          q: 'Does it detect GSTIN numbers?',
          a: 'Yes. Sheetora scans the document for valid 15-character GSTIN patterns and assigns the first to the supplier and the second to the customer, which you can adjust in Review.',
        },
        {
          q: 'Can I build a purchase or sales register?',
          a: 'Yes. Choose the GST Purchase Register or GST Sales Register format to export the appropriate GSTIN and tax columns.',
        },
        {
          q: 'Is my GST data sent anywhere?',
          a: 'No. All parsing happens locally in your browser. Nothing is uploaded to a server.',
        },
      ]}
    />
  )
}
