import type { BankTransaction } from '../types'
import { uid } from './utils'

/**
 * Flexible bank-statement transaction parser.
 *
 * Design principles (see product spec):
 *  - Never invent data. If a value cannot be confidently detected it is left
 *    empty and added to `needsReview`.
 *  - Preserve the COMPLETE narration; reconstruct narration that wraps across
 *    multiple physical lines into the transaction it belongs to.
 *  - Do not assume a fixed column order. Detect Debit/Credit vs
 *    Withdrawal/Deposit vs single Amount + Dr/Cr from the header and structure.
 */

// ---- Patterns ---------------------------------------------------------------

const MONTHS =
  '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)'

// Matches a date anywhere; capturing the whole match.
export const DATE_RE = new RegExp(
  `\\b(?:` +
    `\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}` + // 01/09/2026 01-09-26
    `|\\d{1,2}[-\\s]${MONTHS}[-\\s]\\d{2,4}` + // 01-Sep-2026 / 01 Sep 2026
    `|${MONTHS}\\s+\\d{1,2},?\\s+\\d{2,4}` + // Sep 01, 2026
    `|\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2}` + // 2026-09-01
    `)\\b`,
  'i',
)
const DATE_AT_START = new RegExp(`^\\s*(${DATE_RE.source})`, 'i')

/** True when a string begins with (or is dominated by) a date token. */
export function isDateToken(s: string): boolean {
  return DATE_AT_START.test(s.trim())
}

// A monetary amount MUST have a 2-decimal part to avoid matching reference
// numbers, cheque numbers, UTRs etc. Supports Indian grouping and space groups.
const AMOUNT_RE = /\d{1,3}(?:[, ]\d{2,3})*\.\d{2}|\d+\.\d{2}/

