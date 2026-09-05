import { Check, Loader2 } from 'lucide-react'
import { PROCESSING_STAGES } from '../../constants'
import type { ProcessingStageId } from '../../types'

interface ProcessingViewProps {
  fileName: string
  fileIndex: number
  fileCount: number
  stage: ProcessingStageId
  progress: number
  note?: string
}

export default function ProcessingView({
  fileName,
  fileIndex,
  fileCount,
  stage,
  progress,
  note,
}: ProcessingViewProps) {
  const currentStageIndex = PROCESSING_STAGES.findIndex((s) => s.id === stage)
  const pct = Math.round(progress * 100)

  return (
    <div className="card p-6 sm:p-8" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-500">
            Processing file {fileIndex + 1} of {fileCount}
          </p>
          <p className="truncate text-base font-semibold">{fileName}</p>
        </div>
        <span className="text-2xl font-bold tabular-nums text-brand-600">{pct}%</span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {note ? (
        <p className="mt-3 text-sm font-medium text-brand-600">{note}</p>
      ) : null}

      <ul className="mt-6 space-y-2.5">
        {PROCESSING_STAGES.map((s, i) => {
          const done = i < currentStageIndex
          const active = i === currentStageIndex
          return (
            <li key={s.id} className="flex items-center gap-3">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full ${
                  done
                    ? 'bg-green-100 text-green-600'
                    : active
                      ? 'bg-brand-100 text-brand-600'
                      : 'bg-ink-100 text-ink-300'
                }`}
              >
                {done ? (
                  <Check size={14} aria-hidden="true" />
                ) : active ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                )}
              </span>
              <span
                className={`text-sm ${
                  active ? 'font-semibold text-ink-900' : done ? 'text-ink-600' : 'text-ink-400'
                }`}
              >
                {s.label}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-6 text-center text-xs text-ink-400">
        Each page is analyzed individually for accuracy, so multi-page files may
        take a little longer. Everything runs in your browser — your files are
        never uploaded.
      </p>
    </div>
  )
}
