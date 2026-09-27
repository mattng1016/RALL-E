import BrandLogo from '../components/BrandLogo'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../lib/auth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readableAuthError(error, mode) {
  const message = error.message?.toLowerCase() ?? ''
  if (message.includes('invalid login credentials')) return 'That email or password is incorrect.'
  if (message.includes('email not confirmed')) return 'Confirm your email first: check your inbox for the link, then log in.'
  if (message.includes('already registered') || message.includes('already been registered'))
    return 'An account with that email already exists. Try logging in instead.'
  if (message.includes('error sending confirmation email'))
    return 'Supabase could not send the confirmation email. Check Authentication → Providers → Email in your Supabase project.'
  if (message.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.'
  if (message.includes('password')) return 'Your password does not meet the security requirements. Use at least 8 characters.'
  if (message.includes('email')) return 'Please enter a valid email address.'
  if (message.includes('not configured')) return error.message
  return mode === 'login' ? 'We could not log you in. Please try again.' : 'We could not create your account. Please try again.'
}

function Field({ id, label, type = 'text', ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} {...props} />
    </div>
  )
}

function Confirmation() {
  return (
    <div className="notice">
      <h2>Check your inbox</h2>
      <p>We sent a confirmation link to your email. Confirm your account, then come back to log in.</p>
      <p>
        <Link className="text-link" to="/login">
          Back to log in
        </Link>
      </p>
    </div>
  )
}

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (isSignup && !form.name.trim()) return setError('Please enter your name.')
    if (!form.email.trim()) return setError('Please enter your email address.')
    if (!emailPattern.test(form.email.trim())) return setError('Please enter a valid email address.')
    if (!form.password) return setError('Please enter your password.')
    if (isSignup && form.password.length < 8) return setError('Use a password with at least 8 characters.')
    if (isSignup && form.password !== form.confirmPassword) return setError('Your passwords do not match.')

    setSubmitting(true)
    try {
      if (isSignup) {
        const session = await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password })
        if (!session) {
          setNotice(true)
          return
        }
      } else {
        await signIn(form.email.trim(), form.password)
      }
      navigate('/', { replace: true })
    } catch (authError) {
      setError(readableAuthError(authError, mode))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel" aria-label="About RALL-E">
        <div className="wordmark">
          <BrandLogo reverse />
        </div>
        <div className="brand-copy">
          <p className="eyebrow">Find your next game</p>
          <h1>More play. More people.</h1>
          <p>Meet local players, join a match, and turn an open court into your new favourite crew.</p>
          <div className="rally-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <section className="form-panel">
        <div className="auth-card">
          {notice ? (
            <Confirmation />
          ) : (
            <>
              <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
              <p>{isSignup ? 'Start finding people to play with in minutes.' : 'Log in to find your next rally.'}</p>
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {isSignup && <Field id="name" label="Name" value={form.name} onChange={update('name')} autoComplete="name" />}
                <Field id="email" label="Email" type="email" value={form.email} onChange={update('email')} autoComplete="email" />
                <div className="field">
                  <label htmlFor="password">Password</label>
                  <div className="password-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={update('password')}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      aria-invalid={Boolean(error)}
                    />
                    <button className="toggle-password" type="button" onClick={() => setShowPassword((show) => !show)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                {isSignup && (
                  <>
                    <p className="hint">Use at least 8 characters.</p>
                    <Field
                      id="confirm-password"
                      label="Confirm password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={update('confirmPassword')}
                      autoComplete="new-password"
                    />
                  </>
                )}
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="primary-button" disabled={submitting} type="submit">
                  {submitting ? (isSignup ? 'Creating account…' : 'Logging in…') : isSignup ? 'Create account' : 'Log in'}
                </button>
              </form>
              <p className="switch-copy">
                {isSignup ? 'Already have an account?' : 'New to RALL-E?'}{' '}
                <Link className="text-link" to={isSignup ? '/login' : '/signup'}>
                  {isSignup ? 'Log in' : 'Create an account'}
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
