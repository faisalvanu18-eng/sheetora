import { Check } from 'lucide-react'
import type { BankExcelFormat } from '../../types'
import { BANK_EXCEL_FORMATS } from '../../constants'
import { BANK_CUSTOM_COLUMNS } from '../../lib/bankExcel'

interface BankFormatSelectorProps {
  format: BankExcelFormat
  onFormat: (f: BankExcelFormat) => void
  customColumns: string[]
  onCustomColumns: (cols: string[]) => void
  asCsv: boolean
  onAsCsv: (v: boolean) => void
}

export default function BankFormatSelector({
  format,
  onFormat,
  customColumns,
  onCustomColumns,
  asCsv,
  onAsCsv,
}: BankFormatSelectorProps) {
  function toggleColumn(col: string) {
    onCustomColumns(customColumns.includes(col) ? customColumns.filter((c) => c !== col) : [...customColumns, col])
  }

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-bold text-ink-900">Choose an export format</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {BANK_EXCEL_FORMATS.map((opt) => {
            const selected = format === opt.id
            return (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  selected ? 'border-brand-400 bg-brand-50' : 'border-ink-200 hover:border-brand-300'
                }`}
              >
                <input type="radio" name="bank-format" className="sr-only" checked={selected} onChange={() => onFormat(opt.id)} />
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300'
                  }`}
                  aria-hidden="true"
                >
                  {selected && <Check size={12} />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink-900">{opt.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">{opt.description}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {format === 'custom' && (
        <fieldset className="mt-5 rounded-xl border border-ink-200 p-4">
          <legend className="px-1 text-sm font-semibold text-ink-700">Select columns</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {BANK_CUSTOM_COLUMNS.map((col) => {
              const on = customColumns.includes(col)
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleColumn(col)}
                  className={`min-h-[36px] rounded-full border px-3 text-sm font-medium transition-colors ${
                    on ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300'
                  }`}
                >
                  {col}
                </button>
              )
            })}
          </div>
          {customColumns.length === 0 && <p className="mt-2 text-xs text-amber-700">Select at least one column.</p>}
        </fieldset>
      )}

      <label className="mt-4 flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" className="h-4 w-4 rounded border-ink-300" checked={asCsv} onChange={(e) => onAsCsv(e.target.checked)} />
        Export as CSV instead of Excel
      </label>
    </div>
  )
}
