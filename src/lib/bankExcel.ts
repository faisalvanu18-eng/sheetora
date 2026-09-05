import * as XLSX from 'xlsx'
import type { BankExcelFormat, BankTransaction, StatementResult } from '../types'
import { parseAmount } from './utils'

type Cell = { v: string | number; t?: 's' | 'n'; z?: string }
const CURRENCY_FMT = '#,##0.00'

function money(v: string): Cell {
  const n = parseAmount(v)
  return n == null ? { v: '', t: 's' } : { v: n, t: 'n', z: CURRENCY_FMT }
}
/** Reference-like values must stay TEXT so leading zeros are preserved. */
function textCell(v: string): Cell {
  return { v: v ?? '', t: 's' }
}

export const BANK_CUSTOM_COLUMNS = [
  'Date',
  'Value Date',
  'Transaction Type',
  'Narration',
  'Reference Number',
  'UTR',
  'Cheque Number',
  'Debit',
  'Credit',
  'Balance',
  'Source Page',
  'Source File',
  'Review Status',
] as const

function reviewStatus(t: BankTransaction): string {
  const parts: string[] = []
  if (t.needsReview.length) parts.push('Needs Review: ' + t.needsReview.join(', '))
  if (t.possibleDuplicate) parts.push('Possible Duplicate')
  if (t.balanceMismatch && !t.needsReview.includes('Balance')) parts.push('Balance mismatch')
  return parts.length ? parts.join('; ') : 'Verified'
}

function cellFor(t: BankTransaction, column: string): Cell {
  switch (column) {
    case 'Date': return textCell(t.date)
    case 'Value Date': return textCell(t.valueDate)
    case 'Transaction Type': return textCell(t.type)
    case 'Narration': return textCell(t.narration)
    case 'Reference Number': return textCell(t.referenceNo)
    case 'UTR': return textCell(t.utr)
    case 'Cheque Number': return textCell(t.chequeNo)
    case 'Debit': return money(t.debit)
    case 'Credit': return money(t.credit)
    case 'Balance': return money(t.balance)
    case 'Source Page': return t.sourcePage ? { v: t.sourcePage, t: 'n' } : { v: '', t: 's' }
    case 'Source File': return textCell(t.sourceFile)
    case 'Review Status': return textCell(reviewStatus(t))
    default: return textCell('')
  }
}

function columnsFor(format: BankExcelFormat, custom: string[]): string[] {
  if (format === 'custom') return custom.length ? custom : [...BANK_CUSTOM_COLUMNS]
  if (format === 'accounting') {
    return ['Date', 'Narration', 'Reference Number', 'Debit', 'Credit', 'Balance', 'Source Page', 'Review Status']
  }
  return [...BANK_CUSTOM_COLUMNS]
}

const WIDTHS: Record<string, number> = {
  Date: 12,
  'Value Date': 12,
  'Transaction Type': 10,
  Narration: 60,
  'Reference Number': 18,
  UTR: 18,
  'Cheque Number': 14,
  Debit: 14,
  Credit: 14,
  Balance: 16,
  'Source Page': 10,
  'Source File': 20,
  'Review Status': 26,
}

/** Build a styled worksheet with a header row, filters and formatting. */
function buildTransactionSheet(columns: string[], all: BankTransaction[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {}
  const narrIdx = columns.indexOf('Narration')

  // Header
  columns.forEach((col, c) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c })
    ws[addr] = {
      v: col,
      t: 's',
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2447C9' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      },
    }
  })

  // Data rows
  all.forEach((t, i) => {
    const r = i + 1
    columns.forEach((col, c) => {
      const cell = cellFor(t, col)
      const addr = XLSX.utils.encode_cell({ r, c })
      const styled: Record<string, unknown> = { v: cell.v, t: cell.t ?? 's' }
      if (cell.z) styled.z = cell.z
      if (c === narrIdx) styled.s = { alignment: { wrapText: true, vertical: 'top' } }
      ws[addr] = styled as unknown as XLSX.CellObject
    })
  })

  const range = { s: { r: 0, c: 0 }, e: { r: all.length, c: columns.length - 1 } }
  ws['!ref'] = XLSX.utils.encode_range(range)
  ws['!cols'] = columns.map((col) => ({ wch: WIDTHS[col] ?? 16 }))
  ws['!rows'] = [{ hpt: 22 }]
  // Freeze header row + enable autofilter.
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }
  ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) }
  return ws
}