const REF_RE = /\b(?:ref(?:erence)?|txn|transaction\s*id)\s*(?:no\.?|#|:)?\s*([A-Za-z0-9]{4,})/i
const UTR_RE = /\b(?:UTR|RRN)\s*(?:no\.?|:)?\s*([A-Za-z0-9]{8,})/i
const CHEQUE_RE = /\b(?:chq|cheque|check)\s*(?:no\.?|#|:)?\s*(\d{4,})/i

// ---- Column-layout detection ------------------------------------------------

export interface ColumnLayout {
  kind: 'debit-credit' | 'withdrawal-deposit' | 'amount-drcr' | 'unknown'
  hasBalance: boolean
  hasValueDate: boolean
}

const HEADER_HINT_RE =
  /(date|narration|description|particular|detail|debit|credit|withdrawal|deposit|balance|amount|dr\/?cr|chq|cheque|ref)/i

function detectLayout(lines: string[]): { layout: ColumnLayout; headerIdx: number } {
  let headerIdx = -1
  for (let i = 0; i < Math.min(lines.length, 60); i++) {
    const l = lines[i].toLowerCase()
    const hits = (l.match(HEADER_HINT_RE) ? 1 : 0) + (/(debit|withdrawal|dr)/.test(l) ? 1 : 0) +
      (/(credit|deposit|cr)/.test(l) ? 1 : 0) + (/balance/.test(l) ? 1 : 0) +
      (/(date)/.test(l) ? 1 : 0)
    if (hits >= 3) {
      headerIdx = i
      break
    }
  }

  const header = headerIdx >= 0 ? lines[headerIdx].toLowerCase() : ''
  let kind: ColumnLayout['kind'] = 'unknown'
  if (/withdrawal/.test(header) && /deposit/.test(header)) kind = 'withdrawal-deposit'
  else if (/debit/.test(header) && /credit/.test(header)) kind = 'debit-credit'
  else if (/dr\/?cr|type/.test(header) && /amount/.test(header)) kind = 'amount-drcr'
  else if (/debit/.test(header) || /withdrawal/.test(header)) kind = 'debit-credit'

  return {
    layout: {
      kind,
      hasBalance: /balance/.test(header),
      hasValueDate: /value\s*date/.test(header),
    },
    headerIdx,
  }
}

// ---- Amount helpers ---------------------------------------------------------

export function normalizeAmount(raw: string): string {
  // Strip currency symbols, then remove commas and spaces used as grouping.
  const cleaned = raw.replace(/[₹$]/g, '').replace(/[,\s]/g, '').trim()
  if (!/^\d+\.\d{2}$/.test(cleaned)) return ''
  return cleaned
}

/** Money tokens (strictly with 2 decimals) appearing on a line, in order. */
function moneyTokens(line: string): string[] {
  const tokens = line.match(new RegExp(AMOUNT_RE.source, 'g')) || []
  return tokens.map(normalizeAmount).filter(Boolean)
}

/** Detect a standalone DR/CR marker on a line (not "CR" inside UPI/CR/...). */
function detectDrCr(line: string): '' | 'DR' | 'CR' {
  const m =
    line.match(/(?:^|\s)(DR|CR|DEBIT|CREDIT)\.?\s*$/i) ||
    line.match(/(?:^|\s)(DR|CR)(?=\s|$)/i)
  if (!m) return ''
  return m[1].toUpperCase().startsWith('D') ? 'DR' : 'CR'
}

// ---- Reference extraction ---------------------------------------------------

function extractRefs(text: string) {
  return {
    referenceNo: (text.match(REF_RE)?.[1] ?? '').trim(),
    utr: (text.match(UTR_RE)?.[1] ?? '').trim(),
    chequeNo: (text.match(CHEQUE_RE)?.[1] ?? '').trim(),
  }
}

// ---- Factory ----------------------------------------------------------------

export function makeTransaction(partial: Partial<BankTransaction> = {}): BankTransaction {
  return {
    id: uid('txn'),
    date: '',
    valueDate: '',
    narration: '',
    referenceNo: '',
    chequeNo: '',
    utr: '',
    transactionId: '',
    debit: '',
    credit: '',
    balance: '',
    type: '',
    sourceFile: '',
    sourcePage: 0,
    needsReview: [],
    possibleDuplicate: false,
    balanceMismatch: false,
    ...partial,
  }
}

// ---- Core row parsing -------------------------------------------------------

interface ParseContext {
  layout: ColumnLayout
  sourceFile: string
}

function finalizeRow(
  dateStr: string,
  narrationLines: string[],
  ctx: ParseContext,
): BankTransaction | null {
  const { layout } = ctx

  // Identify the line that carries the numeric columns: the one with the most
  // money tokens (2-decimal amounts). Reference/UTR digits are excluded because
  // moneyTokens only matches values with a decimal part.
  let amtLineIdx = -1
  let bestCount = 0
  const perLineTokens = narrationLines.map((l) => moneyTokens(l))
  perLineTokens.forEach((toks, i) => {
    if (toks.length > bestCount) {
      bestCount = toks.length
      amtLineIdx = i
    }
  })

  let amounts: string[] = amtLineIdx >= 0 ? perLineTokens[amtLineIdx] : []
  let drcr: '' | 'DR' | 'CR' = ''
  for (const l of narrationLines) {
    const d = detectDrCr(l)
    if (d) drcr = d
  }

  // Build the narration from all lines, removing the money tokens and any
  // trailing DR/CR marker so the narration stays clean but COMPLETE.
  const narration = narrationLines
    .map((l) =>
      l
        .replace(new RegExp(AMOUNT_RE.source, 'g'), ' ')
        // Only strip a standalone DR/CR marker at end of line or after spaces,
        // never "CR" that is part of a token like UPI/CR/....
        .replace(/(?:^|\s)(DR|CR|DEBIT|CREDIT)\.?(?=\s|$)/gi, ' '),
    )
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const tx = makeTransaction({ date: dateStr, narration, sourceFile: ctx.sourceFile })

  // Balance is the right-most amount when the layout has a balance column and
  // there is more than one amount on the row.
  if (layout.hasBalance && amounts.length >= 2) {
    tx.balance = amounts[amounts.length - 1]
    amounts = amounts.slice(0, -1)
  } else if (layout.hasBalance && amounts.length === 1) {
    // Only one amount with a balance layout is ambiguous — treat as balance
    // only if there is clearly no transaction value (rare); otherwise value.
    // Keep it as the value and leave balance empty to avoid inventing.
  }

  const valueCols = amounts

  if (layout.kind === 'amount-drcr' || (layout.kind === 'unknown' && drcr)) {
    const amt = valueCols[valueCols.length - 1] ?? ''
    if (drcr === 'DR') {
      tx.debit = amt
      tx.type = 'Debit'
    } else if (drcr === 'CR') {
      tx.credit = amt
      tx.type = 'Credit'
    } else if (amt) {
      tx.needsReview.push('Debit/Credit direction')
    }
  } else if (valueCols.length >= 2) {
    // Two value columns: [debit, credit] or [withdrawal, deposit].
    const [a, b] = valueCols
    if (a && !b) {
      tx.debit = a
      tx.type = 'Debit'
    } else {
      tx.credit = b
      tx.type = 'Credit'
    }
  } else if (valueCols.length === 1) {
    if (drcr === 'DR') {
      tx.debit = valueCols[0]
      tx.type = 'Debit'
    } else if (drcr === 'CR') {
      tx.credit = valueCols[0]
      tx.type = 'Credit'
    } else {
      // A single value column with no direction marker. Common in two-column
      // layouts where the other side is blank: infer from alignment is unsafe,
      // so record the amount but flag the direction for review.
      tx.needsReview.push('Debit/Credit direction')
      // Store provisionally as debit so the amount is not lost; user confirms.
      tx.debit = valueCols[0]
    }
  }

  // References from the full narration.
  const refs = extractRefs(narration)
  tx.referenceNo = refs.referenceNo
  tx.utr = refs.utr
  tx.chequeNo = refs.chequeNo

  // Validation — never invent, only flag.
  if (!tx.date || !DATE_RE.test(tx.date)) tx.needsReview.push('Date')
  if (!tx.debit && !tx.credit) tx.needsReview.push('Amount')
  if (!tx.narration) tx.needsReview.push('Narration')

  tx.needsReview = Array.from(new Set(tx.needsReview))
  return tx
}

/**
 * Parse transactions from combined statement text. Handles multi-line
 * narration: a new transaction begins only when a line STARTS with a date.
 */
export function parseStatementText(text: string, sourceFile: string): BankTransaction[] {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\t/g, ' ').replace(/\u00a0/g, ' ').trimEnd())
    .filter((l) => l.trim() !== '')

  const { layout, headerIdx } = detectLayout(lines)
  const ctx: ParseContext = { layout, sourceFile }

  const transactions: BankTransaction[] = []
  let currentDate = ''
  let currentLines: string[] = []

  const flush = () => {
    if (currentDate || currentLines.length) {
      const tx = finalizeRow(currentDate, currentLines, ctx)
      if (tx && (tx.narration || tx.debit || tx.credit)) transactions.push(tx)
    }
    currentDate = ''
    currentLines = []
  }

  const start = headerIdx >= 0 ? headerIdx + 1 : 0

  for (let i = start; i < lines.length; i++) {
    const line = lines[i]

    // Stop/skip obvious footer/summary lines but do not break (statements may
    // interleave). Skip lines that are clearly totals.
    if (/^\s*(opening|closing|b\/?f|c\/?f|total|statement|page\s*\d|generated on)/i.test(line)) {
      continue
    }

    const dateMatch = line.match(DATE_AT_START)
    if (dateMatch) {
      // New transaction boundary.
      flush()
      currentDate = normalizeDate(dateMatch[1])
      // Remainder of the line after the date is the first narration part.
      const rest = line.slice(dateMatch[0].length).trim()
      if (rest) currentLines.push(rest)
    } else {
      // Continuation line (wrapped narration or amount row).
      if (currentDate || currentLines.length) currentLines.push(line.trim())
    }
  }
  flush()

  markDuplicates(transactions)
  return transactions
}

