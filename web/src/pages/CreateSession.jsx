import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession, getCourts, getCurrentUser } from '../lib/api'
import { LEVELS, SPORTS } from '../lib/constants'
import { capitalize } from '../lib/format'

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
  const [form, setForm] = useState({
    sport: user?.sport ?? 'badminton',
    court_id: '',
    start_time: '',
    duration_min: 60,
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
    setSaving(true)
    setError(null)
    try {
      const id = await createSession(
        {
          ...form,
          start_time: new Date(form.start_time).toISOString(),
          duration_min: Number(form.duration_min),
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
          <Field label="Start time">
            <input
              required
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => update('start_time', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Duration (min)">
            <input type="number" min="30" step="30" value={form.duration_min} onChange={(e) => update('duration_min', e.target.value)} className={inputClass} />
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
