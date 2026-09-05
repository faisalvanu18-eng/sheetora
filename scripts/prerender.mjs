// Post-build prerender: writes a static HTML file per route with the correct
// per-page <title>, meta description, canonical URL and Open Graph/Twitter tags
// baked in. The React SPA still hydrates and manages the head at runtime; this
// only guarantees that crawlers and social scrapers that don't execute JS see
// accurate, unique metadata for every URL.
//
// Zero runtime dependencies — pure Node string rewriting over dist/index.html.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const SITE_URL = 'https://sheetora.com'
const OG_IMAGE = `${SITE_URL}/og-image.png`

/** route path -> { title, description }. Keep in sync with each page's <Seo>. */
const ROUTES = {
  '/': {
    title: 'Bank Statement to Excel Converter – Convert PDF to Excel | Sheetora',
    description:
      'Convert bank statement PDFs and images into structured Excel spreadsheets. Extract transactions, dates, narrations, debit, credit and balance directly in your browser.',
  },
  '/bank-statement-to-excel': {
    title: 'Bank Statement to Excel Converter – Convert PDF to Excel | Sheetora',
    description:
      'Convert bank statement PDFs and images into structured Excel spreadsheets. Extract transactions, dates, narrations, debit, credit and balance directly in your browser.',
  },
  '/pdf-bank-statement-to-excel': {
    title: 'PDF Bank Statement to Excel – Convert Statements in Your Browser | Sheetora',
    description:
      'Convert PDF bank statements into structured Excel. Text-based PDFs are read directly and scanned PDFs use OCR, all processed page-by-page in your browser.',
  },
  '/bank-statement-pdf-to-excel': {
    title: 'Bank Statement PDF to Excel Converter – Extract Transactions | Sheetora',
    description:
      'Turn a bank statement PDF into an Excel spreadsheet of transactions with dates, narrations, debit, credit and balance. Private, browser-based, no signup.',
  },
  '/convert-bank-statement-to-excel': {
    title: 'Convert Bank Statement to Excel – Free Online Converter | Sheetora',
    description:
      'Convert bank statements to Excel for free. Extract transactions, dates, narrations, debit, credit and balance from PDF or image statements, right in your browser.',
  },
  '/bank-statement-to-csv': {
    title: 'Bank Statement to CSV Converter – Export Transactions | Sheetora',
    description:
      'Convert bank statements to CSV for import into accounting tools and spreadsheets. Extract transactions from PDF or image statements privately in your browser.',
  },
  '/invoice-to-excel': {
    title: 'Invoice to Excel Converter – Convert Invoices to Excel Online | Sheetora',
    description:
      'Upload a PDF, JPG or PNG invoice and convert it to a clean Excel spreadsheet in your browser. Review, edit and export GST-ready .xlsx files. No signup, no upload.',
  },
  '/gst-invoice-to-excel': {
    title: 'GST Invoice to Excel Converter – Export CGST, SGST & IGST | Sheetora',
    description:
      'Convert GST invoices to Excel with GSTIN, HSN/SAC and CGST/SGST/IGST columns. Build purchase and sales registers in your browser — no signup, no upload.',
  },
  '/pdf-invoice-to-excel': {
    title: 'PDF Invoice to Excel Converter – Convert PDF Bills to XLSX | Sheetora',
    description:
      'Convert PDF invoices to Excel in your browser. Digital PDFs are parsed instantly and scanned PDFs are read with OCR. No signup, no backend, no file upload.',
  },
  '/bill-to-excel': {
    title: 'Bill to Excel Converter – Turn Bills into Spreadsheets | Sheetora',
    description:
      'Convert bills and vendor statements into Excel spreadsheets in your browser. Extract dates, amounts and line items, review them, and export .xlsx. No signup required.',
  },
  '/receipt-to-excel': {
    title: 'Receipt to Excel Converter – Digitise Receipts to XLSX | Sheetora',
    description:
      'Convert receipts into Excel for expense tracking. Photograph or upload receipts, extract totals and dates, review and export .xlsx — all privately in your browser.',
  },
  '/how-it-works': {
    title: 'How It Works – Bank Statement to Excel Conversion Explained | Sheetora',
    description:
      'Learn how Sheetora converts bank statements to Excel entirely in your browser: upload, analyze page-by-page with PDF.js and OCR, review transactions, then export .xlsx or CSV.',
  },
  '/faq': {
    title: 'FAQ – Frequently Asked Questions | Sheetora',
    description:
      'Answers to common questions about Sheetora: is it free, are invoices uploaded, does it support PDF and GST, can I edit data, and does it work on mobile?',
  },
  '/privacy': {
    title: 'Privacy Policy – How Sheetora Handles Your Bank Statements | Sheetora',
    description:
      'Sheetora processes bank statements and invoices entirely in your browser. No backend, no storage, no upload. Read exactly how your files and data are handled.',
  },
  '/terms': {
    title: 'Terms of Use | Sheetora',
    description:
      'The terms of use for Sheetora, a free browser-based invoice to Excel converter. Review accuracy, acceptable use and liability terms.',
  },
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Replace the content of a meta tag matched by attr=value, or leave as-is. */
function setMeta(html, selectorAttr, selectorVal, content) {
  const c = escapeHtml(content)
  const re = new RegExp(
    `(<meta\\s+[^>]*${selectorAttr}=["']${selectorVal}["'][^>]*content=["'])[^"']*(["'])`,
    'i',
  )
  if (re.test(html)) return html.replace(re, `$1${c}$2`)
  // content attribute might come before the selector attribute
  const re2 = new RegExp(
    `(<meta\\s+[^>]*content=["'])[^"']*(["'][^>]*${selectorAttr}=["']${selectorVal}["'])`,
    'i',
  )
  return html.replace(re2, `$1${c}$2`)
}

function setTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`)
}

function setCanonical(html, url) {
  return html.replace(
    /(<link\s+rel=["']canonical["']\s+href=["'])[^"']*(["'])/i,
    `$1${url}$2`,
  )
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8')

let count = 0
for (const [route, meta] of Object.entries(ROUTES)) {
  const url = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`
  let html = template
  html = setTitle(html, meta.title)
  html = setCanonical(html, url)
  html = setMeta(html, 'name', 'description', meta.description)
  html = setMeta(html, 'property', 'og:title', meta.title)
  html = setMeta(html, 'property', 'og:description', meta.description)
  html = setMeta(html, 'property', 'og:url', url)
  html = setMeta(html, 'property', 'og:image', OG_IMAGE)
  html = setMeta(html, 'name', 'twitter:title', meta.title)
  html = setMeta(html, 'name', 'twitter:description', meta.description)
  html = setMeta(html, 'name', 'twitter:image', OG_IMAGE)

  if (route === '/') {
    writeFileSync(join(DIST, 'index.html'), html)
  } else {
    const dir = join(DIST, route.replace(/^\//, ''))
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), html)
  }
  count++
}

console.log(`Prerendered ${count} routes into dist/`)
