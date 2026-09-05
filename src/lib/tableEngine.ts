import type { ColumnRole, PositionedToken, TableColumn, VisualRow } from '../types'

/**
 * Table reconstruction from positioned tokens.
 *
 * The whole accuracy strategy hinges on NOT flattening text to a string.
 * Instead we:
 *   1. group tokens into visual rows by their Y coordinate,
 *   2. find the header row and derive each column's X-range,
 *   3. assign every data token to a column by its horizontal centre,
 *   4. classify each column's role from the header wording.
 *
 * This is what prevents a balance being read as a credit, or an amount landing
 * in the wrong column.
 */

// ---- Row grouping -----------------------------------------------------------

/** Group tokens into rows by Y proximity (tolerant of small baseline shifts). */
export function groupIntoRows(tokens: PositionedToken[]): VisualRow[] {
  if (!tokens.length) return []
  const sorted = [...tokens].sort((a, b) => a.y - b.y || a.x - b.x)
  const medianH = median(sorted.map((t) => t.height)) || 10
  const tol = Math.max(3, medianH * 0.6)

  const rows: VisualRow[] = []
  for (const t of sorted) {
    let row = rows.find((r) => Math.abs(r.y - t.y) <= tol)
    if (!row) {
      row = { y: t.y, tokens: [] }
      rows.push(row)
    }
    row.tokens.push(t)
    // keep the row Y as the average so drift doesn't accumulate
    row.y = (row.y * (row.tokens.length - 1) + t.y) / row.tokens.length
  }
  rows.sort((a, b) => a.y - b.y)
  for (const r of rows) r.tokens.sort((a, b) => a.x - b.x)
  return rows
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// ---- Header detection & column roles ----------------------------------------

const HEADER_KEYWORDS =
  /(date|narration|description|particular|detail|remark|debit|credit|withdrawal|deposit|balance|amount|dr\s*\/?\s*cr|type|chq|cheque|ref|utr|instrument|value)/i

const ROLE_PATTERNS: { role: ColumnRole; re: RegExp }[] = [
  { role: 'valueDate', re: /value\s*date/i },
  { role: 'date', re: /(txn\s*date|transaction\s*date|tran\s*date|posting\s*date|^date$|\bdate\b)/i },
  { role: 'narration', re: /(narration|description|particular|detail|remark|transaction\s*remarks)/i },
  { role: 'cheque', re: /(chq|cheque|instrument)/i },
  { role: 'ref', re: /(ref|utr|transaction\s*id)/i },
  { role: 'withdrawal', re: /withdrawal/i },
  { role: 'deposit', re: /deposit/i },
  { role: 'debit', re: /debit|^dr$/i },
  { role: 'credit', re: /credit|^cr$/i },
  { role: 'drcr', re: /(dr\s*\/?\s*cr|type)/i },
  { role: 'balance', re: /balance/i },
  { role: 'amount', re: /amount/i },
]

function classifyHeader(text: string): ColumnRole {
  for (const { role, re } of ROLE_PATTERNS) {
    if (re.test(text)) return role
  }
  return 'unknown'
}

/**
 * Find the header row: the row with the most header-keyword tokens, scanning
 * only the top portion of the page.
 */
export function detectHeaderRow(rows: VisualRow[]): number {
  let bestIdx = -1
  let bestScore = 0
  const limit = Math.min(rows.length, 40)
  for (let i = 0; i < limit; i++) {
    const joined = rows[i].tokens.map((t) => t.text).join(' ')
    const matches = joined.match(new RegExp(HEADER_KEYWORDS.source, 'gi'))
    const score = matches ? matches.length : 0
    // Require at least a date-ish and an amount/balance-ish keyword.
    const hasDate = /date|particular|narration|description/i.test(joined)
    const hasMoney = /debit|credit|withdrawal|deposit|balance|amount/i.test(joined)
    if (score >= 2 && hasDate && hasMoney && score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  return bestIdx
}

/**
 * Build columns (role + X-range) from the header row. Adjacent header tokens
 * that form one label (e.g. "Value" "Date") are merged.
 */
export function buildColumns(headerRow: VisualRow): TableColumn[] {
  const cells = mergeHeaderCells(headerRow.tokens)
  const columns: TableColumn[] = cells.map((c) => ({
    role: classifyHeader(c.text),
    headerText: c.text,
    xStart: c.xStart,
    xEnd: c.xEnd,
  }))

  // Expand X-ranges to the midpoints between neighbouring columns so every
  // data token falls into exactly one column.
  for (let i = 0; i < columns.length; i++) {
    const prev = columns[i - 1]
    const next = columns[i + 1]
    if (prev) columns[i].xStart = (prev.xEnd + columns[i].xStart) / 2
    else columns[i].xStart = -Infinity
    if (next) columns[i].xEnd = (columns[i].xEnd + next.xStart) / 2
    else columns[i].xEnd = Infinity
  }
  return columns
}

function mergeHeaderCells(tokens: PositionedToken[]) {
  const sorted = [...tokens].sort((a, b) => a.x - b.x)
  const cells: { text: string; xStart: number; xEnd: number }[] = []
  const gapThreshold = 18
  for (const t of sorted) {
    const last = cells[cells.length - 1]
    if (last && t.x - last.xEnd < gapThreshold) {
      last.text += ' ' + t.text
      last.xEnd = t.x + t.width
    } else {
      cells.push({ text: t.text, xStart: t.x, xEnd: t.x + t.width })
    }
  }
  return cells
}

/** Which column does a token belong to (by horizontal centre)? */
export function columnForToken(token: PositionedToken, columns: TableColumn[]): number {
  const cx = token.x + token.width / 2
  for (let i = 0; i < columns.length; i++) {
    if (cx >= columns[i].xStart && cx < columns[i].xEnd) return i
  }
  return -1
}

/** Split a visual row's tokens into per-column text strings. */
export function rowToCells(row: VisualRow, columns: TableColumn[]): string[] {
  const buckets: string[][] = columns.map(() => [])
  for (const t of row.tokens) {
    const idx = columnForToken(t, columns)
    if (idx >= 0) buckets[idx].push(t.text)
  }
  return buckets.map((b) => b.join(' ').replace(/\s{2,}/g, ' ').trim())
}
