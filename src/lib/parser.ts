import type { InvoiceData, InvoiceItem } from '../types'
import { parseAmount, toMoney, uid } from './utils'

/**
 * Deterministic, rule-based invoice parser.
 *
 * This is NOT an AI model — it uses line-aware regular expressions and
 * heuristics over the OCR / PDF text to locate common accounting fields.
 * Results are always shown to the user for review and correction before export.
 */

// ---- Patterns ---------------------------------------------------------------

const GSTIN_RE = /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/g
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/
const PHONE_RE = /(?:\+?\d{1,3}[\s-]?)?(?:\d{5}[\s-]?\d{5}|\d{10})\b/
// Dates: 04/09/2026, 4-9-26, 2026-09-04, 4 Sep 2026, 04-Sep-2026
const DATE_RE =
  /\b(?:\d{1,2}[-/. ](?:\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)[-/. ]\d{2,4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b/i

// ---- Helpers ----------------------------------------------------------------

function firstMatch(text: string, re: RegExp): string {
  const m = text.match(re)
  return m ? m[0].trim() : ''
}

function cleanValue(v: string): string {
  return v
    .replace(/\s{2,}/g, ' ')
    .replace(/[.:;,\-|]+$/, '')
    .trim()
}

/**
 * Find the value that follows a label. Looks first on the SAME line after the
 * label; if nothing meaningful is there, falls back to the NEXT non-empty line.
 */
function labeledValue(
  lines: string[],
  labelRe: RegExp,
  opts: { valueRe?: RegExp; maxLen?: number } = {},
): string {
  const { valueRe, maxLen = 60 } = opts
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(labelRe)
    if (!m) continue

    // Text remaining on the same line after the label match.
    const after = line.slice((m.index ?? 0) + m[0].length).replace(/^[\s:#\-|]+/, '')
    const candidates = [after]

    // Next non-empty line as a fallback (labels often sit above their value).
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      if (lines[j].trim()) {
        candidates.push(lines[j].trim())
        break
      }
    }

    for (const cand of candidates) {
      if (!cand) continue
      if (valueRe) {
        const vm = cand.match(valueRe)
        if (vm) return cleanValue(vm[0])
      } else {
        const cleaned = cleanValue(cand).slice(0, maxLen)
        // Reject values that are just another label or empty.
        if (cleaned && !/^[:#\-|]+$/.test(cleaned)) return cleaned
      }
    }
  }
  return ''
}

/** Find an amount that follows a label, taking the LAST number on that line. */
function labeledAmount(lines: string[], labelRe: RegExp): string {
  for (const line of lines) {
    const m = line.match(labelRe)
    if (!m) continue
    const after = line.slice((m.index ?? 0) + m[0].length)
    const nums = after.match(/[0-9][0-9,]*(?:\.[0-9]{1,2})?/g)
    if (nums && nums.length) {
      return nums[nums.length - 1].replace(/,/g, '')
    }
  }
  return ''
}

function extractGstins(text: string): string[] {
  const found = text.toUpperCase().match(GSTIN_RE)
  return found ? Array.from(new Set(found)) : []
}

// ---- Item table parsing -----------------------------------------------------

const ITEM_HEADER_RE =
  /(description|particular|item|product|goods|service)/i
const TOTAL_LINE_RE =
  /(sub\s*-?\s*total|grand\s*total|total\s*(?:amount|payable|tax|qty)?|taxable\s*value|round\s*off|amount\s*in\s*words|balance\s*due|cgst|sgst|igst|discount|shipping|freight|invoice\s*total)/i

/**
 * Parse line items by locating the header row and reading the rows beneath it
 * until a totals section begins. Falls back to a generic numeric-row scan.
 */
function parseItems(lines: string[]): InvoiceItem[] {
  const headerIdx = lines.findIndex(
    (l) => ITEM_HEADER_RE.test(l) && /(qty|quantity|rate|price|amount|total)/i.test(l),
  )
  const hsnColumnKnown = headerIdx >= 0 && /\b(hsn|sac)\b/i.test(lines[headerIdx])

  const start = headerIdx >= 0 ? headerIdx + 1 : 0
  const items: InvoiceItem[] = []

  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Stop once we hit the totals block (only when a header was found).
    if (headerIdx >= 0 && TOTAL_LINE_RE.test(line) && !ITEM_HEADER_RE.test(line)) {
      break
    }

    const item = parseItemLine(line, hsnColumnKnown)
    if (item) items.push(item)
    if (items.length >= 100) break
  }

  return items
}

function parseItemLine(line: string, hsnColumnKnown: boolean): InvoiceItem | null {
  // Reject totals/summary lines outright (handled separately).
  if (TOTAL_LINE_RE.test(line)) return null

  // Reject "Invoice/Bill No ..." style metadata lines.
  if (/\b(?:invoice|bill|inv|order|ref)\s*(?:no\.?|number|#)/i.test(line)) return null

  // Description = leading text before the numeric columns begin.
  const descMatch = line.match(/^\s*(?:\d+[.)]\s*)?([A-Za-z][A-Za-z0-9 /&.,()\-]*?)(?=\s{2,}|\s+\d|$)/)
  const description = descMatch ? cleanValue(descMatch[1]) : ''
  if (!description || description.length < 2) return null
  if (/^(total|sub|grand|tax|amount|qty|rate|price|hsn|sac|description|item|date|gstin)$/i.test(description)) {
    return null
  }

  // Only look at the part of the line AFTER the description text, so numbers
  // embedded in the description (e.g. "Steel Rods 10mm") are ignored.
  let tail = line.slice((descMatch?.index ?? 0) + (descMatch?.[0].length ?? 0))
  // Remove unit tokens like "10mm", "2kg", "50kg", "2L" — a number glued to
  // letters is a unit/spec, not a value column.
  tail = tail.replace(/\b\d+(?:\.\d+)?\s*(?:mm|cm|m|kg|g|gm|ml|l|ltr|pcs?|nos?|units?|box|pkt)\b/gi, ' ')
  const numbers = tail.match(/(?<![A-Za-z])[0-9][0-9,]*(?:\.[0-9]{1,2})?(?![A-Za-z])/g)
  if (!numbers || numbers.length < 1) return null

  const raw = numbers.map((v) => v.replace(/,/g, ''))

  // HSN/SAC: only when there is a clear HSN column, or the row has enough
  // columns that a leading pure integer code is plausible.
  let hsn = ''
  const firstIsCode = /^\d{4,8}$/.test(raw[0])
  if (firstIsCode && (hsnColumnKnown || raw.length >= 4)) {
    hsn = raw[0]
    raw.shift()
  }

  // Map remaining columns left→right.
  let qty = '', rate = '', taxable = '', total = ''
  const n = raw.length
  if (n === 1) {
    total = raw[0]
  } else if (n === 2) {
    qty = raw[0]
    total = raw[1]
  } else if (n === 3) {
    qty = raw[0]
    rate = raw[1]
    total = raw[2]
  } else {
    qty = raw[0]
    rate = raw[1]
    taxable = raw[2]
    total = raw[n - 1]
  }

  if (!rate && qty && total && Number(qty) > 0) {
    const r = Number(total) / Number(qty)
    if (Number.isFinite(r)) rate = (Math.round(r * 100) / 100).toString()
  }
  if (!taxable && total) taxable = total

  return makeItem({ description, hsnSac: hsn, quantity: qty, rate, taxableAmount: taxable, total })
}

// ---- Factories --------------------------------------------------------------

export function makeItem(partial: Partial<InvoiceItem> = {}): InvoiceItem {
  return {
    id: uid('item'),
    description: '',
    hsnSac: '',
    quantity: '',
    unit: '',
    rate: '',
    discount: '',
    taxableAmount: '',
    gstRate: '',
    cgst: '',
    sgst: '',
    igst: '',
    cess: '',
    total: '',
    ...partial,
  }
}

export function emptyInvoice(fileName: string): InvoiceData {
  return {
    id: uid('inv'),
    fileName,
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    supplierName: '',
    supplierAddress: '',
    supplierGstin: '',
    supplierPhone: '',
    supplierEmail: '',
    customerName: '',
    customerAddress: '',
    customerGstin: '',
    items: [],
    subtotal: '',
    totalTax: '',
    roundOff: '',
    grandTotal: '',
    rawText: '',
    warnings: [],
  }
}

// ---- Main parser ------------------------------------------------------------

export function parseInvoice(rawText: string, fileName: string): InvoiceData {
  const text = rawText.replace(/\r/g, '')
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\t/g, ' ').replace(/ {2,}/g, '  ').trimEnd())
    .filter((l, idx, arr) => l.trim() !== '' || (idx > 0 && arr[idx - 1].trim() !== ''))

  const inv = emptyInvoice(fileName)
  inv.rawText = rawText

  // --- Invoice meta ---
  inv.invoiceNumber = labeledValue(
    lines,
    /\b(?:invoice|bill|inv)\s*(?:no\.?|number|#|num)\b/i,
    { valueRe: /[A-Za-z0-9][A-Za-z0-9/\-]{1,24}/, maxLen: 30 },
  )

  inv.invoiceDate =
    labeledValue(lines, /\b(?:invoice\s*date|date\s*of\s*issue|dated|inv\.?\s*date)\b/i, {
      valueRe: DATE_RE,
    }) ||
    labeledValue(lines, /\bdate\b/i, { valueRe: DATE_RE }) ||
    firstMatch(text, DATE_RE)

  inv.dueDate = labeledValue(lines, /\b(?:due\s*date|payment\s*due|pay\s*by)\b/i, {
    valueRe: DATE_RE,
  })

  // --- GSTINs (first supplier, second customer) ---
  const gstins = extractGstins(text)
  if (gstins[0]) inv.supplierGstin = gstins[0]
  if (gstins[1]) inv.customerGstin = gstins[1]

  // --- Contact ---
  inv.supplierEmail = firstMatch(text, EMAIL_RE)
  inv.supplierPhone =
    labeledValue(lines, /\b(?:phone|mobile|mob|tel|contact|ph)\b/i, { valueRe: PHONE_RE }) ||
    firstMatch(text, PHONE_RE)

  // --- Names ---
  inv.supplierName = labeledValue(
    lines,
    /\b(?:from|sold\s*by|supplier|seller|billed\s*from|vendor)\b/i,
    { maxLen: 50 },
  )
  // If no explicit supplier label, use the first non-empty text line as a guess.
  if (!inv.supplierName) {
    const firstText = lines.find((l) => /[A-Za-z]{3,}/.test(l) && !DATE_RE.test(l))
    if (firstText) inv.supplierName = cleanValue(firstText).slice(0, 50)
  }

  inv.customerName = labeledValue(
    lines,
    /\b(?:bill\s*to|billed\s*to|customer|buyer|ship\s*to|invoice\s*to|party)\b/i,
    { maxLen: 50 },
  )

  // --- Addresses (next line after name label, best-effort) ---
  inv.customerAddress = labeledValue(lines, /\b(?:ship\s*to|billing\s*address)\b/i, { maxLen: 120 })

  // --- Totals ---
  inv.subtotal = labeledAmount(lines, /\b(?:sub\s*-?\s*total|taxable\s*(?:value|amount))\b/i)
  inv.totalTax = labeledAmount(lines, /\b(?:total\s*tax|tax\s*amount|total\s*gst|gst\s*amount)\b/i)
  inv.roundOff = labeledAmount(lines, /\b(?:round\s*(?:ing|\s*off)?)\b/i)
  inv.grandTotal =
    labeledAmount(lines, /\b(?:grand\s*total|amount\s*payable|total\s*payable|net\s*payable|balance\s*due|invoice\s*total)\b/i) ||
    labeledAmount(lines, /\b(?:total\s*amount)\b/i) ||
    labeledAmount(lines, /\btotal\b/i)

  // --- Items ---
  inv.items = parseItems(lines)

  // --- Derive missing totals ---
  if (!inv.subtotal && inv.items.length) {
    const sum = inv.items.reduce((acc, it) => acc + (parseAmount(it.taxableAmount) ?? parseAmount(it.total) ?? 0), 0)
    if (sum > 0) inv.subtotal = toMoney(sum)
  }
  if (!inv.grandTotal && inv.items.length) {
    const sum = inv.items.reduce((acc, it) => acc + (parseAmount(it.total) ?? 0), 0)
    if (sum > 0) inv.grandTotal = toMoney(sum)
  }

  inv.warnings = buildWarnings(inv)
  return inv
}

export function buildWarnings(inv: InvoiceData): string[] {
  const w: string[] = []
  if (!inv.supplierGstin) w.push('GSTIN not detected')
  if (!inv.invoiceNumber) w.push('Invoice number not detected')
  if (!inv.invoiceDate) w.push('Invoice date needs review')
  if (!inv.grandTotal) w.push('Total amount needs review')
  if (inv.items.length === 0) w.push('No line items detected — add them manually')
  else if (inv.items.some((it) => !it.hsnSac)) w.push('HSN/SAC missing on some items')
  return w
}
