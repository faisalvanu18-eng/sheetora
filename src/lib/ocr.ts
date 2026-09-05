// Lazy OCR using tesseract.js. The library and language data are only fetched
// when OCR actually runs, keeping the homepage bundle small.

type OcrProgress = (fraction: number) => void

/**
 * Load a source (File or data URL) into an HTMLImageElement.
 */
function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    if (typeof source === 'string') {
      img.src = source
    } else {
      img.src = URL.createObjectURL(source)
    }
  })
}

/**
 * Preprocess an image for OCR: upscale small images and boost contrast to
 * grayscale. Tesseract is far more accurate on larger, high-contrast text.
 * Returns a data URL, or the original source if preprocessing fails.
 */
async function preprocess(source: File | string): Promise<File | string> {
  try {
    const img = await loadImage(source)
    // Aim for a high long-edge so small fonts on invoices stay legible.
    const minTarget = 2200
    const longEdge = Math.max(img.naturalWidth, img.naturalHeight)
    const scale = longEdge < minTarget ? Math.min(4, minTarget / longEdge) : 1

    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return source

    ctx.drawImage(img, 0, 0, w, h)

    // Grayscale + adaptive contrast. Compute a mean brightness, then push
    // pixels away from it so faint invoice text becomes crisp black-on-white.
    const data = ctx.getImageData(0, 0, w, h)
    const px = data.data
    let sum = 0
    const gray = new Float32Array(px.length / 4)
    for (let i = 0, g = 0; i < px.length; i += 4, g++) {
      const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
      gray[g] = v
      sum += v
    }
    const mean = sum / gray.length
    // Contrast gain around the mean; clamp to keep strokes intact.
    const gain = 1.6
    for (let i = 0, g = 0; i < px.length; i += 4, g++) {
      let v = (gray[g] - mean) * gain + mean
      v = v < 0 ? 0 : v > 255 ? 255 : v
      px[i] = px[i + 1] = px[i + 2] = v
    }
    ctx.putImageData(data, 0, 0)

    if (typeof source !== 'string') URL.revokeObjectURL(img.src)
    return canvas.toDataURL('image/png')
  } catch {
    return source
  }
}

/**
 * Run OCR on an image (File or data URL). `onProgress` receives 0..1.
 */
export async function ocrImage(
  source: File | string,
  onProgress?: OcrProgress,
): Promise<string> {
  const { createWorker } = await import('tesseract.js')

  const input = await preprocess(source)

  const worker = await createWorker('eng', undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress)
      }
    },
  })

  try {
    // PSM 3: fully automatic page segmentation. For a whole rendered invoice
    // page this keeps multi-column layouts and label/value pairs in a sensible
    // reading order, which the rule-based parser depends on. Preserving spaces
    // helps keep column gaps visible.
    await worker.setParameters({
      tessedit_pageseg_mode: '3' as never,
      preserve_interword_spaces: '1' as never,
    })
    const { data } = await worker.recognize(input)
    return data.text
  } finally {
    await worker.terminate()
  }
}

/** OCR several images and concatenate the recognised text. */
export async function ocrImages(
  sources: (File | string)[],
  onProgress?: OcrProgress,
): Promise<string> {
  let combined = ''
  for (let i = 0; i < sources.length; i++) {
    const base = i / sources.length
    const span = 1 / sources.length
    const text = await ocrImage(sources[i], (f) => onProgress?.(base + f * span))
    combined += text + '\n'
  }
  return combined
}

// ---- Positioned-word OCR (for coordinate-based table reconstruction) --------

export interface OcrWord {
  text: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

/**
 * OCR an image and return each recognised WORD with its bounding box, so the
 * table engine can reconstruct columns from OCR the same way it does for native
 * PDF text. Applies the same preprocessing as ocrImage.
 */
export async function ocrWords(
  source: File | string,
  onProgress?: OcrProgress,
): Promise<{ words: OcrWord[]; avgConfidence: number }> {
  const { createWorker } = await import('tesseract.js')
  const input = await preprocess(source)

  const worker = await createWorker('eng', undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(m.progress)
    },
  })

  try {
    await worker.setParameters({ tessedit_pageseg_mode: '6' as never })
    const { data } = await worker.recognize(input, {}, { blocks: true })
    const words: OcrWord[] = []
    let confSum = 0
    let confCount = 0

    // Tesseract v5 returns data.blocks -> paragraphs -> lines -> words.
    const blocks = (data as unknown as { blocks?: unknown[] }).blocks ?? []
    const walk = (node: unknown) => {
      const n = node as {
        text?: string
        confidence?: number
        bbox?: { x0: number; y0: number; x1: number; y1: number }
        words?: unknown[]
        lines?: unknown[]
        paragraphs?: unknown[]
      }
      if (n.words) {
        for (const w of n.words) {
          const ww = w as { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }
          if (ww.text && ww.text.trim() && ww.bbox) {
            words.push({
              text: ww.text.trim(),
              x: ww.bbox.x0,
              y: ww.bbox.y0,
              width: ww.bbox.x1 - ww.bbox.x0,
              height: ww.bbox.y1 - ww.bbox.y0,
              confidence: ww.confidence,
            })
            confSum += ww.confidence
            confCount++
          }
        }
      }
      for (const key of ['paragraphs', 'lines'] as const) {
        const arr = n[key]
        if (Array.isArray(arr)) arr.forEach(walk)
      }
    }
    blocks.forEach(walk)

    // Fallback: if the block/word structure wasn't available, synthesise tokens
    // from the flat text so the page is never lost. X is approximated from the
    // character offset, which is enough for the column grouper to separate
    // date / narration / amount / balance clusters.
    if (words.length === 0 && data.text) {
      const CHAR_W = 8
      const LINE_H = 18
      const synth: OcrWord[] = []
      data.text.split('\n').forEach((line, lineIdx) => {
        if (!line.trim()) return
        // Split into runs separated by 2+ spaces (column gaps) but keep single
        // words too so narration stays intact.
        const re = /\S+(?: \S+)*?(?=\s{2,}|$)/g
        let m: RegExpExecArray | null
        while ((m = re.exec(line)) !== null) {
          const text = m[0].trim()
          if (!text) continue
          synth.push({
            text,
            x: m.index * CHAR_W,
            y: lineIdx * LINE_H,
            width: text.length * CHAR_W,
            height: LINE_H - 4,
            confidence: 60,
          })
        }
      })
      return { words: synth, avgConfidence: 60 }
    }

    return { words, avgConfidence: confCount ? confSum / confCount : 0 }
  } finally {
    await worker.terminate()
  }
}
