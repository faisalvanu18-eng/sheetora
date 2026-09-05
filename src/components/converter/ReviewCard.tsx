import { AlertTriangle, FileText, Trash2 } from 'lucide-react'
import type { InvoiceData, InvoiceItem } from '../../types'
import { buildWarnings } from '../../lib/parser'
import ItemsEditor from './ItemsEditor'

interface ReviewCardProps {
  invoice: InvoiceData
  index: number
  total: number
  onChange: (inv: InvoiceData) => void
  onRemove: () => void
}

const FIELD_GROUPS: {
  title: string
  fields: { key: keyof InvoiceData; label: string; full?: boolean }[]
}[] = [
  {
    title: 'Invoice',
    fields: [
      { key: 'invoiceNumber', label: 'Invoice Number' },
      { key: 'invoiceDate', label: 'Invoice Date' },
      { key: 'dueDate', label: 'Due Date' },
    ],
  },
  {
    title: 'Supplier',
    fields: [
      { key: 'supplierName', label: 'Supplier Name' },
      { key: 'supplierGstin', label: 'Supplier GSTIN' },
      { key: 'supplierPhone', label: 'Phone' },
      { key: 'supplierEmail', label: 'Email' },
      { key: 'supplierAddress', label: 'Address', full: true },
    ],
  },
  {
    title: 'Customer',
    fields: [
      { key: 'customerName', label: 'Customer Name' },
      { key: 'customerGstin', label: 'Customer GSTIN' },
      { key: 'customerAddress', label: 'Address', full: true },
    ],
  },
  {
    title: 'Totals',
    fields: [
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'totalTax', label: 'Total Tax' },
      { key: 'roundOff', label: 'Round Off' },
      { key: 'grandTotal', label: 'Grand Total' },
    ],
  },
]

export default function ReviewCard({
  invoice,
  index,
  total,
  onChange,
  onRemove,
}: ReviewCardProps) {
  function setField(key: keyof InvoiceData, value: string) {
    const next = { ...invoice, [key]: value }
    next.warnings = buildWarnings(next)
    onChange(next)
  }
  function setItems(items: InvoiceItem[]) {
    const next = { ...invoice, items }
    next.warnings = buildWarnings(next)
    onChange(next)
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/60 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText size={18} className="shrink-0 text-brand-500" aria-hidden="true" />
          <span className="truncate text-sm font-semibold">
            {invoice.fileName}
          </span>
          {total > 1 && (
            <span className="shrink-0 text-xs text-ink-400">
              ({index + 1}/{total})
            </span>
          )}
        </div>
        {total > 1 && (
          <button
            type="button"
            aria-label={`Remove ${invoice.fileName}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-red-600"
            onClick={onRemove}
          >
            <Trash2 size={14} aria-hidden="true" />
            Remove
          </button>
        )}
      </div>

      <div className="p-5">
        {invoice.warnings.length > 0 && (
          <ul className="mb-5 space-y-1.5" aria-label="Warnings">
            {invoice.warnings.map((w) => (
              <li
                key={w}
                className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
              >
                <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
        )}

        {FIELD_GROUPS.map((group) => (
          <fieldset key={group.title} className="mb-6">
            <legend className="mb-2 text-sm font-bold text-ink-900">{group.title}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.fields.map((f) => (
                <label key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                  <span className="label">{f.label}</span>
                  <input
                    className="input"
                    value={String(invoice[f.key] ?? '')}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div>
          <h3 className="mb-2 text-sm font-bold text-ink-900">Line Items</h3>
          <ItemsEditor items={invoice.items} onChange={setItems} />
        </div>

        {invoice.rawText.trim() && (
          <details className="mt-6 rounded-lg border border-ink-200 bg-ink-50/60">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink-700">
              View extracted text (what the reader saw)
            </summary>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap px-4 pb-4 text-xs text-ink-600">
              {invoice.rawText}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
