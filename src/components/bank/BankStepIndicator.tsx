import type { ConverterStep } from '../../types'

const STEPS: { id: ConverterStep; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'processing', label: 'Analyze' },
  { id: 'review', label: 'Review' },
  { id: 'success', label: 'Export' },
]

export default function BankStepIndicator({ current }: { current: ConverterStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current)

  return (
    <div>
      <div className="sm:hidden">
        <p className="text-sm font-semibold text-brand-600">
          Step {currentIndex + 1} of {STEPS.length}
        </p>
        <p className="text-lg font-bold">{STEPS[currentIndex]?.label}</p>
        <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${i <= currentIndex ? 'bg-brand-500' : 'bg-ink-200'}`}
            />
          ))}
        </div>
      </div>

      <ol className="hidden items-center gap-2 sm:flex" aria-label="Progress">
        {STEPS.map((s, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                  active ? 'bg-brand-500 text-white' : done ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-400'
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-sm font-medium ${active ? 'text-ink-900' : 'text-ink-400'}`}>{s.label}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-ink-200" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
