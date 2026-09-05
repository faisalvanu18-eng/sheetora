import type {
  BankTransaction,
  ColumnRole,
  PageExtraction,
  ProcessingReport,
  TableColumn,
  VisualRow,
} from '../types'
import { buildColumns, detectHeaderRow, rowToCells } from './tableEngine'
import { makeTransaction, normalizeDate, normalizeAmount, isDateToken, DATE_RE } from './bankParser'

/**
 * Coordinate-based transaction reconstruction.
 *
 * Consumes per-page positioned rows, detects the column layout once (from the
 * first page that has a header), then walks rows assigning cell values by
 * column. Rows that have no date/amount are treated as narration continuations
 * of the current transaction (multi-line + cross-page). Repeated headers and
 * footers are removed. Balance is validated against the running total.
 */

export interface EngineOptions {
  sourceFile: string
}

interface EngineState {
  columns: TableColumn[] | null
  headerSignature: string
  current: (Partial<BankTransaction> & { narrationParts: string[]; pendingAmount?: string }) | null
  transactions: BankTransaction[]
  prevBalance: number | null
  sourceFile: string
}

export function createEngine(opts: EngineOptions): EngineState {
  return {
    columns: null,
    headerSignature: '',
    current: null,
    transactions: [],
    prevBalance: null,
    sourceFile: opts.sourceFile,
  }
}

// A row is "noise" (repeated header/footer/bank info) if it matches these.
const NOISE_RE =
  /^(statement|account\s*(no|number|holder|name)|customer|branch|ifsc|micr|page\s*\d+|continued|generated|opening\s*balance|closing\s*balance|b\/?f|c\/?f|brought\s*forward|carried\s*forward|www\.|https?:|total\b)/i

function isNoiseRow(cells: string[], joined: string): boolean {
  if (NOISE_RE.test(joined.trim())) return true
  // A row that repeats the header keywords is a repeated header.
  const headerish = /(date).*(narration|description|particular).*(debit|credit|withdrawal|deposit|balance|amount)/i
  if (headerish.test(joined)) return true
  void cells
  return false
}

function cellByRole(cells: string[], columns: TableColumn[], role: ColumnRole): string {
  const idx = columns.findIndex((c) => c.role === role)
  return idx >= 0 ? cells[idx] : ''
}

/** Extract the money-shaped value from a cell (strict: needs a decimal or is empty). */
function moneyFromCell(cell: string): string {
  const m = cell.match(/\d{1,3}(?:[, ]\d{2,3})*\.\d{2}|\d+\.\d{2}/)
  return m ? normalizeAmount(m[0]) : ''
}

/** A cell that is a bare integer/grouped number without decimals (some banks). */
function looseMoneyFromCell(cell: string): string {
  const strict = moneyFromCell(cell)
  if (strict) return strict
  const m = cell.match(/\b\d{1,3}(?:,\d{2,3})+\b|\b\d{3,}\b/)
  return m ? m[0].replace(/,/g, '') : ''
}

function flush(state: EngineState) {
  const c = state.current
  if (!c) return
  const narration = c.narrationParts.join(' ').replace(/\s{2,}/g, ' ').trim()
  if (!c.date && !c.debit && !c.credit && !narration) {
    state.current = null
    return
  }
  const tx = makeTransaction({
    date: c.date || '',
    valueDate: c.valueDate || '',
    narration,
    referenceNo: c.referenceNo || '',
    chequeNo: c.chequeNo || '',
    utr: c.utr || '',
    debit: c.debit || '',
    credit: c.credit || '',
    balance: c.balance || '',
    type: c.type || '',
    sourceFile: state.sourceFile,
    sourcePage: c.sourcePage || 0,
  })
  // Hold an undirected amount so the reconcile pass can assign it from balance.
  if (!tx.debit && !tx.credit && c.pendingAmount) {
    pendingAmounts.set(tx.id, c.pendingAmount)
  }
  enrichRefs(tx)
  state.transactions.push(tx)
  state.current = null
}

/** Amounts captured without a known direction, resolved during reconcile. */
const pendingAmounts = new Map<string, string>()

