Build a production-quality, **mobile-first static website** called:

# SHEETORA

### Brand tagline

**Bills In. Excel Out.**

### Main SEO title

**Invoice to Excel Converter – Convert Bills & Invoices to Excel | Sheetora**

### Main purpose

Sheetora is a free browser-based tool that converts invoices, bills, receipts and accounting documents into structured Excel spreadsheets.

The primary use case is:

**Upload invoice → Extract accounting fields → Review → Export Excel**

---

# ABSOLUTE TECHNICAL REQUIREMENT

This must be a **100% static frontend-only website**.

There must be:

* NO backend
* NO database
* NO authentication
* NO Supabase
* NO Firebase
* NO server
* NO API keys
* NO external AI APIs

All document processing must happen locally inside the user's browser.

Use:

* React
* Vite
* TypeScript
* Tailwind CSS
* Tesseract.js
* PDF.js
* SheetJS (`xlsx`)
* Lucide React

The final website must be deployable as a static site.

---

# BRAND IDENTITY

Brand name:

**Sheetora**

Use the brand consistently throughout the website.

Logo concept:

A clean spreadsheet/document icon combined with a subtle transformation arrow.

Logo text:

**Sheetora**

Do not use generic "AI" branding.

The product should feel like a professional financial utility rather than an AI chatbot.

---

# VISUAL STYLE

Create a premium modern fintech/document-processing interface.

Design inspiration:

* modern SaaS
* fintech
* accounting software
* productivity applications

The UI should be:

* clean
* professional
* trustworthy
* minimal
* modern
* fast
* highly usable

Avoid:

* excessive gradients
* excessive glassmorphism
* giant unnecessary text
* excessive animations
* clutter
* generic dashboard designs

Use strong typography, generous whitespace, subtle borders, rounded cards and tasteful shadows.

---

# MOBILE-FIRST

Design for mobile FIRST.

Primary target:

**360px width**

Then ensure perfect layouts at:

* 375px
* 390px
* 412px
* tablets
* desktop
* large desktop

Do not simply shrink desktop layouts.

Use:

**minimum 44px touch targets**

No horizontal page overflow.

---

# HEADER

Desktop:

```text
Sheetora

Home   Invoice to Excel   How It Works   FAQ   Privacy

                         Upload Invoice
```

Mobile:

```text
┌────────────────────────────┐
│ Sheetora              ☰    │
└────────────────────────────┘
```

Use a smooth mobile navigation drawer.

---

# HERO

Create a strong SEO-friendly hero.

Small badge:

**🔒 Private Browser-Based Converter**

H1:

**Invoice to Excel Converter**

Supporting headline:

**Turn bills and invoices into clean, accounting-ready Excel spreadsheets.**

Description:

**Upload a PDF, JPG or PNG invoice, extract the important fields directly in your browser, review the results, and download your Excel file.**

Primary button:

**Upload Invoice**

Secondary button:

**How It Works**

Trust line:

**No signup • No backend • No file storage**

---

# HERO PREVIEW

Below the hero, show a beautiful product preview.

Desktop:

Two-column layout:

LEFT:

Invoice preview

RIGHT:

Extracted fields

Mobile:

Stack vertically.

Show example:

```text
Invoice Number
INV-1025

Supplier
ABC Traders

GSTIN
27XXXXXXXXXXXXXX

Taxable Amount
₹50,000

CGST
₹4,500

SGST
₹4,500

Total
₹59,000
```

Then show:

**✓ Excel Ready**

---

# ADVERTISEMENT SYSTEM

Build a reusable ad component:

`AdSlot.tsx`

It must support:

* responsive sizing
* mobile layout
* desktop layout
* placeholder during development
* easy replacement with Google AdSense code later

IMPORTANT:

Do not hard-code fake advertisements.

During development show:

```text
ADVERTISEMENT
```

with a subtle neutral placeholder.

Create different placements:

### AdSlotTop

Below the hero.

### AdSlotMiddle

Between major content sections.

### AdSlotBottom

Before the footer.

### AdSlotConverter

Inside the converter page, but never obstructing the upload/review/export workflow.

Ads must NEVER:

* cover buttons
* cover navigation
* cover uploaded files
* appear inside form inputs
* interfere with downloads
* use deceptive click areas

On mobile, keep sufficient spacing around ads.

---

# CONVERTER PAGE

Create:

`/invoice-to-excel`

At the top show:

```text
Invoice to Excel Converter
Convert your invoice into an accounting-ready spreadsheet.
```

Progress indicator:

```text
1 Upload → 2 Extract → 3 Review → 4 Export
```

On mobile:

```text
Step 1 of 4
Upload
●━━━○━━━○━━━○
```

---

# UPLOAD

Large responsive upload card.

Desktop:

```text
┌────────────────────────────────────────┐
│                                        │
│                 📄                     │
│                                        │
│        Drop your invoice here          │
│                                        │
│        or click to browse              │
│                                        │
│        JPG • PNG • PDF                 │
│                                        │
│        Maximum 10 MB                   │
└────────────────────────────────────────┘
```

Mobile:

Make it compact and easy to tap.

Buttons:

**Choose File**

and, where supported:

**Take Photo**

Support:

* JPG
* JPEG
* PNG
* PDF

Support multiple files.

---

# OCR

Use Tesseract.js for browser OCR.

Use PDF.js for PDFs.

Never upload documents to a server.

Show real processing progress.

Stages:

1. Reading document
2. Detecting text
3. Finding invoice details
4. Finding GST information
5. Reading items
6. Preparing spreadsheet

---

# EXTRACTION

Extract common accounting fields.

### Invoice

* Invoice Number
* Invoice Date
* Due Date

### Supplier

* Supplier Name
* Supplier Address
* GSTIN
* Phone
* Email

### Customer

* Customer Name
* Customer Address
* GSTIN

### Items

* Description
* HSN/SAC
* Quantity
* Unit
* Rate
* Discount
* Taxable Amount
* GST Rate
* CGST
* SGST
* IGST
* Cess
* Total

### Totals

* Subtotal
* Total Tax
* Round Off
* Grand Total

Use deterministic client-side parsing and OCR results.

Do not claim "AI accuracy" because this version does not use an AI API.

---

# REVIEW

Show:

**Review your extracted data**

Every extracted field must be editable.

Use cards/accordions on mobile.

Use tables on desktop.

Show warnings:

**⚠ GSTIN not detected**

**⚠ Invoice date needs review**

**⚠ HSN/SAC missing**

Allow the user to fix everything before exporting.

---

# ITEMS

Desktop:

Use an editable table.

Mobile:

Use item cards.

Each item card should show:

* description
* HSN/SAC
* quantity
* rate
* GST
* taxable amount
* total

Buttons:

**Edit**

**Delete**

**+ Add Item**

---

# EXCEL FORMATS

Create:

### Basic Invoice

Date | Invoice No | Supplier | Customer | Description | Qty | Rate | Taxable Amount | Tax | Total

### GST Purchase Register

Date | Invoice No | Supplier | Supplier GSTIN | HSN/SAC | Taxable Value | CGST | SGST | IGST | Total

### GST Sales Register

Date | Invoice No | Customer | Customer GSTIN | HSN/SAC | Taxable Value | CGST | SGST | IGST | Total

### Accounting Format

Date | Voucher No | Party Name | Description | Debit | Credit | Tax | Total

### Custom

Allow users to select their own columns.

---

# EXCEL GENERATION

Use SheetJS.

Generate a real `.xlsx`.

Apply:

* readable column widths
* headers
* number formatting
* date formatting
* currency formatting
* totals

Multiple invoices should be combined into one workbook.

Possible sheets:

1. Invoice Data
2. Item Details
3. Summary

---

# SUCCESS SCREEN

After export:

Large success icon.

Heading:

**Your Excel file is ready**

Show:

```text
Sheetora_Invoice_Data.xlsx

✓ Data extracted
✓ Data reviewed
✓ Excel generated
```

Button:

**Download Excel**

Secondary:

**Convert Another Invoice**

---

# MOBILE STICKY ACTION

On mobile, keep the primary workflow action visible near the bottom:

**Generate Excel**

Do not allow it to overlap page content.

Add appropriate bottom padding.

