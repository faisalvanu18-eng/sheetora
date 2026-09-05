import { useState } from 'react'
import { Download, ArrowLeft } from 'lucide-react'
import Seo from '../components/Seo'
import { AdSlotConverter } from '../components/AdSlot'
import FaqAccordion from '../components/FaqAccordion'
import StepIndicator from '../components/converter/StepIndicator'
import UploadCard from '../components/converter/UploadCard'
import ProcessingView from '../components/converter/ProcessingView'
import ReviewCard from '../components/converter/ReviewCard'
import FormatSelector from '../components/converter/FormatSelector'
import SuccessScreen from '../components/converter/SuccessScreen'
import { processFile } from '../lib/process'
import { exportToExcel } from '../lib/excel'
import type {
  ConverterStep,
  ExcelFormat,
  InvoiceData,
  ProcessingStageId,
} from '../types'
import { CUSTOM_COLUMNS } from '../constants'

const CONVERTER_FAQS = [
  {
    q: 'Are my invoices uploaded to a server?',
    a: 'No. Sheetora processes every file locally inside your browser using JavaScript. Your documents never leave your device.',
  },
  {
    q: 'Which file types are supported?',
    a: 'You can convert JPG, JPEG, PNG and PDF invoices. Scanned PDFs are read with OCR automatically.',
  },
  {
    q: 'Can I fix incorrect fields?',
    a: 'Yes. Every extracted field and line item is editable in the Review step before you export.',
  },
  {
    q: 'Can I process multiple invoices at once?',
    a: 'Yes. Add several files and they will be combined into a single Excel workbook with a summary sheet.',
  },
]

