import type { InvoiceData, ProcessingStageId } from '../types'
import { extractInvoicePages } from './pdf'
import { ocrImage } from './ocr'
import { parseInvoice } from './parser'

export interface ProcessCallbacks {
  onStage?: (stage: ProcessingStageId) => void
  onProgress?: (fraction: number) => void
  /** Human-readable detail, e.g. "Analyzing page 2 of 5". */
  onNote?: (note: string) => void
}

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

export function isSupported(file: File): boolean {
  return file.type === 'application/pdf' || IMAGE_TYPES.includes(file.type)
}

/**
 * Process a single file end-to-end:
 *   read → detect text (PDF text or OCR) → parse fields → warnings.
 *
 * PDFs are analyzed one page at a time for maximum accuracy: each page's native
 * text layer is rebuilt with correct line structure, and any scanned/weak page
 * is rendered at high resolution and OCR'd individually. This is slower but far
 * more accurate than a single bulk pass.
 * All work happens locally in the browser.
 */
export async function processFile(
  file: File,
  cb: ProcessCallbacks = {},
): Promise<InvoiceData> {
  const { onStage, onProgress, onNote } = cb

  onStage?.('reading')
  onProgress?.(0.03)

  let rawText = ''

  if (file.type === 'application/pdf') {
    onStage?.('detecting')
    rawText = await extractInvoicePages(
      file,
      (dataUrl, onOcr) => ocrImage(dataUrl, onOcr),
      (u) => {
        // Reserve 0.03..0.75 of the bar for reading + per-page extraction/OCR.
        onProgress?.(0.03 + u.progress * 0.72)
        onNote?.(
          `Analyzing page ${u.page} of ${u.totalPages}${u.usedOcr ? ' (OCR)' : ''}`,
        )
      },
    )
  } else {
    // Image → OCR
    onStage?.('detecting')
    onNote?.('Reading image with OCR')
    rawText = await ocrImage(file, (f) => onProgress?.(0.05 + f * 0.7))
  }

  onNote?.('')

  onStage?.('invoice')
  onProgress?.(0.8)

  onStage?.('gst')
  onProgress?.(0.87)

  onStage?.('items')
  onProgress?.(0.93)

  const invoice = parseInvoice(rawText, file.name)

  onStage?.('spreadsheet')
  onProgress?.(1)

  return invoice
}
