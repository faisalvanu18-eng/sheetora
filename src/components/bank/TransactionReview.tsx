import { useMemo, useState } from 'react'
import { AlertTriangle, Copy, Search, ChevronDown, Trash2, Plus } from 'lucide-react'
import type { BankTransaction, TransactionFilter } from '../../types'
import { makeTransaction } from '../../lib/bankParser'

interface TransactionReviewProps {
  transactions: BankTransaction[]
  onChange: (txns: BankTransaction[]) => void
  multiFile: boolean
}

const EDIT_FIELDS: { key: keyof BankTransaction; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'valueDate', label: 'Value Date' },
  { key: 'referenceNo', label: 'Reference' },
  { key: 'chequeNo', label: 'Cheque No' },
  { key: 'utr', label: 'UTR' },
  { key: 'debit', label: 'Debit' },
  { key: 'credit', label: 'Credit' },
  { key: 'balance', label: 'Balance' },
]

export default function TransactionReview({ transactions, onChange, multiFile }: TransactionReviewProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TransactionFilter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const counts = useMemo(() => {
    const review = transactions.filter((t) => t.needsReview.length).length
    return { total: transactions.length, verified: transactions.length - review, review }
  }, [transactions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      if (filter === 'verified' && (t.needsReview.length || t.possibleDuplicate)) return false
      if (filter === 'debit' && !t.debit) return false
      if (filter === 'credit' && !t.credit) return false
      if (filter === 'review' && t.needsReview.length === 0) return false
      if (filter === 'duplicate' && !t.possibleDuplicate) return false
      if (!q) return true
      return [t.narration, t.referenceNo, t.utr, t.transactionId, t.debit, t.credit, t.balance]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [transactions, query, filter])

  function update(id: string, key: keyof BankTransaction, value: string) {
    onChange(
      transactions.map((t) => {
        if (t.id !== id) return t
        const next = { ...t, [key]: value }
        // Recompute simple review flags on edit.
        const review = next.needsReview.filter(
          (r) => !(r === 'Date' && next.date) && !(r === 'Amount' && (next.debit || next.credit)) && !(r === 'Narration' && next.narration),
        )
        return { ...next, needsReview: review }
      }),
    )
  }
  function remove(id: string) {
    onChange(transactions.filter((t) => t.id !== id))
  }
  function add() {
    onChange([...transactions, makeTransaction({ needsReview: ['Date', 'Amount'] })])
  }
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">
          {counts.total} transactions detected
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">
          ✓ {counts.verified} verified
        </span>
        {counts.review > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
            <AlertTriangle size={13} aria-hidden="true" /> {counts.review} need review
          </span>
        )}
      </div>

      {/* Search + filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search narration, reference, UTR, amount…"
            aria-label="Search transactions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter transactions">
          {(['all', 'verified', 'debit', 'credit', 'review', 'duplicate'] as TransactionFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`min-h-[40px] rounded-lg border px-3 text-sm font-medium capitalize transition-colors ${
                filter === f ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300'
              }`}
            >
              {f === 'review' ? 'Needs Review' : f === 'duplicate' ? 'Duplicates' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-ink-200 lg:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-3 py-2 font-semibold">Narration</th>
              <th className="px-3 py-2 text-right font-semibold">Debit</th>
              <th className="px-3 py-2 text-right font-semibold">Credit</th>
              <th className="px-3 py-2 text-right font-semibold">Balance</th>
              {multiFile && <th className="px-3 py-2 font-semibold">Source</th>}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <TxRow
                key={t.id}
                t={t}
                multiFile={multiFile}
                expanded={expanded.has(t.id)}
                onToggleExpand={() => toggleExpand(t.id)}
                editing={editingId === t.id}
                onEdit={() => setEditingId(t.id)}
                onDone={() => setEditingId(null)}
                onUpdate={(k, v) => update(t.id, k, v)}
                onRemove={() => remove(t.id)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={multiFile ? 7 : 6} className="px-3 py-6 text-center text-ink-400">
                  No transactions match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((t) => (
          <TxCard
            key={t.id}
            t={t}
            multiFile={multiFile}
            expanded={expanded.has(t.id)}
            onToggleExpand={() => toggleExpand(t.id)}
            editing={editingId === t.id}
            onEdit={() => setEditingId(editingId === t.id ? null : t.id)}
            onUpdate={(k, v) => update(t.id, k, v)}
            onRemove={() => remove(t.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-400">
            No transactions match your search.
          </p>
        )}
      </div>

      <button type="button" className="btn-secondary mt-4" onClick={add}>
        <Plus size={18} aria-hidden="true" />
        Add Transaction
      </button>
    </div>
  )
}

// ---- Desktop row ----

interface RowProps {
  t: BankTransaction
  multiFile: boolean
  expanded: boolean
  onToggleExpand: () => void
  editing: boolean
  onEdit: () => void
  onDone: () => void
  onUpdate: (k: keyof BankTransaction, v: string) => void
  onRemove: () => void
}

function TxRow({ t, multiFile, expanded, onToggleExpand, editing, onEdit, onDone, onUpdate, onRemove }: RowProps) {
  const longNarr = t.narration.length > 80
  return (
    <>
      <tr className={`border-b border-ink-100 align-top ${t.needsReview.length ? 'bg-amber-50/40' : ''}`}>
        <td className="px-3 py-2 whitespace-nowrap">{t.date || <em className="text-amber-600">—</em>}</td>
        <td className="max-w-md px-3 py-2">
          <span className={expanded ? '' : 'line-clamp-2'}>{t.narration}</span>
          {longNarr && (
            <button type="button" className="mt-0.5 block text-xs font-medium text-brand-600" onClick={onToggleExpand}>
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
          {t.possibleDuplicate && (
            <span className="mt-1 inline-flex items-center gap-1 rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600">
              <Copy size={11} aria-hidden="true" /> Possible duplicate
            </span>
          )}
          {t.needsReview.length > 0 && (
            <span className="mt-1 block text-[11px] font-medium text-amber-700">⚠ Needs review: {t.needsReview.join(', ')}</span>
          )}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-red-600">{t.debit}</td>
        <td className="px-3 py-2 text-right tabular-nums text-green-700">{t.credit}</td>
        <td className="px-3 py-2 text-right tabular-nums">{t.balance}</td>
        {multiFile && <td className="px-3 py-2 text-xs text-ink-500">{t.sourceFile}</td>}
        <td className="px-3 py-2 text-right">
          <button type="button" className="text-sm font-medium text-brand-600" onClick={editing ? onDone : onEdit}>
            {editing ? 'Done' : 'Edit'}
          </button>
        </td>
      </tr>
      {editing && (
        <tr className="border-b border-ink-100 bg-ink-50/60">
          <td colSpan={multiFile ? 7 : 6} className="px-3 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <label className="col-span-2 md:col-span-4">
                <span className="label">Narration (full)</span>
                <textarea className="input min-h-[60px] py-2" value={t.narration} onChange={(e) => onUpdate('narration', e.target.value)} />
              </label>
              {EDIT_FIELDS.map((f) => (
                <label key={f.key}>
                  <span className="label">{f.label}</span>
                  <input className="input" value={String(t[f.key] ?? '')} onChange={(e) => onUpdate(f.key, e.target.value)} />
                </label>
              ))}
              <div className="col-span-2 flex items-end md:col-span-4">
                <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-red-600" onClick={onRemove}>
                  <Trash2 size={14} aria-hidden="true" /> Delete transaction
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ---- Mobile card ----

function TxCard({ t, multiFile, expanded, onToggleExpand, editing, onEdit, onUpdate, onRemove }: Omit<RowProps, 'onDone'>) {
  const longNarr = t.narration.length > 80
  return (
    <div className={`rounded-xl border p-4 ${t.needsReview.length ? 'border-amber-200 bg-amber-50/40' : 'border-ink-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{t.date || <em className="text-amber-600">Date needs review</em>}</span>
        <button type="button" className="text-sm font-medium text-brand-600" onClick={onEdit}>
          {editing ? 'Close' : 'Edit'}
        </button>
      </div>

      <p className={`mt-1 text-sm text-ink-700 ${expanded ? '' : 'line-clamp-3'}`}>{t.narration}</p>
      {longNarr && (
        <button type="button" className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600" onClick={onToggleExpand}>
          {expanded ? 'Show less' : 'Show more'}
          <ChevronDown size={12} className={expanded ? 'rotate-180' : ''} aria-hidden="true" />
        </button>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {t.debit && <div><span className="text-ink-400">Debit</span><p className="font-semibold text-red-600">{t.debit}</p></div>}
        {t.credit && <div><span className="text-ink-400">Credit</span><p className="font-semibold text-green-700">{t.credit}</p></div>}
        {t.balance && <div><span className="text-ink-400">Balance</span><p className="font-semibold">{t.balance}</p></div>}
        {multiFile && <div><span className="text-ink-400">Source</span><p className="truncate text-xs">{t.sourceFile}</p></div>}
      </div>

      {t.possibleDuplicate && (
        <p className="mt-2 inline-flex items-center gap-1 rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600">
          <Copy size={11} aria-hidden="true" /> Possible duplicate
        </p>
      )}
      {t.needsReview.length > 0 && (
        <p className="mt-2 text-xs font-medium text-amber-700">⚠ Needs review: {t.needsReview.join(', ')}</p>
      )}

      {editing && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-ink-100 pt-3">
          <label className="col-span-2">
            <span className="label">Narration (full)</span>
            <textarea className="input min-h-[70px] py-2" value={t.narration} onChange={(e) => onUpdate('narration', e.target.value)} />
          </label>
          {EDIT_FIELDS.map((f) => (
            <label key={f.key}>
              <span className="label">{f.label}</span>
              <input className="input" value={String(t[f.key] ?? '')} onChange={(e) => onUpdate(f.key, e.target.value)} />
            </label>
          ))}
          <div className="col-span-2">
            <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-red-600" onClick={onRemove}>
              <Trash2 size={14} aria-hidden="true" /> Delete transaction
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
