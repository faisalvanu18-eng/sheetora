import { useEffect, useRef, useState } from 'react'

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
 * it.
 *
 * A neutral, clearly-labelled "Advertisement" placeholder is shown until an ad
 * actually fills the slot. We watch the <ins> element's
 * `data-adsbygoogle-status` / `data-ad-status` attributes: AdSense sets these to
 * "done" / "filled" or "unfilled" once it has processed the unit. While the ad
 * is unfilled (e.g. during Google's site review, when blocked, or when there is
 * no ad inventory) the placeholder stays visible and the layout height is kept
 * stable. Once an ad fills, the placeholder is hidden so only the ad shows.
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
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = insRef.current
    if (!el) return

    // Request an ad for this unit (once).
    if (!el.getAttribute('data-adsbygoogle-status')) {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {
        // AdSense unavailable (blocked/offline) — placeholder remains.
      }
    }

    // Watch for AdSense marking the unit filled/unfilled.
    const check = () => {
      const status = el.getAttribute('data-ad-status')
      if (status === 'filled') setFilled(true)
      else if (status === 'unfilled') setFilled(false)
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(el, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <aside aria-label="Advertisement" className={`container-page my-6 ${className}`}>
      <div
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-dashed ${
          filled ? 'border-transparent bg-transparent' : 'border-ink-200 bg-ink-100/60'
        } ${sizeByPlacement[placement]}`}
      >
        {!filled && (
          <span className="pointer-events-none select-none text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
            Advertisement
          </span>
        )}
        <ins
          ref={insRef}
          className="adsbygoogle absolute inset-0 block h-full w-full"
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
