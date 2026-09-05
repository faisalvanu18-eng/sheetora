import { Check, Loader2, Pause, Play, XCircle } from 'lucide-react'
import { BANK_PROCESSING_STAGES } from '../../constants'
import type { BankProgressUpdate } from '../../lib/bankProcess'

interface BankProcessingViewProps {
  update: BankProgressUpdate | null
  isLargeFile: boolean
  paused: boolean
  onPause: () => void
  onResume: () => void
  onCancel: () => void
}

export default function BankProcessingView({
  update,
  isLargeFile,
  paused,
  onPause,
  onResume,
  onCancel,
}: BankProcessingViewProps) {
  const stageIdx = update ? BANK_PROCESSING_STAGES.findIndex((s) => s.id === update.stage) : 0
  const pct = update ? Math.round(update.progress * 100) : 0

  return (
    <div className="card p-6 sm:p-8" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-500">
            {update && update.fileCount > 1
              ? `Statement ${update.fileIndex + 1} of ${update.fileCount}`
              : 'Analyzing bank statement'}
          </p>
          <p className="truncate text-base font-semibold">{update?.fileName ?? ''}</p>
        </div>
        <span className="text-2xl font-bold tabular-nums text-brand-600">{pct}%</span>
      </div>

      {update && update.totalPages > 0 && (
        <p className="mt-1 text-sm text-ink-600">
          Page {update.page} of {update.totalPages}
        </p>
      )}

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <p className="mt-3 text-sm font-medium text-ink-700">
        Transactions found: <span className="tabular-nums text-brand-600">{update?.transactionsFound ?? 0}</span>
      </p>

      {isLargeFile && (
        <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Large statement detected</p>
          <p className="mt-0.5">Processing page-by-page to reduce memory usage. This may take a little longer.</p>
        </div>
      )}

      <ul className="mt-6 space-y-2.5">
        {BANK_PROCESSING_STAGES.map((s, i) => {
          const done = i < stageIdx
          const active = i === stageIdx
          return (
            <li key={s.id} className="flex items-center gap-3">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full ${
                  done ? 'bg-green-100 text-green-600' : active ? 'bg-brand-100 text-brand-600' : 'bg-ink-100 text-ink-300'
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
              <span className={`text-sm ${active ? 'font-semibold text-ink-900' : done ? 'text-ink-600' : 'text-ink-400'}`}>
                {s.label}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        {paused ? (
          <button type="button" className="btn-secondary" onClick={onResume}>
            <Play size={16} aria-hidden="true" />
            Resume
          </button>
        ) : (
          <button type="button" className="btn-secondary" onClick={onPause}>
            <Pause size={16} aria-hidden="true" />
            Pause
          </button>
        )}
        <button
          type="button"
          className="btn min-h-[44px] border border-red-200 bg-white px-5 text-red-600 hover:bg-red-50"
          onClick={onCancel}
        >
          <XCircle size={16} aria-hidden="true" />
          Cancel
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        Your statement is processed directly in your browser and is not uploaded to any server.
      </p>
    </div>
  )
}
