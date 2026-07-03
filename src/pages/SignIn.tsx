import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function SignIn() {
  const { session } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  if (session) {
    return <Navigate to={params.get('next') ?? '/enter'} replace />
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setSending(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="max-w-md mx-auto pt-8">
      <h1 className="display-head text-4xl mb-2">
        Sign <span className="text-caution">in</span>
      </h1>
      <p className="text-asphalt-400 mb-8">
        No passwords here. Enter your email and we'll send you a magic link —
        click it and you're on the grid.
      </p>

      {sent ? (
        <div className="card p-6 text-center space-y-2">
          <div className="font-display text-2xl text-leader">
            Check your inbox
          </div>
          <p className="text-asphalt-400 text-sm">
            We sent a sign-in link to <span className="text-white">{email}</span>.
            It may take a minute. Check spam if it's hiding.
          </p>
        </div>
      ) : (
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
            />
          </label>
          {error && <p className="text-penalty text-sm">{error}</p>}
          <button type="submit" disabled={sending} className="btn-caution w-full disabled:opacity-50">
            {sending ? 'Sending…' : 'Send Magic Link'}
          </button>
        </form>
      )}
    </div>
  )
}
