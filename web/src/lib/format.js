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

export function formatDistance(from, to) {
  if (!from || !to) return null
  const radians = (degrees) => (degrees * Math.PI) / 180
  const lat1 = radians(Number(from.lat))
  const lat2 = radians(Number(to.lat))
  const deltaLat = lat2 - lat1
  const deltaLng = radians(Number(to.lng) - Number(from.lng))
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  const meters = 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m away` : `${(meters / 1000).toFixed(1)} km away`
}