function enrichRefs(tx: BankTransaction) {
  const n = tx.narration
  if (!tx.utr) tx.utr = (n.match(/\b(?:UTR|RRN)\s*[:\-]?\s*([A-Za-z0-9]{8,})/i)?.[1] ?? '').trim()
  if (!tx.referenceNo)
    tx.referenceNo = (n.match(/\b(?:ref(?:erence)?|txn\s*id|transaction\s*id)\s*[:#\-]?\s*([A-Za-z0-9]{4,})/i)?.[1] ?? '').trim()
  if (!tx.chequeNo)
    tx.chequeNo = (n.match(/\b(?:chq|cheque)\s*(?:no\.?)?\s*[:#\-]?\s*(\d{4,})/i)?.[1] ?? '').trim()
}

/**
 * Reconciliation pass over ALL transactions in statement order.
 *
 * This is the accuracy core. Using the running balance column, we compute the
 * signed delta between consecutive balances. That delta deterministically tells
 * us the direction (and even the amount), so we can:
 *   - resolve unknown debit/credit direction,
 *   - move a mis-placed amount into the correct column,
 *   - recover an amount the layout split onto another line,
 *   - only flag rows that genuinely cannot be reconciled.
 */
function reconcile(txns: BankTransaction[]) {
  // Seed prevBalance from the first row that has a numeric balance.
  let prevBalance: number | null = null

  for (const tx of txns) {
    const bal = tx.balance ? Number(tx.balance) : null
    let dr = tx.debit ? Number(tx.debit) : 0
    let cr = tx.credit ? Number(tx.credit) : 0
    const pending = pendingAmounts.get(tx.id)
    const amt = dr || cr || (pending ? Number(pending) : 0)

    if (bal != null && prevBalance != null) {
      const delta = round2(bal - prevBalance)
      if (amt > 0 && Math.abs(Math.abs(delta) - amt) <= 1) {
        // Amount matches the balance move — set direction from the sign.
        if (delta < 0) {
          tx.debit = amt.toFixed(2); tx.credit = ''; tx.type = 'Debit'; dr = amt; cr = 0
        } else if (delta > 0) {
          tx.credit = amt.toFixed(2); tx.debit = ''; tx.type = 'Credit'; cr = amt; dr = 0
        }
      } else if (amt === 0 && Math.abs(delta) >= 0.01) {
        // No amount captured but balance moved — recover it from the delta.
        const recovered = Math.abs(delta)
        if (delta < 0) { tx.debit = recovered.toFixed(2); tx.type = 'Debit'; dr = recovered }
        else { tx.credit = recovered.toFixed(2); tx.type = 'Credit'; cr = recovered }
      } else if (amt > 0 && Math.abs(Math.abs(delta) - amt) > 1) {
        // Amount present but does not match the balance move — genuinely suspect.
        if (pending && !dr && !cr) { tx.debit = pending; dr = amt }
        tx.balanceMismatch = true
      }
    } else if (pending && !dr && !cr) {
      // No balance to check against — keep the amount so it isn't lost, but flag
      // the direction for the user to confirm.
      tx.debit = pending
      dr = amt
    }

    // Conservative flagging.
    tx.needsReview = []
    if (!tx.date || !DATE_RE.test(tx.date)) tx.needsReview.push('Date')
    if (!tx.debit && !tx.credit) tx.needsReview.push('Amount')
    if (!tx.type && (tx.debit || tx.credit)) tx.needsReview.push('Debit/Credit direction')
    if (!tx.narration) tx.needsReview.push('Narration')
    if (tx.balanceMismatch) tx.needsReview.push('Balance')
    tx.needsReview = Array.from(new Set(tx.needsReview))

    if (bal != null) prevBalance = bal
  }
  pendingAmounts.clear()
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Feed one page's extraction into the engine. */
export function feedPage(state: EngineState, page: PageExtraction) {
  const rows = page.rows

  // Detect columns from the first header we see; reuse across pages.
  if (!state.columns) {
    const hIdx = detectHeaderRow(rows)
    if (hIdx >= 0) {
      state.columns = buildColumns(rows[hIdx])
      state.headerSignature = rows[hIdx].tokens.map((t) => t.text).join(' ').toLowerCase()
    }
  }

  const columns = state.columns
  const startIdx = 0

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i]
    const joined = row.tokens.map((t) => t.text).join(' ')

    // Skip repeated headers / bank info / footers.
    const cellsForNoise = columns ? rowToCells(row, columns) : [joined]
    if (isNoiseRow(cellsForNoise, joined)) continue

    if (columns) {
      handleRowWithColumns(state, row, columns, joined, page.page)
    } else {
      // No detected columns (unusual) — fall back to date-led grouping.
      handleRowNoColumns(state, joined, page.page)
    }
  }
}

function handleRowWithColumns(
  state: EngineState,
  row: VisualRow,
  columns: TableColumn[],
  joined: string,
  pageNum: number,
) {
  const cells = rowToCells(row, columns)

  const dateCell = cellByRole(cells, columns, 'date')
  const dateMatch = dateCell.match(DATE_RE) || (isDateToken(joined) ? joined.match(DATE_RE) : null)

  const debitCell = cellByRole(cells, columns, 'debit') || cellByRole(cells, columns, 'withdrawal')
  const creditCell = cellByRole(cells, columns, 'credit') || cellByRole(cells, columns, 'deposit')
  const amountCell = cellByRole(cells, columns, 'amount')
  const drcrCell = cellByRole(cells, columns, 'drcr')
  const balanceCell = cellByRole(cells, columns, 'balance')
  const narrCell = cellByRole(cells, columns, 'narration')
  const valueDateCell = cellByRole(cells, columns, 'valueDate')
  const refCell = cellByRole(cells, columns, 'ref')
  const chqCell = cellByRole(cells, columns, 'cheque')

  const debit = moneyFromCell(debitCell)
  const credit = moneyFromCell(creditCell)
  const balance = looseMoneyFromCell(balanceCell)
  const amount = moneyFromCell(amountCell)

  const startsNewTxn = !!dateMatch && (!!debit || !!credit || !!amount || !!narrCell)

  if (startsNewTxn) {
    flush(state)
    state.current = {
      narrationParts: [],
      sourcePage: pageNum,
    }
    const c = state.current
    c.date = normalizeDate(dateMatch![0])
    if (valueDateCell) {
      const vm = valueDateCell.match(DATE_RE)
      if (vm) c.valueDate = normalizeDate(vm[0])
    }
    if (narrCell) c.narrationParts.push(narrCell)
    if (refCell) c.referenceNo = refCell.replace(/\s/g, '')
    if (chqCell && /\d/.test(chqCell)) c.chequeNo = (chqCell.match(/\d{3,}/) || [''])[0]

    // Amount + Dr/Cr layout
    if (amount && drcrCell) {
      if (/^d/i.test(drcrCell.trim()) || /\bDR\b/i.test(drcrCell)) {
        c.debit = amount
        c.type = 'Debit'
      } else if (/^c/i.test(drcrCell.trim()) || /\bCR\b/i.test(drcrCell)) {
        c.credit = amount
        c.type = 'Credit'
      } else {
        // Amount present, Dr/Cr unreadable — hold it for balance reconciliation.
        c.pendingAmount = amount
      }
    } else if (debit || credit) {
      if (debit) {
        c.debit = debit
        c.type = 'Debit'
      }
      if (credit) {
        c.credit = credit
        c.type = 'Credit'
      }
    } else if (amount) {
      // Single Amount column, no direction column — reconcile decides later.
      c.pendingAmount = amount
    }
    if (balance) c.balance = balance
  } else if (state.current) {
    // Continuation row: append narration; capture a late amount/balance if the
    // amount column was on a wrapped line.
    if (narrCell) state.current.narrationParts.push(narrCell)
    else if (joined.trim() && !dateMatch) state.current.narrationParts.push(joined.trim())

    if (!state.current.debit && debit) {
      state.current.debit = debit
      state.current.type = 'Debit'
    }
    if (!state.current.credit && credit) {
      state.current.credit = credit
      state.current.type = 'Credit'
    }
    if (!state.current.balance && balance) state.current.balance = balance
  }
  // If a row has no date and no current txn, it is pre-table noise — ignore.
}

function handleRowNoColumns(state: EngineState, joined: string, pageNum: number) {
  const dateMatch = joined.match(DATE_RE)
  if (dateMatch && isDateToken(joined)) {
    flush(state)
    state.current = { narrationParts: [], sourcePage: pageNum, date: normalizeDate(dateMatch[0]) }
    const rest = joined.slice((dateMatch.index ?? 0) + dateMatch[0].length).trim()
    if (rest) state.current.narrationParts.push(rest)
  } else if (state.current) {
    state.current.narrationParts.push(joined.trim())
  }
}

/** Finish and return the reconstructed transactions. */
export function finishEngine(state: EngineState): BankTransaction[] {
  flush(state)
  reconcile(state.transactions)
  markDuplicates(state.transactions)
  return state.transactions
}

function markDuplicates(txns: BankTransaction[]) {
  const seen = new Map<string, number>()
  txns.forEach((t, idx) => {
    const key = [t.date, t.debit, t.credit, t.balance, t.narration.slice(0, 50)].join('|')
    if (t.narration || t.debit || t.credit) {
      if (seen.has(key)) {
        t.possibleDuplicate = true
        txns[seen.get(key)!].possibleDuplicate = true
      } else {
        seen.set(key, idx)
      }
    }
  })
}

/** Build a processing report from the final transactions + page stats. */
export function buildReport(
  transactions: BankTransaction[],
  totalPages: number,
  pagesProcessed: number,
  failedPages: number[],
  pagesWithWarnings: number,
): ProcessingReport {
  const needsReview = transactions.filter((t) => t.needsReview.length).length
  return {
    totalPages,
    pagesProcessed,
    pagesWithWarnings,
    failedPages,
    totalTransactions: transactions.length,
    verified: transactions.length - needsReview,
    needsReview,
    possibleDuplicates: transactions.filter((t) => t.possibleDuplicate).length,
    narrationsPreserved: transactions.filter((t) => t.narration).length,
  }
}