---

# SEO LANDING PAGES

Create SEO-friendly routes:

`/invoice-to-excel`

`/gst-invoice-to-excel`

`/pdf-invoice-to-excel`

`/bill-to-excel`

`/receipt-to-excel`

Each page should have unique, useful content.

Do not create duplicate SEO pages with only the keyword changed.

---

# SEO CONTENT

Homepage title:

**Invoice to Excel Converter – Convert Bills & Invoices to Excel | Sheetora**

Description:

**Convert invoices, bills and receipts into clean Excel spreadsheets. Process documents directly in your browser with no signup, no backend and no file storage.**

Use natural keywords:

* invoice to Excel
* invoice converter
* bill to Excel
* PDF invoice to Excel
* GST invoice to Excel
* receipt to Excel
* accounting Excel converter

Create proper:

* H1
* H2
* H3
* meta title
* meta description
* canonical URL
* Open Graph tags
* robots.txt
* sitemap.xml
* structured data where appropriate

---

# SEO CONTENT SECTION

On the invoice-to-excel page, add useful explanatory content below the converter:

## How to Convert an Invoice to Excel

Explain the process naturally.

## What Information Can Sheetora Extract?

Explain invoice number, date, supplier, GSTIN, HSN/SAC, taxes, totals and line items.

## GST Invoice to Excel

Explain common CGST, SGST and IGST fields.

## PDF Invoice to Excel

Explain PDF support.

## Frequently Asked Questions

Include useful FAQs.

This content should help the page rank organically rather than using keyword stuffing.

---

# AD-FRIENDLY CONTENT LAYOUT

Use this structure:

```text
HEADER

HERO
↓
AD SLOT

CONVERTER
↓
AD SLOT

HOW IT WORKS
↓
FEATURES
↓
AD SLOT

SEO CONTENT
↓
FAQ
↓
PRIVACY
↓
FOOTER
```

Keep ads visually separate from the tool.

The converter itself must remain the main focus.

---

# FEATURES

Create six cards:

### Private

Files stay in the browser.

### No Signup

Start immediately.

### GST Ready

Extract common GST fields.

### Multiple Files

Process multiple invoices.

### Editable

Review and correct extracted information.

### Excel Export

Download `.xlsx`.

---

# PRIVACY

Create `/privacy`.

Explain exactly how the static application processes files.

Do not make privacy claims that aren't technically true.

---

# FAQ

Include:

Is Sheetora free?

Do I need an account?

Are my invoices uploaded?

Does it support PDF?

Does it support GST invoices?

Can I edit extracted information?

Can I process multiple invoices?

Can I download Excel?

Does it work on mobile?

---

# FOOTER

```text
Sheetora

Bills In. Excel Out.

Invoice to Excel
GST Invoice to Excel
PDF to Excel
Bill to Excel
Receipt to Excel

How It Works
FAQ
Privacy
Terms

© 2026 Sheetora
```

---

# PERFORMANCE

Optimize for Core Web Vitals.

* Lazy-load Tesseract.js
* Lazy-load PDF.js
* Use Web Workers where practical
* Code split converter functionality
* Avoid loading OCR libraries on the homepage unnecessarily
* Compress assets
* Keep initial bundle small

---

# ACCESSIBILITY

Implement:

* semantic HTML
* keyboard navigation
* visible focus states
* proper form labels
* accessible status updates
* accessible buttons
* good color contrast
* reduced-motion support

---

# RESPONSIVE TESTING

Before finishing, test:

360px
375px
390px
412px
768px
1024px
1280px
1440px

Fix all:

* horizontal overflow
* clipped text
* tiny buttons
* broken cards
* broken tables
* overlapping ads
* sticky button issues
* mobile navigation issues

---

# FINAL REQUIREMENT

This must be a REAL WORKING STATIC APPLICATION.

Do not create a fake UI.

The complete flow must work:

Upload invoice
↓
OCR
↓
Extract
↓
Review
↓
Edit
↓
Choose accounting format
↓
Generate real XLSX
↓
Download

No backend.

No API.

No fake AI.

No placeholder conversion functionality.

Build it as a polished product called **Sheetora**.


