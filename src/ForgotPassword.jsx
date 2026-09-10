import { useState } from 'react'
import { supabase } from './supabaseClient'
import './Login.css'

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`
      }
    )

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage(
      'If an account exists with this email, a password reset link has been sent.'
    )

    setLoading(false)
  }

  return (
    <div className="login-page">

      <div className="login-brand">
        <div className="brand-icon">🏢</div>

        <h1>Apartment Management</h1>

        <p>Smart • Simple • Transparent</p>
      </div>


      <div className="login-card">

        <div className="login-header">

          <h2>Reset Password</h2>

          <p>
            Enter your email address and we'll send you a password reset link.
          </p>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

          </div>


          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          {message && (
            <div className="login-success">
              {message}
            </div>
          )}


          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Sending...'
              : 'Send Reset Link'}
          </button>

        </form>


        <div className="back-to-login">

          <button
            type="button"
            onClick={onBack}
          >
            ← Back to Sign In
          </button>

        </div>

      </div>

    </div>
  )
}

export default ForgotPassword