export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

/** Parse a currency-ish string ("₹1,23,456.50") into a number, or null. */
export function parseAmount(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** Format a number as a plain fixed-2 string, or empty string. */
export function toMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ''
  return n.toFixed(2)
}
