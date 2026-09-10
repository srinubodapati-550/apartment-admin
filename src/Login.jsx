import { useState } from 'react'
import { supabase } from './supabaseClient'
import './Login.css'

function Login({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  async function handleLogin(e) {
    e.preventDefault()

    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: userProfile, error: profileError } =
      await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('id', data.user.id)
        .single()

    if (profileError) {
      setError(profileError.message)
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (userProfile.role !== 'ADMIN') {
      setError(
        'Access denied. This portal is for administrators only.'
      )
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    onLogin(userProfile)
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
          <h2>Admin Portal</h2>

          <p>
            Sign in to manage your apartment community
          </p>
        </div>


        <form onSubmit={handleLogin}>

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
              autoComplete="email"
              required
            />

          </div>


          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>
            <div className="password-wrapper">

            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
               {showPassword ? 'Hide' : 'Show'}
            </button>
            </div>
          </div>
          
          <div className="forgot-password">

          <button
          type="button"
          onClick={onForgotPassword}
          >
           Forgot Password?
           </button>

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>


        <div className="login-security">
          🔒 Secure administrator access
        </div>

      </div>


      <div className="login-footer">
        Apartment Management System
      </div>

    </div>
  )
}

export default Login