// Lazy PDF text extraction using pdfjs-dist.
// The worker is loaded via Vite's ?url import so it is code-split and only
// fetched when a PDF is actually processed.

export interface PdfExtractResult {
  text: string
  /** True when the PDF appears to have little/no embedded text (scanned). */
  needsOcr: boolean
  /** Rendered page images (data URLs) for OCR fallback. */
  pageImages: string[]
}

async function getPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  return pdfjs
}

/**
 * Extract text from a PDF. If a page has almost no embedded text (a scanned
 * document), it is rendered to an image so the caller can run OCR on it.
 */
export async function extractPdf(file: File): Promise<PdfExtractResult> {
  const pdfjs = await getPdfjs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise

  let text = ''
  const pageImages: string[] = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    text += pageText + '\n'

    // If a page has almost no extractable text, render it for OCR.
    if (pageText.replace(/\s/g, '').length < 20) {
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise
        pageImages.push(canvas.toDataURL('image/png'))
      }
    }
  }

  const needsOcr = text.replace(/\s/g, '').length < 40
  return { text, needsOcr, pageImages }
}

// ---- Page-by-page processing (for large bank statements) --------------------

export interface PdfPageResult {
  pageNumber: number
  /** Text from the PDF text layer, or from OCR fallback. */
  text: string
  /** True when OCR was used for this page. */
  usedOcr: boolean
  /** A rendered preview data URL (only produced on request). */
  previewDataUrl?: string
  /** Set when the page could not be read at all. */
  failed?: boolean
}

export interface PdfDocHandle {
  numPages: number
  /**
   * Process a single page: try the text layer first; if it is empty, render
   * and OCR. Canvas/image resources are released before returning.
   */
  processPage: (
    pageNumber: number,
    ocr: (dataUrl: string) => Promise<string>,
    opts?: { wantPreview?: boolean },
  ) => Promise<PdfPageResult>
  destroy: () => Promise<void>
}

/**
 * Open a PDF and return a handle for incremental, page-by-page processing.
 * This never renders all pages at once and releases each page's resources
 * immediately, keeping memory usage low for large statements.
 */
export async function openPdf(file: File): Promise<PdfDocHandle> {
  const pdfjs = await getPdfjs()
  const data = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data })
  const doc = await loadingTask.promise

  return {
    numPages: doc.numPages,

    async processPage(pageNumber, ocr, opts = {}) {
      const result: PdfPageResult = { pageNumber, text: '', usedOcr: false }
      let page: Awaited<ReturnType<typeof doc.getPage>> | null = null
      try {
        page = await doc.getPage(pageNumber)

        // 1. Try the text layer first (fast, accurate for digital PDFs).
        const content = await page.getTextContent()
        const layerText = reconstructLines(content.items as TextItemLike[])

        const hasUsableText = layerText.replace(/\s/g, '').length >= 25

        if (hasUsableText && !opts.wantPreview) {
          result.text = layerText
          page.cleanup()
          return result
        }

        // 2. Render the page (needed for OCR fallback and/or preview).
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        canvas.width = Math.min(viewport.width, 2200)
        canvas.height = Math.min(viewport.height, 3000)
        const ctx = canvas.getContext('2d')

        let dataUrl = ''
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise
          dataUrl = canvas.toDataURL('image/png')
        }

        if (opts.wantPreview) result.previewDataUrl = dataUrl

        if (hasUsableText) {
          result.text = layerText
        } else if (dataUrl) {
          // 3. OCR fallback for scanned pages.
          result.usedOcr = true
          result.text = await ocr(dataUrl)
        }

        // Release canvas resources explicitly.
        canvas.width = 0
        canvas.height = 0

        page.cleanup()
        return result
      } catch {
        result.failed = true
        try {
          page?.cleanup()
        } catch {
          /* ignore */
        }
        return result
      }
    },

    async destroy() {
      try {
        await doc.cleanup()
        await doc.destroy()
      } catch {
        /* ignore */
      }
    },
  }
}

