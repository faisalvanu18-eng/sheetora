import { useCallback, useMemo, useRef, useState } from 'react'
import { Download, ArrowLeft, AlertTriangle } from 'lucide-react'
import Seo from '../components/Seo'
import { AdSlotConverter } from '../components/AdSlot'
import FaqAccordion from '../components/FaqAccordion'
import BankStepIndicator from '../components/bank/BankStepIndicator'
import BankUploadCard from '../components/bank/BankUploadCard'
import BankProcessingView from '../components/bank/BankProcessingView'
import TransactionReview from '../components/bank/TransactionReview'
import BankFormatSelector from '../components/bank/BankFormatSelector'
import BankSuccessScreen from '../components/bank/BankSuccessScreen'
import { processStatement, type BankProgressUpdate, type StatementResultWithReport } from '../lib/bankProcess'
import { exportStatements, BANK_CUSTOM_COLUMNS } from '../lib/bankExcel'
import { SITE } from '../constants'
import type { BankExcelFormat, BankTransaction, ConverterStep } from '../types'

const FAQS = [
  {
    q: 'Is my bank statement uploaded to a server?',
    a: 'No. Sheetora reads and processes your statement entirely inside your browser. The file is never sent to us or any third party.',
  },
  {
    q: 'How are long narrations handled?',
    a: 'The complete available narration is preserved. When a narration wraps across multiple lines, those lines are intelligently joined into a single transaction — nothing is truncated or summarised.',
  },
  {
    q: 'What if a value is unclear?',
    a: 'Sheetora never invents data. If a date, amount or direction cannot be confidently detected, the transaction is flagged “Needs Review” so you can correct it before export.',
  },
  {
    q: 'Can I convert scanned statements?',
    a: 'Yes. Text-based PDFs are read directly; scanned PDFs and image statements are read page-by-page with on-device OCR.',
  },
]

