/**
 * Build a WhatsApp "click-to-chat" deep link (https://wa.me/<number>).
 *
 * wa.me expects a full international number with digits only — no "+",
 * spaces, or dashes. We strip everything that isn't a digit. A leading "0"
 * (local trunk prefix, e.g. Indonesian "0812…") can't be auto-converted to a
 * country code, so runners should enter the number in international form.
 *
 * Returns null when there's no usable number, so callers can hide the button.
 */
export function whatsappUrl(rawNumber: string | null | undefined, prefillText?: string): string | null {
  const digits = (rawNumber ?? '').replace(/\D/g, '')
  if (!digits) return null
  const base = `https://wa.me/${digits}`
  return prefillText ? `${base}?text=${encodeURIComponent(prefillText)}` : base
}
