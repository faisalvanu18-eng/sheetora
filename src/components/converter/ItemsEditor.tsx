import { Plus, Trash2 } from 'lucide-react'
import type { InvoiceItem } from '../../types'
import { makeItem } from '../../lib/parser'

interface ItemsEditorProps {
  items: InvoiceItem[]
  onChange: (items: InvoiceItem[]) => void
}

const FIELDS: { key: keyof InvoiceItem; label: string; wide?: boolean }[] = [
  { key: 'description', label: 'Description', wide: true },
  { key: 'hsnSac', label: 'HSN/SAC' },
  { key: 'quantity', label: 'Qty' },
  { key: 'rate', label: 'Rate' },
  { key: 'taxableAmount', label: 'Taxable' },
  { key: 'gstRate', label: 'GST %' },
  { key: 'cgst', label: 'CGST' },
  { key: 'sgst', label: 'SGST' },
  { key: 'igst', label: 'IGST' },
  { key: 'total', label: 'Total' },
]

export default function ItemsEditor({ items, onChange }: ItemsEditorProps) {
  function update(id: string, key: keyof InvoiceItem, value: string) {
    onChange(items.map((it) => (it.id === id ? { ...it, [key]: value } : it)))
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id))
  }
  function add() {
    onChange([...items, makeItem()])
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-500">
              {FIELDS.map((f) => (
                <th key={f.key} className="px-2 py-2 font-semibold">
                  {f.label}
                </th>
              ))}
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-ink-100">
                {FIELDS.map((f) => (
                  <td key={f.key} className="px-1 py-1">
                    <input
                      className="input min-h-[38px] px-2"
                      style={{ minWidth: f.wide ? 180 : 70 }}
                      value={it[f.key]}
                      aria-label={f.label}
                      onChange={(e) => update(it.id, f.key, e.target.value)}
                    />
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button
                    type="button"
                    aria-label="Delete item"
                    className="grid h-9 w-9 place-items-center rounded-md text-ink-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => remove(it.id)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={FIELDS.length + 1} className="px-2 py-6 text-center text-ink-400">
                  No items yet. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {items.map((it, idx) => (
          <div key={it.id} className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Item {idx + 1}
              </span>
              <button
                type="button"
                aria-label="Delete item"
                className="inline-flex items-center gap-1 text-sm font-medium text-red-600"
                onClick={() => remove(it.id)}
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {FIELDS.map((f) => (
                <label key={f.key} className={f.wide ? 'col-span-2' : ''}>
                  <span className="label">{f.label}</span>
                  <input
                    className="input"
                    value={it[f.key]}
                    onChange={(e) => update(it.id, f.key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-400">
            No items yet. Add one below.
          </p>
        )}
      </div>

      <button type="button" className="btn-secondary mt-4" onClick={add}>
        <Plus size={18} aria-hidden="true" />
        Add Item
      </button>
    </div>
  )
}
