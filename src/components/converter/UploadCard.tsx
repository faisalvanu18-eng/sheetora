import { useRef, useState } from 'react'
import { UploadCloud, Camera, FileText, X } from 'lucide-react'
import { SITE } from '../../constants'
import { isSupported } from '../../lib/process'

interface UploadCardProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  onStart: () => void
  error: string | null
  onError: (msg: string | null) => void
}

const MAX_BYTES = SITE.maxFileSizeMB * 1024 * 1024

export default function UploadCard({
  files,
  onFilesChange,
  onStart,
  error,
  onError,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function addFiles(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list)
    const valid: File[] = []
    for (const f of incoming) {
      if (!isSupported(f)) {
        onError(`"${f.name}" is not a supported file type. Use JPG, PNG or PDF.`)
        continue
      }
      if (f.size > MAX_BYTES) {
        onError(`"${f.name}" is larger than ${SITE.maxFileSizeMB} MB.`)
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
        aria-label="Upload invoice files"
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
        <p className="mt-4 text-base font-semibold sm:text-lg">Drop your invoice here</p>
        <p className="mt-1 text-sm text-ink-500">or click to browse</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-400">
          JPG • PNG • PDF
        </p>
        <p className="text-xs text-ink-400">Maximum {SITE.maxFileSizeMB} MB</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Mobile-friendly action buttons */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
          <FileText size={18} aria-hidden="true" />
          Choose File
        </button>
        <button type="button" className="btn-secondary" onClick={() => cameraRef.current?.click()}>
          <Camera size={18} aria-hidden="true" />
          Take Photo
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-ink-700">
            {files.length} file{files.length > 1 ? 's' : ''} ready
          </h3>
          <ul className="mt-2 space-y-2">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText size={16} className="shrink-0 text-ink-400" aria-hidden="true" />
                  <span className="truncate text-sm text-ink-800">{f.name}</span>
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
            Extract {files.length} invoice{files.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
