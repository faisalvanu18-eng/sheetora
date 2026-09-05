import { useRef, useState } from 'react'
import { UploadCloud, FileText, X } from 'lucide-react'
import { SITE } from '../../constants'
import { isSupportedStatement } from '../../lib/bankProcess'

interface BankUploadCardProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  onStart: () => void
  error: string | null
  onError: (msg: string | null) => void
}

const MAX_BYTES = SITE.maxStatementSizeMB * 1024 * 1024

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BankUploadCard({ files, onFilesChange, onStart, error, onError }: BankUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function addFiles(list: FileList | null) {
    if (!list) return
    const valid: File[] = []
    for (const f of Array.from(list)) {
      if (!isSupportedStatement(f)) {
        onError(`"${f.name}" is not supported. Upload a PDF, JPG or PNG statement.`)
        continue
      }
      if (f.size > MAX_BYTES) {
        onError(`"${f.name}" is larger than ${SITE.maxStatementSizeMB} MB. Try splitting the statement into smaller files.`)
        continue
      }
      valid.push(f)
    }
    if (valid.length) {
      onError(null)
      onFilesChange([...files, ...valid])
    }
  }

  function removeFile(idx: number) {
    onFilesChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload bank statement files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        className={`card flex cursor-pointer flex-col items-center justify-center px-6 py-10 text-center transition-colors sm:py-14 ${
          dragging ? 'border-brand-400 bg-brand-50' : 'hover:border-brand-300'
        }`}
      >
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-500">
          <UploadCloud size={30} aria-hidden="true" />
        </span>
        <p className="mt-4 text-base font-semibold sm:text-lg">Drop your bank statement here</p>
        <p className="mt-1 text-sm text-ink-500">or click to browse</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-400">PDF • JPG • PNG</p>
        <p className="text-xs text-ink-400">
          Supports large statements with page-by-page processing, subject to your device and browser resources.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          multiple
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {files.length === 0 ? (
        <p className="mt-4 text-center text-sm text-ink-400">Upload a bank statement to begin.</p>
      ) : (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-ink-700">
            {files.length} statement{files.length > 1 ? 's' : ''} ready
          </h3>
          <ul className="mt-2 space-y-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText size={16} className="shrink-0 text-ink-400" aria-hidden="true" />
                  <span className="truncate text-sm text-ink-800">{f.name}</span>
                  <span className="shrink-0 text-xs text-ink-400">{formatSize(f.size)}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  onClick={() => removeFile(i)}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="btn-primary mt-5 w-full sm:w-auto" onClick={onStart}>
            Analyze {files.length} statement{files.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
