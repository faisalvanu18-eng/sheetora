import { CheckCircle2, Download, RefreshCw, FileSpreadsheet } from 'lucide-react'

interface BankSuccessScreenProps {
  fileName: string
  transactionCount: number
  reviewCount: number
  onDownloadAgain: () => void
  onReset: () => void
}

export default function BankSuccessScreen({
  fileName,
  transactionCount,
  reviewCount,
  onDownloadAgain,
  onReset,
}: BankSuccessScreenProps) {
  return (
    <div className="card p-8 text-center sm:p-12">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 size={36} aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-2xl font-bold">{transactionCount} transactions exported</h2>

      <div className="mx-auto mt-5 max-w-sm rounded-xl border border-ink-200 bg-ink-50 p-4">
        <p className="flex items-center justify-center gap-2 font-semibold text-ink-900">
          <FileSpreadsheet size={18} className="text-green-600" aria-hidden="true" />
          {fileName}
        </p>
        <ul className="mt-3 space-y-1.5 text-left text-sm text-ink-600">
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" aria-hidden="true" /> Transactions extracted
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" aria-hidden="true" /> Data reviewed
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" aria-hidden="true" /> File generated
          </li>
        </ul>
        {reviewCount > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
            {reviewCount} transaction{reviewCount > 1 ? 's were' : ' was'} flagged for review — double-check them in your file.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={onDownloadAgain}>
          <Download size={18} aria-hidden="true" />
          Download Again
        </button>
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onReset}>
          <RefreshCw size={18} aria-hidden="true" />
          Convert Another Statement
        </button>
      </div>
    </div>
  )
}
