import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCurrentUser, getOwnProfileDetails, getOwnProfileSports, getUserProfile, saveOwnProfileDetails, saveOwnProfileSports, saveUser, uploadCoachCertificate } from '../lib/api'
import { useAuth } from '../lib/auth'
import { PROFILE_SPORTS, SPORT_SKILL_LEVELS, SPORT_EMOJI, SPORTS } from '../lib/constants'
import { capitalize } from '../lib/format'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P'
}

const EMPTY_DETAILS = {
  sex: '', age: '', sex_public: false, age_public: false,
  is_coach: false, coach_public: false, coach_certificate_path: null,
}

function legacyLevel(skillLevel) {
  if (skillLevel === 'Intermediate') return 'intermediate'
  if (skillLevel === 'Advanced' || skillLevel === 'Competitive') return 'advanced'
  return 'beginner'
}

function initialSports(user) {
  return user ? [{ sport: user.sport, skill_level: user.level === 'beginner' ? 'Just starting' : user.level === 'intermediate' ? 'Intermediate' : 'Advanced' }] : []
}

function VisibilityToggle({ label, checked, onChange, disabled = false }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="accent-emerald-700 disabled:opacity-50" />
      Show {label} publicly
    </label>
  )
}

export default function Profile() {
  const { id: profileId } = useParams()
  const { refreshProfile } = useAuth()
  const currentUser = getCurrentUser()
  const [profile, setProfile] = useState(() => currentUser)
  const [publicProfile, setPublicProfile] = useState({ id: null, data: null, error: '' })
  const isOwnProfile = !profileId || profileId === currentUser?.id
  const displayedProfile = isOwnProfile ? profile : publicProfile.id === profileId ? publicProfile.data : null
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => {
    const current = getCurrentUser()
    return { name: current?.name ?? '', bio: current?.bio ?? '' }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [ownDetails, setOwnDetails] = useState(EMPTY_DETAILS)
  const [draftDetails, setDraftDetails] = useState(EMPTY_DETAILS)
  const [certificateFile, setCertificateFile] = useState(null)
  const [ownSports, setOwnSports] = useState(() => initialSports(currentUser))
  const [draftSports, setDraftSports] = useState(() => initialSports(currentUser))
  const [sportSearch, setSportSearch] = useState('')
  const [sportsMenuOpen, setSportsMenuOpen] = useState(false)
  const visibleSports = isOwnProfile ? ownSports : displayedProfile?.sports ?? initialSports(displayedProfile)
  const hasVisibleDetails = isOwnProfile
    ? Boolean(ownDetails.sex || ownDetails.age || ownDetails.is_coach)
    : Boolean(displayedProfile?.sex || displayedProfile?.age || displayedProfile?.is_coach)

  useEffect(() => {
    if (!isOwnProfile || !currentUser?.id) return undefined
    let active = true
    Promise.all([getOwnProfileDetails(currentUser.id), getOwnProfileSports(currentUser.id)])
      .then(([details, sports]) => {
        if (active) {
          setOwnDetails({ ...EMPTY_DETAILS, ...details, age: details.age ?? '' })
          setOwnSports(sports)
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load your private profile details.')
      })
    return () => { active = false }
  }, [currentUser?.id, isOwnProfile])

  useEffect(() => {
    if (!profileId) return undefined
    let active = true
    getUserProfile(profileId)
      .then((data) => {
        if (active) setPublicProfile({ id: profileId, data, error: data ? '' : 'This player profile could not be found.' })
      })
      .catch((err) => {
        if (active) setPublicProfile({ id: profileId, data: null, error: err.message || 'Could not load this player profile.' })
      })
    return () => { active = false }
  }, [profileId])

  function startEditing() {
    setDraft({ name: displayedProfile.name, bio: displayedProfile.bio ?? '' })
    setDraftDetails({ ...EMPTY_DETAILS, ...ownDetails, age: ownDetails.age ?? '' })
    setDraftSports([...ownSports])
    setSportSearch('')
    setSportsMenuOpen(false)
    setCertificateFile(null)
    setError('')
    setSaved(false)
    setEditing(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const age = draftDetails.age === '' ? null : Number(draftDetails.age)
      if (age !== null && (!Number.isInteger(age) || age < 13 || age > 120)) throw new Error('Enter an age between 13 and 120, or leave it blank.')
      if (!draftSports.length) throw new Error('Choose at least one sport you play.')
      // The legacy session preference only accepts sports that can currently be played
      // in the app. Preserve it when someone only adds profile interests like climbing.
      const primarySport = draftSports.find((entry) => SPORTS.includes(entry.sport))
        ?? { sport: displayedProfile.sport, skill_level: displayedProfile.level === 'intermediate' ? 'Intermediate' : displayedProfile.level === 'advanced' ? 'Advanced' : 'Just starting' }
      const updated = await saveUser({ id: displayedProfile.id, ...draft, sport: primarySport.sport, level: legacyLevel(primarySport.skill_level) })
      await saveOwnProfileSports(displayedProfile.id, draftSports)
      const certificatePath = certificateFile
        ? await uploadCoachCertificate(displayedProfile.id, certificateFile)
        : draftDetails.coach_certificate_path || null
      const details = {
        sex: draftDetails.sex.trim() || null,
        age,
        sex_public: Boolean(draftDetails.sex_public),
        age_public: Boolean(draftDetails.age_public),
        is_coach: Boolean(draftDetails.is_coach),
        coach_public: Boolean(draftDetails.coach_public),
        coach_certificate_path: certificatePath,
      }
      await saveOwnProfileDetails(displayedProfile.id, details)
      const refreshed = await refreshProfile()
      setProfile(refreshed ?? updated)
      setOwnDetails({ ...details, age: details.age ?? '' })
      setOwnSports(draftSports)
      setCertificateFile(null)
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!displayedProfile) return <p className={`p-6 ${publicProfile.error ? 'text-red-600' : 'text-slate-500'}`}>{profileId && publicProfile.id === profileId && publicProfile.error ? publicProfile.error : 'Loading profile…'}</p>

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-8">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <p className="text-sm font-semibold text-[#50A5B1]">PLAYER PROFILE</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{isOwnProfile ? 'My profile' : `${displayedProfile.name}'s profile`}</h1>
          </div>
          {isOwnProfile && !editing && (
            <button type="button" onClick={startEditing} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Edit profile
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
            <label className="block space-y-1.5">
              <span className="text-base font-semibold text-slate-800">Name</span>
              <input
                required
                maxLength={60}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              />
            </label>

            <fieldset className="space-y-3">
              <legend className="sr-only">Sports you’re interested in</legend>
              <div className="flex min-h-10 items-center justify-between gap-3">
                <span className="text-base font-semibold text-slate-800">Sports you’re interested in</span>
                <button
                  type="button"
                  aria-expanded={sportsMenuOpen}
                  onClick={() => setSportsMenuOpen((value) => !value)}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {sportsMenuOpen ? 'Done' : 'Add sports'}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{draftSports.length}</span>
                </button>
              </div>
              {sportsMenuOpen && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <input
                    type="search"
                    value={sportSearch}
                    onChange={(event) => setSportSearch(event.target.value)}
                    placeholder="Search sports…"
                    aria-label="Search sports"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                  <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
                    {PROFILE_SPORTS.filter((item) => item.label.toLowerCase().includes(sportSearch.trim().toLowerCase())).map((item) => {
                      const selected = draftSports.some((entry) => entry.sport === item.id)
                      return (
                        <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => setDraftSports((current) => event.target.checked
                              ? [...current, { sport: item.id, skill_level: 'Just starting' }]
                              : current.filter((entry) => entry.sport !== item.id))}
                            className="accent-emerald-700"
                          />
                          <span aria-hidden="true">{item.icon}</span>
                          {item.label}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
              {draftSports.length === 0 && <p className="text-sm text-amber-700">Choose at least one sport.</p>}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {draftSports.map((entry) => {
                  const sport = PROFILE_SPORTS.find((item) => item.id === entry.sport)
                  return (
                    <div key={entry.sport} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800"><span className="mr-2" aria-hidden="true">{sport?.icon ?? SPORT_EMOJI[entry.sport] ?? '🏅'}</span>{sport?.label ?? capitalize(entry.sport)}</span>
                      <label className="sr-only" htmlFor={`skill-${entry.sport}`}>{sport?.label ?? capitalize(entry.sport)} skill level</label>
                        <select
                          id={`skill-${entry.sport}`}
                          value={entry.skill_level}
                          onChange={(event) => setDraftSports((current) => current.map((item) => item.sport === entry.sport ? { ...item, skill_level: event.target.value } : item))}
                          className="w-32 shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
                        >
                          {SPORT_SKILL_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                        </select>
                      <button type="button" onClick={() => setDraftSports((current) => current.filter((item) => item.sport !== entry.sport))} aria-label={`Remove ${sport?.label ?? entry.sport}`} className="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800">×</button>
                    </div>
                  )
                })}
              </div>
            </fieldset>

            <label className="block space-y-1.5">
              <span className="text-base font-semibold text-slate-800">Short bio <span className="text-sm font-normal text-slate-400">(optional)</span></span>
              <textarea
                maxLength={160}
                rows={3}
                value={draft.bio}
                onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
                placeholder="What do you enjoy about playing?"
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              />
              <span className="block text-right text-xs text-slate-400">{draft.bio.length}/160</span>
            </label>

            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
              <div className="grid grid-rows-[1.25rem_2.75rem_1.25rem] gap-y-2">
                <label htmlFor="profile-sex" className="text-sm font-medium leading-5 text-slate-700">Sex <span className="font-normal text-slate-400">(optional)</span></label>
                <select
                  id="profile-sex"
                  value={draftDetails.sex ?? ''}
                  onChange={(event) => setDraftDetails((current) => ({ ...current, sex: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 focus:border-slate-500 focus:outline-none"
                >
                  <option value="">—</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Intersex">Intersex</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <div className="flex min-h-5 items-center"><VisibilityToggle label="sex" checked={Boolean(draftDetails.sex_public)} disabled={!draftDetails.sex} onChange={(sex_public) => setDraftDetails((current) => ({ ...current, sex_public }))} /></div>
              </div>

              <div className="grid grid-rows-[1.25rem_2.75rem_1.25rem] gap-y-2">
                <label htmlFor="profile-age" className="text-sm font-medium leading-5 text-slate-700">Age <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  id="profile-age"
                  type="number"
                  min="13"
                  max="120"
                  value={draftDetails.age ?? ''}
                  onChange={(event) => setDraftDetails((current) => ({ ...current, age: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-slate-500 focus:outline-none"
                />
                <div className="flex min-h-5 items-center"><VisibilityToggle label="age" checked={Boolean(draftDetails.age_public)} disabled={!draftDetails.age} onChange={(age_public) => setDraftDetails((current) => ({ ...current, age_public }))} /></div>
              </div>
            </div>

            <section className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex min-h-8 items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-800">Coach</h3>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={Boolean(draftDetails.is_coach)} onChange={(event) => { setDraftDetails((current) => ({ ...current, is_coach: event.target.checked })); if (!event.target.checked) setCertificateFile(null) }} className="accent-emerald-700" />
                  I’m a coach
                </label>
              </div>
              {draftDetails.is_coach && (
                <>
                  <VisibilityToggle label="coach status" checked={Boolean(draftDetails.coach_public)} onChange={(coach_public) => setDraftDetails((current) => ({ ...current, coach_public }))} />
                  <label className="block space-y-1.5">
                    <span className="block text-sm font-medium text-slate-700">Coach certificate <span className="font-normal text-slate-400">(optional, private)</span></span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        if (file && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                          setError('Choose a PDF, JPEG, or PNG certificate file.')
                          event.target.value = ''
                          return
                        }
                        if (file && file.size > 10 * 1024 * 1024) {
                          setError('Certificate files must be 10 MB or smaller.')
                          event.target.value = ''
                          return
                        }
                        setError('')
                        setCertificateFile(file)
                      }}
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                    />
                    <span className="block text-xs text-slate-500">PDF, JPEG, or PNG, up to 10 MB. Only you and project admins can access this file.</span>
                    {(certificateFile || draftDetails.coach_certificate_path) && <span className="block text-xs font-medium text-emerald-700">{certificateFile?.name ?? 'Certificate saved privately'}</span>}
                  </label>
                </>
              )}
            </section>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => { setEditing(false); setError('') }} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={saving || !draft.name.trim() || draftSports.length === 0} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 p-5 sm:p-7">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#1A265A] text-xl font-bold text-[#97FB57] sm:h-20 sm:w-20 sm:text-2xl" aria-hidden="true">
                {initials(displayedProfile.name)}
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{displayedProfile.name}</h2>
                  {(isOwnProfile ? ownDetails.is_coach : displayedProfile.is_coach) && <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Coach</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {visibleSports.map((entry) => {
                    const sport = PROFILE_SPORTS.find((item) => item.id === entry.sport)
                    return <span key={entry.sport} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"><span aria-hidden="true">{sport?.icon ?? SPORT_EMOJI[entry.sport] ?? '🏅'}</span> {sport?.label ?? capitalize(entry.sport)} <span className="text-slate-500">· {entry.skill_level}</span></span>
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {hasVisibleDetails && (
                <dl className="grid grid-cols-2 content-start gap-x-5 gap-y-4 rounded-2xl bg-slate-50 p-4 sm:p-5">
                  {(isOwnProfile ? ownDetails.sex : displayedProfile.sex) && <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Sex{isOwnProfile ? ` · ${ownDetails.sex_public ? 'Public' : 'Private'}` : ''}</dt><dd className="mt-1 text-base font-semibold text-slate-800">{isOwnProfile ? ownDetails.sex : displayedProfile.sex}</dd></div>}
                  {(isOwnProfile ? ownDetails.age : displayedProfile.age) && <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Age{isOwnProfile ? ` · ${ownDetails.age_public ? 'Public' : 'Private'}` : ''}</dt><dd className="mt-1 text-base font-semibold text-slate-800">{isOwnProfile ? ownDetails.age : displayedProfile.age}</dd></div>}
                  {isOwnProfile && ownDetails.is_coach && <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Coach status</dt><dd className="mt-1 text-base font-semibold text-slate-800">{ownDetails.coach_public ? 'Public' : 'Private'}</dd></div>}
                </dl>
              )}
              <section className={`rounded-2xl bg-slate-50 p-4 sm:p-5 ${hasVisibleDetails ? '' : 'lg:col-span-2'}`}>
                <h3 className="text-sm font-semibold text-slate-800">About</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{displayedProfile.bio?.trim() || (isOwnProfile ? 'Add a short bio to introduce yourself to other players.' : 'No bio added yet.')}</p>
              </section>
            </div>

            {isOwnProfile && <p className="text-xs leading-relaxed text-slate-500">Your name, sports, skill ratings, and bio are public. Sex, age, and coach status are private unless you choose to show them. Certificates stay private.</p>}
            {isOwnProfile && saved && <p role="status" className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800"><span aria-hidden="true">✓</span> Profile saved</p>}
          </div>
        )}
      </section>
    </div>
  )
}