interface TextItemLike {
  str?: string
  transform?: number[]
  hasEOL?: boolean
  width?: number
  height?: number
}

// ---- Accurate page-by-page invoice extraction -------------------------------

import { groupIntoRows } from './tableEngine'
import type { PositionedToken as PToken } from '../types'

export interface InvoicePageProgress {
  page: number
  totalPages: number
  /** 0..1 progress for the whole document. */
  progress: number
  usedOcr: boolean
}

/**
 * Extract an invoice PDF one page at a time, as accurately as possible.
 *
 * For every page we:
 *   1. read the native text layer WITH coordinates and rebuild proper lines by
 *      grouping tokens by their Y position (so columns/labels don't collapse);
 *   2. if that page's text is weak (scanned or image-only), render it at high
 *      resolution and OCR just that page.
 *
 * Speed is deliberately traded for accuracy — each page gets its own careful
 * pass, and OCR runs at a large raster size. The returned text preserves page
 * order and line structure for the rule-based parser.
 */
export async function extractInvoicePages(
  file: File,
  ocr: (dataUrl: string, onProgress?: (f: number) => void) => Promise<string>,
  onProgress?: (u: InvoicePageProgress) => void,
): Promise<string> {
  const pdfjs = await getPdfjs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise

  const pageTexts: string[] = []

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const base = (pageNum - 1) / doc.numPages
      const span = 1 / doc.numPages
      const page = await doc.getPage(pageNum)

      // 1. Native text layer with coordinates.
      const viewport = page.getViewport({ scale: 1 })
      const pageHeight = viewport.height
      const content = await page.getTextContent()

      const tokens: PToken[] = []
      for (const raw of content.items as TextItemLike[]) {
        const s = (raw.str ?? '').replace(/\s+$/, '')
        if (!s.trim()) continue
        const tr = raw.transform ?? [1, 0, 0, 1, 0, 0]
        const h = raw.height ?? Math.abs(tr[3]) ?? 10
        tokens.push({
          text: s.trim(),
          x: tr[4],
          y: pageHeight - tr[5] - h,
          width: raw.width ?? s.length * (h * 0.5),
          height: h,
        })
      }

      const nativeChars = tokens.reduce((n, t) => n + t.text.replace(/\s/g, '').length, 0)
      let pageText = nativeChars >= 25 ? rowsToText(tokens) : ''
      let usedOcr = false

      onProgress?.({ page: pageNum, totalPages: doc.numPages, progress: base + span * 0.15, usedOcr: false })

      // 2. OCR fallback for weak/scanned pages.
      if (nativeChars < 25) {
        usedOcr = true
        const vp = page.getViewport({ scale: 3 })
        const canvas = document.createElement('canvas')
        canvas.width = Math.min(vp.width, 3000)
        canvas.height = Math.min(vp.height, 4000)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: vp }).promise
          const dataUrl = canvas.toDataURL('image/png')
          canvas.width = 0
          canvas.height = 0
          pageText = await ocr(dataUrl, (f) =>
            onProgress?.({
              page: pageNum,
              totalPages: doc.numPages,
              progress: base + span * (0.15 + f * 0.8),
              usedOcr: true,
            }),
          )
        }
      }

      pageTexts.push(pageText)
      page.cleanup()

      onProgress?.({ page: pageNum, totalPages: doc.numPages, progress: base + span, usedOcr })
      // Yield to the UI between pages so progress updates render.
      await new Promise((r) => setTimeout(r, 0))
    }
  } finally {
    try {
      await doc.cleanup()
      await doc.destroy()
    } catch {
      /* ignore */
    }
  }

  return pageTexts.join('\n\n')
}

/** Rebuild readable, line-structured text from positioned tokens. */
function rowsToText(tokens: PToken[]): string {
  const rows = groupIntoRows(tokens)
  return rows
    .map((r) => {
      // Insert a wide gap marker when tokens are far apart so the parser can
      // still see column boundaries (it collapses runs of 2+ spaces).
      let line = ''
      let prevEnd = -Infinity
      for (const t of r.tokens) {
        const gap = t.x - prevEnd
        if (line) line += gap > (t.height || 10) * 1.2 ? '  ' : ' '
        line += t.text
        prevEnd = t.x + t.width
      }
      return line.trim()
    })
    .filter(Boolean)
    .join('\n')
}

