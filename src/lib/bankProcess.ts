import type {
  BankProcessingStageId,
  PageExtraction,
  PositionedToken,
  ProcessingReport,
  StatementResult,
} from '../types'
import { openPdfPositioned } from './pdf'
import { ocrWords, type OcrWord } from './ocr'
import { groupIntoRows } from './tableEngine'
import { createEngine, feedPage, finishEngine, buildReport } from './bankEngine'
import { detectStatementMeta } from './bankParser'
import { makeTransaction } from './bankParser'

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

export function isSupportedStatement(file: File): boolean {
  return file.type === 'application/pdf' || IMAGE_TYPES.includes(file.type)
}

export interface BankProgressUpdate {
  fileIndex: number
  fileCount: number
  fileName: string
  page: number
  totalPages: number
  stage: BankProcessingStageId
  transactionsFound: number
  progress: number
}

export interface BankProcessCallbacks {
  onProgress?: (u: BankProgressUpdate) => void
  shouldCancel?: () => boolean
  waitIfPaused?: () => Promise<void>
}

/** Extended statement result carrying the processing report. */
export interface StatementResultWithReport extends StatementResult {
  report: ProcessingReport
}

function yieldToUI() {
  return new Promise<void>((r) => setTimeout(r, 0))
}

/** Convert OCR words to positioned tokens (bbox already top-down). */
function wordsToTokens(words: OcrWord[]): PositionedToken[] {
  return words.map((w) => ({
    text: w.text,
    x: w.x,
    y: w.y,
    width: w.width,
    height: w.height,
    confidence: w.confidence,
  }))
}

export async function processStatement(
  file: File,
  fileIndex: number,
  fileCount: number,
  cb: BankProcessCallbacks = {},
): Promise<StatementResultWithReport> {
  const { onProgress, shouldCancel, waitIfPaused } = cb

  const result: StatementResultWithReport = {
    fileName: file.name,
    transactions: [],
    periodStart: '',
    periodEnd: '',
    openingBalance: '',
    closingBalance: '',
    failedPages: [],
    totalPages: 0,
    rawText: '',
    report: {
      totalPages: 0,
      pagesProcessed: 0,
      pagesWithWarnings: 0,
      failedPages: [],
      totalTransactions: 0,
      verified: 0,
      needsReview: 0,
      possibleDuplicates: 0,
      narrationsPreserved: 0,
    },
  }

  const engine = createEngine({ sourceFile: file.name })
  let rawTextAccum = ''
  let pagesWithWarnings = 0

  const emit = (page: number, totalPages: number, stage: BankProcessingStageId, progress: number) =>
    onProgress?.({
      fileIndex,
      fileCount,
      fileName: file.name,
      page,
      totalPages,
      stage,
      transactionsFound: engine.transactions.length,
      progress,
    })

  // ---- Image statement: single OCR page ----
  if (IMAGE_TYPES.includes(file.type)) {
    result.totalPages = 1
    emit(1, 1, 'reading', 0.05)
    emit(1, 1, 'transactions', 0.3)
    try {
      const { words, avgConfidence } = await ocrWords(file, (f) => emit(1, 1, 'transactions', 0.3 + f * 0.5))
      const tokens = wordsToTokens(words)
      rawTextAccum = tokens.map((t) => t.text).join(' ')
      const pageExtraction: PageExtraction = {
        page: 1,
        rows: groupIntoRows(tokens),
        native: false,
        ok: tokens.length > 0,
        avgConfidence,
      }
      if (!pageExtraction.ok) {
        result.failedPages.push(1)
      } else {
        feedPage(engine, pageExtraction)
        if (avgConfidence && avgConfidence < 70) pagesWithWarnings++
      }
    } catch {
      result.failedPages.push(1)
    }
    finish(engine, result, rawTextAccum, 1, result.failedPages.length ? 0 : 1, pagesWithWarnings)
    emit(1, 1, 'excel', 1)
    return result
  }

  // ---- PDF statement: coordinate-based, page-by-page ----
  const doc = await openPdfPositioned(file)
  result.totalPages = doc.numPages
  emit(0, doc.numPages, 'reading', 0.02)

  let pagesProcessed = 0

  try {
    for (let p = 1; p <= doc.numPages; p++) {
      if (shouldCancel?.()) break
      if (waitIfPaused) await waitIfPaused()

      emit(p, doc.numPages, p <= 1 ? 'structure' : 'transactions', p / doc.numPages)

      const page = await doc.getPage(p).catch(() => null)
      if (!page) {
        result.failedPages.push(p)
        continue
      }

      try {
        let tokens: PositionedToken[] = page.tokens
        let native = true
        let avgConfidence: number | undefined

        // OCR fallback when the native text layer is insufficient.
        if (!page.hasText) {
          const rendered = await page.render()
          if (rendered) {
            const { words, avgConfidence: conf } = await ocrWords(rendered.dataUrl)
            tokens = wordsToTokens(words)
            native = false
            avgConfidence = conf
            if (conf && conf < 70) pagesWithWarnings++
          }
        }

        if (tokens.length === 0) {
          result.failedPages.push(p)
        } else {
          rawTextAccum += tokens.map((t) => t.text).join(' ') + '\n'
          const pageExtraction: PageExtraction = {
            page: p,
            rows: groupIntoRows(tokens),
            native,
            ok: true,
            avgConfidence,
          }
          feedPage(engine, pageExtraction)
          pagesProcessed++
        }
      } catch {
        result.failedPages.push(p)
      }

      if (p % 2 === 0) await yieldToUI()
    }

    emit(doc.numPages, doc.numPages, 'narrations', 0.9)
    emit(doc.numPages, doc.numPages, 'validating', 0.96)
    finish(engine, result, rawTextAccum, doc.numPages, pagesProcessed, pagesWithWarnings)
  } finally {
    await doc.destroy()
  }

  emit(doc.numPages, doc.numPages, 'excel', 1)
  return result
}

function finish(
  engine: ReturnType<typeof createEngine>,
  result: StatementResultWithReport,
  rawText: string,
  totalPages: number,
  pagesProcessed: number,
  pagesWithWarnings: number,
) {
  result.transactions = finishEngine(engine)
  result.rawText = rawText.slice(0, 20000)

  const meta = detectStatementMeta(rawText, result.transactions)
  result.openingBalance = meta.openingBalance
  result.closingBalance = meta.closingBalance
  result.periodStart = meta.periodStart
  result.periodEnd = meta.periodEnd

  for (const t of result.transactions) if (!t.sourceFile) t.sourceFile = result.fileName

  result.report = buildReport(
    result.transactions,
    totalPages,
    pagesProcessed,
    result.failedPages,
    pagesWithWarnings,
  )
}

export { makeTransaction }
