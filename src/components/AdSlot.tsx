type AdPlacement = 'top' | 'middle' | 'bottom' | 'converter'

interface AdSlotProps {
  placement?: AdPlacement
  className?: string
}

/**
 * Reusable advertisement slot.
 *
 * During development this renders a neutral, clearly-labelled placeholder.
 * To go live with Google AdSense, replace the placeholder markup inside this
 * component with the AdSense <ins class="adsbygoogle"> unit — the responsive
 * sizing wrapper stays the same, so no page layouts need to change.
 *
 * Ads are intentionally kept visually separate from the tool and never overlap
 * navigation, buttons, uploaded files, inputs or the download workflow.
 */
const sizeByPlacement: Record<AdPlacement, string> = {
  top: 'min-h-[90px] sm:min-h-[100px]',
  middle: 'min-h-[90px] sm:min-h-[120px]',
  bottom: 'min-h-[90px] sm:min-h-[120px]',
  converter: 'min-h-[90px]',
}

export default function AdSlot({ placement = 'middle', className = '' }: AdSlotProps) {
  return (
    <aside
      aria-label="Advertisement"
      className={`container-page my-6 ${className}`}
    >
      <div
        className={`flex w-full items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-100/60 ${sizeByPlacement[placement]}`}
      >
        <span className="select-none text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          Advertisement
        </span>
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
