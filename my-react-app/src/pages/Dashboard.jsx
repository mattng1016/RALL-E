import { useNavigate } from 'react-router-dom'
import { signOut, useAuth } from '../lib/auth'

const sessions = [['Tennis', 'Kitsilano Courts', 'Today · 6:30 PM'], ['Badminton', 'Riley Park', 'Tomorrow · 7:00 PM'], ['Pickleball', 'Granville Island', 'Saturday · 10:00 AM']]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Player'
  async function handleSignOut() { await signOut(); navigate('/login', { replace: true }) }
  return <main className="dashboard"><nav className="dashboard-nav"><div className="wordmark">RALL<span>-E</span></div><div className="account"><div className="avatar">{name[0].toUpperCase()}</div><div><strong>{name}</strong><small>{user.email}</small></div><button className="sign-out" onClick={handleSignOut}>Log out</button></div></nav><section className="dashboard-main"><p className="eyebrow">Your local court</p><h1>Ready for your next rally?</h1><p>Here are a few games happening near you. This protected dashboard is only available to signed-in players.</p><div className="session-grid">{sessions.map(([sport, place, time]) => <article className="session-card" key={place}><span>{sport}</span><h2>{place}</h2><p>{time}</p></article>)}</div></section></main>
}