function buildSummarySheet(statements: StatementResult[], all: BankTransaction[]): XLSX.WorkSheet {
  let totalDebit = 0
  let totalCredit = 0
  for (const t of all) {
    totalDebit += parseAmount(t.debit) ?? 0
    totalCredit += parseAmount(t.credit) ?? 0
  }
  const files = statements.map((s) => s.fileName).join(', ')
  const periods = statements
    .map((s) => (s.periodStart && s.periodEnd ? `${s.periodStart} – ${s.periodEnd}` : ''))
    .filter(Boolean)
  const pagesProcessed = statements.reduce((n, s) => n + (s.totalPages - s.failedPages.length), 0)
  const totalPages = statements.reduce((n, s) => n + s.totalPages, 0)
  const opening = statements.find((s) => s.openingBalance)?.openingBalance
  const closing = [...statements].reverse().find((s) => s.closingBalance)?.closingBalance
  const review = all.filter((t) => t.needsReview.length).length
  const dupes = all.filter((t) => t.possibleDuplicate).length

  const rows: (string | number)[][] = [
    ['Statement Summary', ''],
    ['Statement File', files],
    ['Statement Period', periods.length ? periods.join(', ') : 'Not detected'],
    ['Pages Processed', `${pagesProcessed} / ${totalPages}`],
    ['Total Transactions', all.length],
    ['Total Debit', totalDebit],
    ['Total Credit', totalCredit],
    ['Opening Balance', opening ? (parseAmount(opening) ?? 'Not detected') : 'Not detected'],
    ['Closing Balance', closing ? (parseAmount(closing) ?? 'Not detected') : 'Not detected'],
    ['Transactions Needing Review', review],
    ['Possible Duplicates', dupes],
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 30 }, { wch: 46 }]
  // Bold the title + labels.
  rows.forEach((_, r) => {
    const addr = XLSX.utils.encode_cell({ r, c: 0 })
    if (ws[addr]) (ws[addr] as XLSX.CellObject).s = { font: { bold: true } }
  })
  return ws
}

export interface BankExportOptions {
  format: BankExcelFormat
  customColumns?: string[]
  fileName?: string
  asCsv?: boolean
}

export interface IntegrityResult {
  ok: boolean
  issues: string[]
  exportedRows: number
  expectedRows: number
}

/** Verify the workbook faithfully represents the transactions before download. */
export function verifyIntegrity(
  ws: XLSX.WorkSheet,
  columns: string[],
  all: BankTransaction[],
): IntegrityResult {
  const issues: string[] = []
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  const exportedRows = range.e.r // minus header

  if (exportedRows !== all.length) {
    issues.push(`Row count mismatch: ${exportedRows} exported vs ${all.length} extracted`)
  }

  const narrIdx = columns.indexOf('Narration')
  const refIdx = columns.indexOf('Reference Number')
  all.forEach((t, i) => {
    const r = i + 1
    if (narrIdx >= 0 && t.narration) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: narrIdx })] as XLSX.CellObject | undefined
      if (!cell || String(cell.v) !== t.narration) issues.push(`Narration altered on row ${r}`)
    }
    if (refIdx >= 0 && t.referenceNo) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: refIdx })] as XLSX.CellObject | undefined
      if (cell && cell.t !== 's') issues.push(`Reference on row ${r} not stored as text`)
    }
  })

  return { ok: issues.length === 0, issues: issues.slice(0, 20), exportedRows, expectedRows: all.length }
}

/**
 * Generate and download a professional bank-statement workbook (or CSV).
 * Returns the file name and an integrity report.
 */
export function exportStatements(
  statements: StatementResult[],
  opts: BankExportOptions,
): { fileName: string; integrity: IntegrityResult } {
  const all = statements.flatMap((s) => s.transactions)
  const columns = columnsFor(opts.format, opts.customColumns ?? [])

  const ws = buildTransactionSheet(columns, all)
  const integrity = verifyIntegrity(ws, columns, all)

  if (opts.asCsv) {
    const csv = XLSX.utils.sheet_to_csv(ws)
    const name = opts.fileName || 'Sheetora_Bank_Statement.csv'
    downloadBlob(csv, name, 'text/csv;charset=utf-8;')
    return { fileName: name, integrity }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
  XLSX.utils.book_append_sheet(wb, buildSummarySheet(statements, all), 'Statement Summary')

  const name = opts.fileName || 'Sheetora_Bank_Statement.xlsx'
  XLSX.writeFile(wb, name, { cellStyles: true })
  return { fileName: name, integrity }
}

function downloadBlob(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
