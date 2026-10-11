import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_LOGIN } from '../utils/constants.js'
import { useAuth } from '../context/AuthContext.jsx'
import { emailOk } from '../utils/validation.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState(DEMO_LOGIN.email)
  const [password, setPassword] = useState(DEMO_LOGIN.password)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!emailOk(email)) {
      setError('Enter a valid email address.')
      return
    }
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Sign in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="admin-brand__mark login-brand-mark">
          <img src="/logo.png" alt="NexPept" />
        </div>
        <h1>Sign in</h1>
        <p>NexPept support admin — demo workspace with mock data.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" className="btn" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="hint" style={{ marginTop: 16, fontSize: 12 }}>
          Demo: {DEMO_LOGIN.email} / {DEMO_LOGIN.password}
        </p>
      </div>
    </div>
  )
}
