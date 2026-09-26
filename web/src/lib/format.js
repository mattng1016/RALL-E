export function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatPrice(price) {
  return Number(price) === 0 ? 'Free' : `$${Number(price)}`
}

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
