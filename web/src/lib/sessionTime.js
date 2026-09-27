export const MIN_NOTICE_MINUTES = 30
export const MAX_DAYS_AHEAD = 60
export function earliestStart() {
  return new Date(Date.now() + MIN_NOTICE_MINUTES * 60 * 1000)
}

export function latestStart() {
  return new Date(Date.now() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000)
}

// The first full hour that still gives MIN_NOTICE_MINUTES of notice.
export function defaultStartTime() {
  const earliest = earliestStart()
  const start = new Date(earliest)
  start.setMinutes(0, 0, 0)
  if (start < earliest) start.setHours(start.getHours() + 1)
  return start
}

// Formats a Date as the local "YYYY-MM-DDTHH:mm" string that <input type="datetime-local"> expects.
export function toDateTimeLocal(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toDateInput(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatHour(hour) {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function isOnTheHour(date) {
  return date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0
}

export function startTimeError(date) {
  if (Number.isNaN(date.getTime())) return 'Pick a start time.'
  if (!isOnTheHour(date)) return 'Start times are on the hour, like 7:00 or 8:00.'
  if (date < earliestStart()) return `Pick a start time at least ${MIN_NOTICE_MINUTES} minutes from now.`
  if (date > latestStart()) return `Sessions can be scheduled up to ${MAX_DAYS_AHEAD} days ahead.`
  return null
}

// Hours from this start hour until midnight. 8 PM (20) leaves 4 hours.
export function maxHoursForStart(hour) {
  return 24 - hour
}

export function durationError(minutes, start) {
  const hours = Number(minutes) / 60
  if (!Number.isInteger(hours) || hours < 1) return 'Type a whole number of hours, at least 1.'
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return 'Pick a start time.'
  const max = maxHoursForStart(start.getHours())
  if (hours > max) {
    return max === 1
      ? 'This start time only has 1 hour left today.'
      : `This start time only has ${max} hours left today.`
  }
  return null
}

// Hours on this calendar day that still satisfy the notice window and the on-the-hour rule.
export function hourSlotsForDate(dateStr) {
  if (!dateStr) return []
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    const start = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00`)
    if (!startTimeError(start)) slots.push(hour)
  }
  return slots
}

export function hasStarted(session) {
  return new Date(session.start_time) <= new Date()
}