export default function BankConverter() {
  const [step, setStep] = useState<ConverterStep>('upload')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const [progress, setProgress] = useState<BankProgressUpdate | null>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const cancelRef = useRef(false)

  const [statements, setStatements] = useState<StatementResultWithReport[]>([])
  const [format, setFormat] = useState<BankExcelFormat>('standard')
  const [customColumns, setCustomColumns] = useState<string[]>([...BANK_CUSTOM_COLUMNS])
  const [asCsv, setAsCsv] = useState(false)
  const [exportedName, setExportedName] = useState('')

  const isLargeFile = useMemo(
    () => files.some((f) => f.size > 8 * 1024 * 1024),
    [files],
  )

  const waitIfPaused = useCallback(async () => {
    while (pausedRef.current && !cancelRef.current) {
      await new Promise((r) => setTimeout(r, 150))
    }
  }, [])

  async function start() {
    if (files.length === 0) return
    cancelRef.current = false
    pausedRef.current = false
    setPaused(false)
    setError(null)
    setStep('processing')

    const results: StatementResultWithReport[] = []
    try {
      for (let i = 0; i < files.length; i++) {
        if (cancelRef.current) break
        const res = await processStatement(files[i], i, files.length, {
          onProgress: setProgress,
          shouldCancel: () => cancelRef.current,
          waitIfPaused,
        })
        results.push(res)
      }

      if (cancelRef.current) {
        setStep('upload')
        return
      }

      setStatements(results)
      setStep('review')
    } catch (e) {
      console.error(e)
      setError('We could not read this statement. Try a clearer file or fewer pages at a time.')
      setStep('upload')
    }
  }

  function pause() {
    pausedRef.current = true
    setPaused(true)
  }
  function resume() {
    pausedRef.current = false
    setPaused(false)
  }
  function cancel() {
    cancelRef.current = true
    pausedRef.current = false
    setPaused(false)
    setStep('upload')
  }

  const allTransactions = useMemo(() => statements.flatMap((s) => s.transactions), [statements])
  const reviewCount = allTransactions.filter((t) => t.needsReview.length).length
  const failedPages = statements.reduce((n, s) => n + s.failedPages.length, 0)
  const multiFile = statements.length > 1

  const aggregateReport = useMemo(() => {
    const totalPages = statements.reduce((n, s) => n + s.totalPages, 0)
    const pagesProcessed = statements.reduce((n, s) => n + s.report.pagesProcessed, 0)
    const pagesWithWarnings = statements.reduce((n, s) => n + s.report.pagesWithWarnings, 0)
    const narrationsPreserved = allTransactions.filter((t) => t.narration).length
    const dupes = allTransactions.filter((t) => t.possibleDuplicate).length
    return {
      totalPages,
      pagesProcessed,
      pagesWithWarnings,
      total: allTransactions.length,
      verified: allTransactions.length - reviewCount,
      needsReview: reviewCount,
      dupes,
      narrationsPreserved,
    }
  }, [statements, allTransactions, reviewCount])

  function updateTransactions(next: BankTransaction[]) {
    // Re-map edited transactions back into their statements by id.
    setStatements((prev) =>
      prev.map((s) => ({
        ...s,
        transactions: next.filter((t) => s.transactions.some((o) => o.id === t.id)),
      })),
    )
    // Also keep any newly added rows (no matching statement) in the first statement.
    const known = new Set(statements.flatMap((s) => s.transactions.map((t) => t.id)))
    const added = next.filter((t) => !known.has(t.id))
    if (added.length) {
      setStatements((prev) => {
        if (prev.length === 0) return prev
        const copy = [...prev]
        copy[0] = { ...copy[0], transactions: [...copy[0].transactions, ...added] }
        return copy
      })
    }
  }

  function handleExport() {
    if (allTransactions.length === 0) return
    if (format === 'custom' && customColumns.length === 0) return
    const { fileName, integrity } = exportStatements(statements, { format, customColumns, asCsv })
    if (!integrity.ok) {
      // Integrity issues are surfaced but do not block a conscious export.
      console.warn('Excel integrity issues:', integrity.issues)
    }
    setExportedName(fileName)
    setStep('success')
  }

  function reset() {
    setFiles([])
    setStatements([])
    setError(null)
    setProgress(null)
    setExportedName('')
    setStep('upload')
  }

  const canExport = allTransactions.length > 0 && (format !== 'custom' || customColumns.length > 0)

  return (
    <>
      <Seo
        title="Bank Statement to Excel Converter – Convert PDF to Excel | Sheetora"
        description="Convert bank statement PDFs and images into structured Excel spreadsheets. Extract transactions, dates, narrations, debit, credit and balance directly in your browser."
        path="/bank-statement-to-excel"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to convert a bank statement to Excel',
          step: [
            { '@type': 'HowToStep', name: 'Upload your bank statement PDF or image' },
            { '@type': 'HowToStep', name: 'Sheetora extracts transactions page-by-page in your browser' },
            { '@type': 'HowToStep', name: 'Review and correct flagged transactions' },
            { '@type': 'HowToStep', name: 'Download the Excel or CSV file' },
          ],
        }}
      />

      <div className="container-page py-8 sm:py-12">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bank Statement to Excel Converter</h1>
          <p className="mt-1 text-ink-500">
            Turn PDF or image bank statements into a clean, editable transaction spreadsheet.
          </p>
        </header>

        <div className="mb-8">
          <BankStepIndicator current={step} />
        </div>

        {step === 'upload' && (
          <BankUploadCard files={files} onFilesChange={setFiles} onStart={start} error={error} onError={setError} />
        )}

        {step === 'processing' && (
          <BankProcessingView
            update={progress}
            isLargeFile={isLargeFile}
            paused={paused}
            onPause={pause}
            onResume={resume}
            onCancel={cancel}
          />
        )}

        {step === 'review' && (
          <div className="pb-24 lg:pb-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Review Your Transactions</h2>
              <button type="button" className="btn-ghost px-3" onClick={() => setStep('upload')}>
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </button>
            </div>

            {failedPages > 0 && (
              <p className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle size={15} aria-hidden="true" />
                {failedPages} page{failedPages > 1 ? 's' : ''} could not be read and {failedPages > 1 ? 'were' : 'was'} skipped.
              </p>
            )}

            {/* Processing report */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Pages', value: `${aggregateReport.pagesProcessed}/${aggregateReport.totalPages}`, tone: 'text-ink-900' },
                { label: 'Transactions', value: aggregateReport.total, tone: 'text-ink-900' },
                { label: 'Verified', value: aggregateReport.verified, tone: 'text-green-700' },
                { label: 'Needs Review', value: aggregateReport.needsReview, tone: aggregateReport.needsReview ? 'text-amber-700' : 'text-ink-900' },
                { label: 'Duplicates', value: aggregateReport.dupes, tone: aggregateReport.dupes ? 'text-amber-700' : 'text-ink-900' },
                { label: 'Narrations', value: aggregateReport.narrationsPreserved, tone: 'text-ink-900' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-ink-200 bg-white p-3 text-center">
                  <p className={`text-xl font-bold tabular-nums ${stat.tone}`}>{stat.value}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <TransactionReview transactions={allTransactions} onChange={updateTransactions} multiFile={multiFile} />

            <AdSlotConverter className="!px-0" />

            <div className="card mt-2 p-5">
              <BankFormatSelector
                format={format}
                onFormat={setFormat}
                customColumns={customColumns}
                onCustomColumns={setCustomColumns}
                asCsv={asCsv}
                onAsCsv={setAsCsv}
              />
              <div className="mt-6 hidden lg:block">
                {reviewCount > 0 && (
                  <p className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertTriangle size={15} aria-hidden="true" />
                    {reviewCount} transaction{reviewCount > 1 ? 's' : ''} need review. Fix them above, or export anyway.
                  </p>
                )}
                <button type="button" className="btn-primary" disabled={!canExport} onClick={handleExport}>
                  <Download size={18} aria-hidden="true" />
                  {reviewCount > 0 ? `Export Anyway (${asCsv ? 'CSV' : 'Excel'})` : `Download ${asCsv ? 'CSV' : 'Excel'}`}
                </button>
              </div>
            </div>

            {/* Mobile sticky action */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 p-3 backdrop-blur lg:hidden">
              <div className="container-page !px-4">
                <button type="button" className="btn-primary w-full" disabled={!canExport} onClick={handleExport}>
                  <Download size={18} aria-hidden="true" />
                  Download {asCsv ? 'CSV' : 'Excel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <BankSuccessScreen
            fileName={exportedName}
            transactionCount={allTransactions.length}
            reviewCount={reviewCount}
            onDownloadAgain={handleExport}
            onReset={reset}
          />
        )}
      </div>

      {step !== 'processing' && (
        <section className="container-page pb-8">
          <div className="mx-auto max-w-3xl space-y-10">
            <div>
              <h2 className="text-2xl font-bold">How to Convert a Bank Statement PDF to Excel</h2>
              <p className="mt-2 text-ink-600">
                Upload one or more bank statement PDFs (or images) above. Sheetora opens each PDF and processes it
                page-by-page: it first reads the embedded text layer, and only falls back to OCR for scanned pages.
                Transactions are detected, long narrations are reconstructed, and debit, credit and balance columns are
                identified. You then review everything and export a clean {SITE.name} spreadsheet.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">What Information Can Be Extracted?</h2>
              <p className="mt-2 text-ink-600">
                Dates, full narrations, debit and credit amounts, running balance, and — where present — reference
                numbers, UTR/RRN and cheque numbers. Sheetora adapts to different column layouts such as Debit/Credit,
                Withdrawal/Deposit, and a single Amount column with a Dr/Cr indicator.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">How Sheetora Handles Long Narrations</h2>
              <p className="mt-2 text-ink-600">
                Bank narrations can span several lines and carry important reference information. Sheetora preserves the
                complete available narration and joins wrapped lines into the correct transaction, so nothing useful is
                lost or shortened in your Excel file.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Is My Bank Statement Uploaded?</h2>
              <p className="mt-2 text-ink-600">
                No. Because bank statements are sensitive, all processing happens locally in your browser. Your statement
                is not uploaded to a server, not logged, and temporary data is cleared when you finish. Sheetora is
                designed for reliable extraction with built-in review and validation — always verify your data before use.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <div className="mt-4">
                <FaqAccordion items={FAQS} />
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