export default function Converter() {
  const [step, setStep] = useState<ConverterStep>('upload')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  // Processing state
  const [procIndex, setProcIndex] = useState(0)
  const [procStage, setProcStage] = useState<ProcessingStageId>('reading')
  const [procProgress, setProcProgress] = useState(0)
  const [procNote, setProcNote] = useState('')

  // Results
  const [invoices, setInvoices] = useState<InvoiceData[]>([])

  // Export config
  const [format, setFormat] = useState<ExcelFormat>('basic')
  const [customColumns, setCustomColumns] = useState<string[]>([...CUSTOM_COLUMNS.slice(0, 8)])
  const [exportedName, setExportedName] = useState('')

  async function startProcessing() {
    if (files.length === 0) return
    setStep('processing')
    setError(null)
    const results: InvoiceData[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        setProcIndex(i)
        setProcProgress(0)
        setProcStage('reading')
        const inv = await processFile(files[i], {
          onStage: setProcStage,
          onProgress: setProcProgress,
          onNote: setProcNote,
        })
        results.push(inv)
      }
      setInvoices(results)
      setStep('review')
    } catch (e) {
      console.error(e)
      setError(
        'Something went wrong while reading a file. Please try a different file or a clearer scan.',
      )
      setStep('upload')
    }
  }

  function updateInvoice(inv: InvoiceData) {
    setInvoices((prev) => prev.map((x) => (x.id === inv.id ? inv : x)))
  }
  function removeInvoice(id: string) {
    setInvoices((prev) => prev.filter((x) => x.id !== id))
  }

  function handleExport() {
    if (invoices.length === 0) return
    if (format === 'custom' && customColumns.length === 0) return
    const name = exportToExcel(invoices, { format, customColumns })
    setExportedName(name)
    setStep('success')
  }

  function reset() {
    setFiles([])
    setInvoices([])
    setError(null)
    setProcIndex(0)
    setProcProgress(0)
    setProcStage('reading')
    setProcNote('')
    setExportedName('')
    setStep('upload')
  }

  const canExport = invoices.length > 0 && (format !== 'custom' || customColumns.length > 0)

  return (
    <>
      <Seo
        title="Invoice to Excel Converter – Convert Invoices to Excel Online | Sheetora"
        description="Upload a PDF, JPG or PNG invoice and convert it to a clean Excel spreadsheet in your browser. Review, edit and export GST-ready .xlsx files. No signup, no upload."
        path="/invoice-to-excel"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to convert an invoice to Excel',
          step: [
            { '@type': 'HowToStep', name: 'Upload your invoice' },
            { '@type': 'HowToStep', name: 'Extract the data in your browser' },
            { '@type': 'HowToStep', name: 'Review and edit the fields' },
            { '@type': 'HowToStep', name: 'Download the Excel file' },
          ],
        }}
      />

      <div className="container-page py-8 sm:py-12">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Invoice to Excel Converter
          </h1>
          <p className="mt-1 text-ink-500">
            Convert your invoice into an accounting-ready spreadsheet.
          </p>
        </header>

        <div className="mb-8">
          <StepIndicator current={step} />
        </div>

        {/* STEP CONTENT */}
        {step === 'upload' && (
          <UploadCard
            files={files}
            onFilesChange={setFiles}
            onStart={startProcessing}
            error={error}
            onError={setError}
          />
        )}

        {step === 'processing' && (
          <ProcessingView
            fileName={files[procIndex]?.name ?? ''}
            fileIndex={procIndex}
            fileCount={files.length}
            stage={procStage}
            progress={procProgress}
            note={procNote}
          />
        )}

        {step === 'review' && (
          <div className="pb-24 lg:pb-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Review your extracted data</h2>
              <button
                type="button"
                className="btn-ghost px-3"
                onClick={() => setStep('upload')}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </button>
            </div>

            <p className="mb-5 text-sm text-ink-500">
              Sheetora uses rule-based extraction, so please check each field and correct anything
              that needs a fix before exporting.
            </p>

            <div className="space-y-5">
              {invoices.map((inv, i) => (
                <ReviewCard
                  key={inv.id}
                  invoice={inv}
                  index={i}
                  total={invoices.length}
                  onChange={updateInvoice}
                  onRemove={() => removeInvoice(inv.id)}
                />
              ))}
            </div>

            <AdSlotConverter className="!px-0" />

            <div className="card mt-2 p-5">
              <FormatSelector
                format={format}
                onFormat={setFormat}
                customColumns={customColumns}
                onCustomColumns={setCustomColumns}
              />
              <div className="mt-6 hidden lg:block">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!canExport}
                  onClick={handleExport}
                >
                  <Download size={18} aria-hidden="true" />
                  Generate Excel
                </button>
              </div>
            </div>

            {/* Mobile sticky action */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 p-3 backdrop-blur lg:hidden">
              <div className="container-page !px-4">
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={!canExport}
                  onClick={handleExport}
                >
                  <Download size={18} aria-hidden="true" />
                  Generate Excel
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <SuccessScreen
            fileName={exportedName}
            onDownloadAgain={handleExport}
            onReset={reset}
          />
        )}
      </div>

      {/* SEO CONTENT (below the tool) */}
      {step !== 'processing' && (
        <section className="container-page pb-8">
          <div className="prose-none mx-auto max-w-3xl space-y-10">
            <div>
              <h2 className="text-2xl font-bold">How to Convert an Invoice to Excel</h2>
              <p className="mt-2 text-ink-600">
                Upload a PDF, JPG or PNG invoice using the converter above. Sheetora reads the
                document directly in your browser — text-based PDFs are parsed instantly, while
                scanned files and photos are read with on-device OCR. The tool then identifies the
                key accounting fields, lets you review and edit everything, and finally exports a
                formatted <code>.xlsx</code> file.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold">What Information Can Sheetora Extract?</h2>
              <p className="mt-2 text-ink-600">
                Sheetora looks for the invoice number, invoice and due dates, supplier and customer
                names, GSTIN numbers, contact details, and line items with HSN/SAC codes,
                quantities, rates, taxes and totals — plus overall subtotals, tax and the grand
                total.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold">GST Invoice to Excel</h2>
              <p className="mt-2 text-ink-600">
                For GST invoices, Sheetora detects GSTIN numbers and common tax columns such as
                CGST, SGST and IGST. Choose the GST Purchase or GST Sales format to export a
                register-style spreadsheet with taxable value and tax breakup per line.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold">PDF Invoice to Excel</h2>
              <p className="mt-2 text-ink-600">
                PDF invoices are fully supported. Digital PDFs have their text extracted directly;
                scanned PDFs are rendered and read with OCR. Either way, the file is processed on
                your device and never uploaded.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <div className="mt-4">
                <FaqAccordion items={CONVERTER_FAQS} />
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