// ---- Date normalization -----------------------------------------------------

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12',
}

/** Normalize to DD/MM/YYYY where confidently possible; otherwise return as-is. */
export function normalizeDate(raw: string): string {
  const s = raw.trim()

  // 2026-09-01 -> 01/09/2026
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (m) return `${pad(m[3])}/${pad(m[2])}/${expandYear(m[1])}`

  // 01/09/2026, 01-09-26, 01.09.2026
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)
  if (m) return `${pad(m[1])}/${pad(m[2])}/${expandYear(m[3])}`

  // 01-Sep-2026 / 01 Sep 2026
  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{2,4})$/)
  if (m) {
    const mm = MONTH_MAP[m[2].toLowerCase().slice(0, m[2].toLowerCase().startsWith('sept') ? 4 : 3)]
    if (mm) return `${pad(m[1])}/${mm}/${expandYear(m[3])}`
  }

  // Sep 01, 2026
  m = s.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})$/)
  if (m) {
    const mm = MONTH_MAP[m[1].toLowerCase().slice(0, m[1].toLowerCase().startsWith('sept') ? 4 : 3)]
    if (mm) return `${pad(m[2])}/${mm}/${expandYear(m[3])}`
  }

  return s // Keep original if ambiguous — do not silently change.
}

function pad(n: string): string {
  return n.length === 1 ? '0' + n : n
}
function expandYear(y: string): string {
  if (y.length === 4) return y
  const n = Number(y)
  return String(n >= 70 ? 1900 + n : 2000 + n)
}

// ---- Duplicate detection ----------------------------------------------------

function markDuplicates(txns: BankTransaction[]) {
  const seen = new Map<string, number>()
  txns.forEach((t, idx) => {
    const key = [t.date, t.debit, t.credit, t.balance, t.narration.slice(0, 40)].join('|')
    if (seen.has(key)) {
      t.possibleDuplicate = true
      txns[seen.get(key)!].possibleDuplicate = true
    } else {
      seen.set(key, idx)
    }
  })
}

// ---- Statement metadata -----------------------------------------------------

export function detectStatementMeta(text: string, txns: BankTransaction[]) {
  const opening =
    text.match(/opening\s*balance\s*[:\-]?\s*(?:₹|rs\.?)?\s*([\d,]+\.\d{2})/i)?.[1] ?? ''
  const closing =
    text.match(/closing\s*balance\s*[:\-]?\s*(?:₹|rs\.?)?\s*([\d,]+\.\d{2})/i)?.[1] ?? ''

  const dated = txns.filter((t) => t.date).map((t) => t.date)
  return {
    openingBalance: opening ? normalizeAmount(opening) : '',
    closingBalance: closing ? normalizeAmount(closing) : '',
    periodStart: dated[0] ?? '',
    periodEnd: dated[dated.length - 1] ?? '',
  }
}
