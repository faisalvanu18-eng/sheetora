type AdPlacement = 'top' | 'middle' | 'bottom' | 'converter'

interface AdSlotProps {
  placement?: AdPlacement
  className?: string
}

/**
 * Ad placement is handled by Google AdSense **Auto ads**.
 *
 * Auto ads only requires the AdSense loader script in index.html (already
 * present). Google automatically decides where to place ads by scanning the
 * page, so we intentionally do NOT render manual <ins class="adsbygoogle">
 * units here — mixing manual units with Auto ads causes crowding and can
 * breach ad-density policy.
 *
 * These components are kept as no-ops so existing page imports/usages keep
 * working without change. If you ever switch back to manual ad units, restore
 * the <ins> markup in this file.
 */
export default function AdSlot(_props: AdSlotProps) {
  return null
}

export function AdSlotTop(_props: Omit<AdSlotProps, 'placement'>) {
  return null
}
export function AdSlotMiddle(_props: Omit<AdSlotProps, 'placement'>) {
  return null
}
export function AdSlotBottom(_props: Omit<AdSlotProps, 'placement'>) {
  return null
}
export function AdSlotConverter(_props: Omit<AdSlotProps, 'placement'>) {
  return null
}
