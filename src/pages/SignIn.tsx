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

  const googleSignIn = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setError(
        error.message.toLowerCase().includes('provider')
          ? 'Google sign-in is not enabled yet — use the email link below instead.'
          : error.message,
      )
    }
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
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => void googleSignIn()}
            className="w-full card px-6 py-3.5 flex items-center justify-center gap-3 hover:border-caution transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.5 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
              <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.2z" />
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.7-6c-2.1 1.4-4.7 2.2-7.5 2.2-6.3 0-11.6-4-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
            </svg>
            <span className="font-condensed uppercase tracking-widest text-sm">
              Continue with Google
            </span>
          </button>

          <div className="flex items-center gap-3 text-asphalt-400">
            <div className="flex-1 h-px bg-asphalt-700" />
            <span className="font-condensed uppercase tracking-widest text-xs">
              or email a magic link
            </span>
            <div className="flex-1 h-px bg-asphalt-700" />
          </div>

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
        </div>
      )}
    </div>
  )
}
