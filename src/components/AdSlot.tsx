import { useEffect, useRef } from 'react'

type AdPlacement = 'top' | 'middle' | 'bottom' | 'converter'

interface AdSlotProps {
  placement?: AdPlacement
  className?: string
}

/**
 * Reusable advertisement slot backed by Google AdSense.
 *
 * The AdSense loader script is included once in index.html. This component
 * renders a responsive <ins class="adsbygoogle"> unit and asks AdSense to fill
 * it. A neutral, clearly-labelled placeholder sits behind the unit so the
 * layout stays stable while the ad loads (and in dev, where no ad is served).
 *
 * Ads are intentionally kept visually separate from the tool and never overlap
 * navigation, buttons, uploaded files, inputs or the download workflow.
 */
const AD_CLIENT = 'ca-pub-5788775732171838'

const sizeByPlacement: Record<AdPlacement, string> = {
  top: 'min-h-[90px] sm:min-h-[100px]',
  middle: 'min-h-[90px] sm:min-h-[120px]',
  bottom: 'min-h-[90px] sm:min-h-[120px]',
  converter: 'min-h-[90px]',
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export default function AdSlot({ placement = 'middle', className = '' }: AdSlotProps) {
  const insRef = useRef<HTMLModElement | null>(null)

  useEffect(() => {
    // Only request an ad once per mounted slot, and only in the browser.
    if (typeof window === 'undefined') return
    const el = insRef.current
    if (!el || el.getAttribute('data-adsbygoogle-status')) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense not available (e.g. blocked or offline) — placeholder remains.
    }
  }, [])

  return (
    <aside aria-label="Advertisement" className={`container-page my-6 ${className}`}>
      <div
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink-200 bg-ink-100/60 ${sizeByPlacement[placement]}`}
      >
        <span className="pointer-events-none absolute select-none text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          Advertisement
        </span>
        <ins
          ref={insRef}
          className="adsbygoogle relative block w-full"
          style={{ display: 'block' }}
          data-ad-client={AD_CLIENT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  )
}

export function AdSlotTop(props: Omit<AdSlotProps, 'placement'>) {
  return <AdSlot placement="top" {...props} />
}
export function AdSlotMiddle(props: Omit<AdSlotProps, 'placement'>) {
  return <AdSlot placement="middle" {...props} />
}
export function AdSlotBottom(props: Omit<AdSlotProps, 'placement'>) {
  return <AdSlot placement="bottom" {...props} />
}
export function AdSlotConverter(props: Omit<AdSlotProps, 'placement'>) {
  return <AdSlot placement="converter" {...props} />
}
