import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface FaqItem {
  q: string
  a: string
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="text-sm font-semibold text-ink-900 sm:text-base">{item.q}</span>
              <ChevronDown
                size={20}
                className={`shrink-0 text-ink-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {isOpen && <p className="px-5 pb-5 text-sm text-ink-600">{item.a}</p>}
          </div>
        )
      })}
    </div>
  )
}