// ---- Positioned-token extraction (accuracy engine) --------------------------

import type { PositionedToken } from '../types'

export interface PositionedPage {
  page: number
  tokens: PositionedToken[]
  /** True if the native text layer had usable content. */
  hasText: boolean
  /** Rendered raster (data URL) for OCR fallback — only when requested. */
  render: () => Promise<{ dataUrl: string; width: number; height: number } | null>
}

export interface PositionedPdfHandle {
  numPages: number
  getPage: (pageNumber: number) => Promise<PositionedPage | null>
  destroy: () => Promise<void>
}

/**
 * Open a PDF for coordinate-aware, page-by-page extraction. For each page we
 * return the native text tokens WITH their x/y/width/height so the table can be
 * reconstructed by column position. A render() closure is provided for the OCR
 * fallback; it is only invoked when the caller needs it, and it releases the
 * canvas immediately after producing a data URL.
 */
export async function openPdfPositioned(file: File): Promise<PositionedPdfHandle> {
  const pdfjs = await getPdfjs()
  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise

  return {
    numPages: doc.numPages,

    async getPage(pageNumber) {
      try {
        const page = await doc.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        const pageHeight = viewport.height
        const content = await page.getTextContent()

        const tokens: PositionedToken[] = []
        for (const raw of content.items as TextItemLike[]) {
          const s = (raw.str ?? '').trim()
          if (!s) continue
          const tr = raw.transform ?? [1, 0, 0, 1, 0, 0]
          const x = tr[4]
          // PDF y-origin is bottom-left; convert to top-down.
          const yBottom = tr[5]
          const h = raw.height ?? Math.abs(tr[3]) ?? 10
          const w = raw.width ?? s.length * (h * 0.5)
          tokens.push({
            text: s,
            x,
            y: pageHeight - yBottom - h,
            width: w,
            height: h,
          })
        }

        const hasText = tokens.reduce((n, t) => n + t.text.replace(/\s/g, '').length, 0) >= 25

        const render = async () => {
          try {
            const vp = page.getViewport({ scale: 2 })
            const canvas = document.createElement('canvas')
            canvas.width = Math.min(vp.width, 2400)
            canvas.height = Math.min(vp.height, 3200)
            const ctx = canvas.getContext('2d')
            if (!ctx) return null
            await page.render({ canvasContext: ctx, viewport: vp }).promise
            const dataUrl = canvas.toDataURL('image/png')
            const dims = { dataUrl, width: canvas.width, height: canvas.height }
            canvas.width = 0
            canvas.height = 0
            return dims
          } catch {
            return null
          }
        }

        // Note: we cleanup the page after the caller is done via destroy();
        // for text-only pages we can cleanup now.
        const result: PositionedPage = { page: pageNumber, tokens, hasText, render }
        if (hasText) page.cleanup()
        return result
      } catch {
        return null
      }
    },

    async destroy() {
      try {
        await doc.cleanup()
        await doc.destroy()
      } catch {
        /* ignore */
      }
    },
  }
}

/**
 * Reconstruct line breaks from PDF text items using their Y coordinates, so
 * columnar statement rows stay on separate lines instead of collapsing.
 */
function reconstructLines(items: TextItemLike[]): string {
  const rows: { y: number; parts: string[] }[] = []
  const TOL = 3
  for (const it of items) {
    const s = it.str ?? ''
    if (!s) continue
    const y = it.transform ? Math.round(it.transform[5]) : 0
    let row = rows.find((r) => Math.abs(r.y - y) <= TOL)
    if (!row) {
      row = { y, parts: [] }
      rows.push(row)
    }
    row.parts.push(s)
  }
  rows.sort((a, b) => b.y - a.y) // top-to-bottom
  return rows.map((r) => r.parts.join(' ').replace(/\s{2,}/g, '  ').trim()).join('\n')
}
