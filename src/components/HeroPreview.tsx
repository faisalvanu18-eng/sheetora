import { FileText, CheckCircle2 } from 'lucide-react'

const fields = [
  { label: 'Invoice Number', value: 'INV-1025' },
  { label: 'Supplier', value: 'ABC Traders' },
  { label: 'GSTIN', value: '27XXXXXXXXXXXXXX' },
  { label: 'Taxable Amount', value: '₹50,000' },
  { label: 'CGST', value: '₹4,500' },
  { label: 'SGST', value: '₹4,500' },
  { label: 'Total', value: '₹59,000', strong: true },
]

/** Static, illustrative product preview shown under the hero. */
export default function HeroPreview() {
  return (
    <div className="container-page pb-4">
      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        {/* Invoice preview */}
        <div className="card overflow-hidden p-5">
          <div className="flex items-center gap-2 text-ink-400">
            <FileText size={18} aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wide">Invoice</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-3 w-2/5 rounded bg-ink-200" />
            <div className="h-3 w-3/5 rounded bg-ink-100" />
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 rounded ${i % 4 === 0 ? 'bg-ink-200' : 'bg-ink-100'}`}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <div className="h-3 w-1/3 rounded bg-brand-200" />
            </div>
          </div>
        </div>

        {/* Extracted fields */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Extracted fields
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              <CheckCircle2 size={14} aria-hidden="true" />
              Excel Ready
            </span>
          </div>
          <dl className="mt-4 divide-y divide-ink-100">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2.5">
                <dt className="text-sm text-ink-500">{f.label}</dt>
                <dd
                  className={`text-sm ${
                    f.strong ? 'font-bold text-ink-900' : 'font-medium text-ink-800'
                  }`}
                >
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
