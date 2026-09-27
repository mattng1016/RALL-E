import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession, getCourts, getCurrentUser } from '../lib/api'
import { LEVELS, SPORTS } from '../lib/constants'
import { capitalize } from '../lib/format'
import {
  defaultStartTime,
  durationError,
  earliestStart,
  formatHour,
  hourSlotsForDate,
  latestStart,
  startTimeError,
  toDateInput,
} from '../lib/sessionTime'

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2'

export default function CreateSession() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [courts, setCourts] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const initialStart = defaultStartTime()
  const [date, setDate] = useState(toDateInput(initialStart))
  const [hour, setHour] = useState(initialStart.getHours())
  const [hours, setHours] = useState('1')
  const [form, setForm] = useState({
    sport: user?.sport ?? 'badminton',
    court_id: '',
    capacity: 4,
    level: user?.level ?? 'beginner',
    price: 0,
    is_coach: false,
    description: '',
  })

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    getCourts(form.sport).then((list) => {
      setCourts(list)
      setForm((prev) => ({ ...prev, court_id: list[0]?.id ?? '' }))
    })
  }, [form.sport])

  async function handleSubmit(event) {
    event.preventDefault()
    const startTime = new Date(`${date}T${String(hour).padStart(2, '0')}:00`)
    const durationMin = Number(hours) * 60
    const timeError = startTimeError(startTime) || durationError(durationMin, startTime)
    if (timeError) {
      setError(timeError)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const id = await createSession(
        {
          ...form,
          start_time: startTime.toISOString(),
          duration_min: durationMin,
          capacity: Number(form.capacity),
          price: Number(form.price),
        },
        user.id,
      )
      navigate(`/sessions/${id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold">Create a session</h1>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Sport">
            <select value={form.sport} onChange={(e) => update('sport', e.target.value)} className={inputClass}>
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {capitalize(s)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Level">
            <select value={form.level} onChange={(e) => update('level', e.target.value)} className={inputClass}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {capitalize(l)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Court">
          <select required value={form.court_id} onChange={(e) => update('court_id', e.target.value)} className={inputClass}>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date">
            <input
              required
              type="date"
              min={toDateInput(earliestStart())}
              max={toDateInput(latestStart())}
              value={date}
              onChange={(e) => {
                const nextDate = e.target.value
                const slots = hourSlotsForDate(nextDate)
                setDate(nextDate)
                setHour((current) => (slots.includes(current) ? current : (slots[0] ?? current)))
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Start time">
            <select required value={hour} onChange={(e) => setHour(Number(e.target.value))} className={inputClass}>
              {hourSlotsForDate(date).map((slot) => (
                <option key={slot} value={slot}>
                  {formatHour(slot)}
                </option>
              ))}
            </select>
          </Field>
          <p className="col-span-2 text-xs text-slate-500">On the hour, at least 30 minutes from now, up to 60 days ahead.</p>
          <Field label="How long (hours)">
            <input
              required
              type="number"
              min="1"
              max={24 - hour}
              step="1"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className={inputClass}
            />
            <span className="text-xs font-normal text-slate-500">
              Up to {24 - hour} {24 - hour === 1 ? 'hour' : 'hours'} so it ends by midnight.
            </span>
          </Field>
          <Field label="Capacity">
            <input type="number" min="2" max="20" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Price per person ($)">
            <input type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Chill doubles, rackets provided!"
            className={inputClass}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_coach} onChange={(e) => update('is_coach', e.target.checked)} />
          I'm a coach and this is a lesson
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={saving}
          className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Publishing…' : 'Publish session'}
        </button>
      </form>
    </div>
  )
}
