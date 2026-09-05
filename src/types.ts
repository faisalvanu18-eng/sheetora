// Core domain types for Sheetora invoice extraction.

export interface InvoiceItem {
  id: string
  description: string
  hsnSac: string
  quantity: string
  unit: string
  rate: string
  discount: string
  taxableAmount: string
  gstRate: string
  cgst: string
  sgst: string
  igst: string
  cess: string
  total: string
}

export interface InvoiceData {
  id: string
  fileName: string

  // Invoice
  invoiceNumber: string
  invoiceDate: string
  dueDate: string

  // Supplier
  supplierName: string
  supplierAddress: string
  supplierGstin: string
  supplierPhone: string
  supplierEmail: string

  // Customer
  customerName: string
  customerAddress: string
  customerGstin: string

  // Items
  items: InvoiceItem[]

  // Totals
  subtotal: string
  totalTax: string
  roundOff: string
  grandTotal: string

  // Raw OCR text (for debugging / re-parsing)
  rawText: string

  // Warnings surfaced to the user in the Review step
  warnings: string[]
}

export type ProcessingStageId =
  | 'reading'
  | 'detecting'
  | 'invoice'
  | 'gst'
  | 'items'
  | 'spreadsheet'

export interface ProcessingStage {
  id: ProcessingStageId
  label: string
}

export interface FileProgress {
  fileName: string
  stage: ProcessingStageId
  /** 0..1 overall progress for this file */
  progress: number
}

export type ExcelFormat =
  | 'basic'
  | 'gst-purchase'
  | 'gst-sales'
  | 'accounting'
  | 'custom'

export type ConverterStep = 'upload' | 'processing' | 'review' | 'success'

// ---- Bank statement domain --------------------------------------------------

export interface BankTransaction {
  id: string
  /** Primary transaction date, normalized display string. */
  date: string
  /** Value date, when the statement provides one separately. */
  valueDate: string
  /** Full, untruncated narration / description. */
  narration: string
  referenceNo: string
  chequeNo: string
  utr: string
  transactionId: string
  /** Numeric strings (may be empty). */
  debit: string
  credit: string
  balance: string
  /** 'Debit' | 'Credit' | '' */
  type: '' | 'Debit' | 'Credit'
  /** Which uploaded file this row came from. */
  sourceFile: string
  /** Which page number this transaction started on. */
  sourcePage: number
  /** Fields that could not be confidently detected. */
  needsReview: string[]
  /** Set when this row looks like a duplicate of another. */
  possibleDuplicate: boolean
  /** Set when the running-balance check did not reconcile. */
  balanceMismatch: boolean
}

export interface StatementResult {
  fileName: string
  transactions: BankTransaction[]
  /** Detected statement period, if any. */
  periodStart: string
  periodEnd: string
  openingBalance: string
  closingBalance: string
  /** Page numbers that failed to read. */
  failedPages: number[]
  totalPages: number
  /** Raw text per page (kept short; used for the "view text" panel). */
  rawText: string
}

export type BankProcessingStageId =
  | 'reading'
  | 'structure'
  | 'transactions'
  | 'narrations'
  | 'validating'
  | 'excel'

export interface BankPageProgress {
  fileName: string
  fileIndex: number
  fileCount: number
  page: number
  totalPages: number
  stage: BankProcessingStageId
  transactionsFound: number
  /** 0..1 overall for the current file */
  progress: number
}

export type BankExcelFormat = 'standard' | 'accounting' | 'custom'

export type TransactionFilter = 'all' | 'verified' | 'debit' | 'credit' | 'review' | 'duplicate'

// ---- Coordinate-based extraction engine -------------------------------------

/** A single positioned text token from a PDF page (or OCR word). */
export interface PositionedToken {
  text: string
  x: number // left edge
  y: number // top edge (normalized: 0 at top, increasing downward)
  width: number
  height: number
  /** OCR confidence 0..100 when available; undefined for native PDF text. */
  confidence?: number
}

export type ColumnRole =
  | 'date'
  | 'valueDate'
  | 'narration'
  | 'ref'
  | 'cheque'
  | 'debit'
  | 'credit'
  | 'withdrawal'
  | 'deposit'
  | 'amount'
  | 'drcr'
  | 'balance'
  | 'unknown'

export interface TableColumn {
  role: ColumnRole
  headerText: string
  xStart: number
  xEnd: number
}

/** Reconstructed visual row: tokens grouped by Y then sorted by X. */
export interface VisualRow {
  y: number
  tokens: PositionedToken[]
}

export interface PageExtraction {
  page: number
  /** Rows in reading order (top to bottom). */
  rows: VisualRow[]
  /** True when native text was used; false when OCR was used. */
  native: boolean
  /** Whether the page produced usable content at all. */
  ok: boolean
  /** Average OCR confidence for the page, if OCR was used. */
  avgConfidence?: number
}

export interface ProcessingReport {
  totalPages: number
  pagesProcessed: number
  pagesWithWarnings: number
  failedPages: number[]
  totalTransactions: number
  verified: number
  needsReview: number
  possibleDuplicates: number
  narrationsPreserved: number
}
