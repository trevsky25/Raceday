import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// Demo-phase auth: entering an email signs you straight in — a real Supabase
// account is created behind the scenes with a derived password, so sessions,
// RLS, and cross-device re-login all work with zero emails sent. Swap back to
// verified magic links / OTP once custom SMTP (Resend) is configured.
const demoPassword = (email: string) => `raceday-grid::${email}::v1`

export default function SignIn() {
  const { session } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  if (session) {
    return <Navigate to={params.get('next') ?? '/enter'} replace />
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const em = email.trim().toLowerCase()
    if (!em) return
    setWorking(true)
    setError(null)

    // Returning player: sign straight in
    let { error: err } = await supabase.auth.signInWithPassword({
      email: em,
      password: demoPassword(em),
    })
    // New player: create the account on the spot (no confirmation email)
    if (err && /invalid login credentials/i.test(err.message)) {
      const res = await supabase.auth.signUp({
        email: em,
        password: demoPassword(em),
      })
      err = res.error
    }

    setWorking(false)
    if (err) setError(err.message)
  }

  return (
    <div className="max-w-md mx-auto pt-8">
      <h1 className="display-head text-4xl mb-2">
        Sign <span className="text-caution">in</span>
      </h1>
      <p className="text-asphalt-400 mb-8">
        No passwords, no waiting on emails. Enter your email and you're on the
        grid — use the same one to come back to your entries anytime.
      </p>

      <div className="space-y-4">
        <form onSubmit={submit} className="card p-6 space-y-4">
          <label className="block">
            <span className="font-condensed uppercase tracking-widest text-xs text-asphalt-400">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-dark mt-1"
              autoComplete="email"
            />
          </label>
          {error && <p className="text-penalty text-sm">{error}</p>}
          <button
            type="submit"
            disabled={working}
            className="btn-caution w-full disabled:opacity-50"
          >
            {working ? 'Rolling out…' : 'Get On the Grid'}
          </button>
        </form>
      </div>
    </div>
  )
}
