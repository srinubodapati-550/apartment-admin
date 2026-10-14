import { useState } from 'react'
import { supabase } from './supabaseClient'
import './Login.css'

function Login({ onLogin, onForgotPassword }) {
  const [loginMethod, setLoginMethod] = useState('email')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // --------------------------------------------------
  // Get and validate admin profile
  // --------------------------------------------------

  async function completeLogin(user) {
    const {
      data: userProfile,
      error: profileError
    } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role, status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      setError(profileError.message)

      await supabase.auth.signOut()

      return false
    }

    if (userProfile.status !== 'ACTIVE') {
      setError(
        'Your account is inactive. Please contact the administrator.'
      )

      await supabase.auth.signOut()

      return false
    }

    if (userProfile.role !== 'ADMIN') {
      setError(
        'Access denied. This portal is for administrators only.'
      )

      await supabase.auth.signOut()

      return false
    }

    onLogin(userProfile)

    return true
  }

  // --------------------------------------------------
  // Email + Password Login
  // --------------------------------------------------

  async function handleEmailLogin(e) {
    e.preventDefault()

    setError('')
    setLoading(true)

    const {
      data,
      error: loginError
    } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Unable to sign in. Please try again.')
      setLoading(false)
      return
    }

    await completeLogin(data.user)

    setLoading(false)
  }

  // --------------------------------------------------
  // Send Phone OTP
  // --------------------------------------------------

  async function handleSendOtp(e) {
    e.preventDefault()

    setError('')

    const cleanPhone = phone.trim()

    if (!cleanPhone) {
      setError('Please enter your phone number.')
      return
    }

    setLoading(true)

    const {
      error: otpError
    } = await supabase.auth.signInWithOtp({
      phone: cleanPhone
    })

    if (otpError) {
      setError(otpError.message)
      setLoading(false)
      return
    }

    setOtpSent(true)
    setLoading(false)
  }

  // --------------------------------------------------
  // Verify Phone OTP
  // --------------------------------------------------

  async function handleVerifyOtp(e) {
    e.preventDefault()

    setError('')

    if (!otp.trim()) {
      setError('Please enter the OTP.')
      return
    }

    setLoading(true)

    const {
      data,
      error: verifyError
    } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: 'sms'
    })

    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('OTP verification failed. Please try again.')
      setLoading(false)
      return
    }

    await completeLogin(data.user)

    setLoading(false)
  }

  // --------------------------------------------------
  // Switch login method
  // --------------------------------------------------

  function switchLoginMethod(method) {
    setLoginMethod(method)

    setError('')
    setOtp('')
    setOtpSent(false)
  }

  return (
    <div className="login-page">

      <div className="login-brand">

        <div className="brand-icon">
          🏢
        </div>

        <h1>
          Apartment Management
        </h1>

        <p>
          Smart • Simple • Transparent
        </p>

      </div>


      <div className="login-card">

        <div className="login-header">

          <h2>
            Admin Portal
          </h2>

          <p>
            Sign in to manage your apartment community
          </p>

        </div>


        {/* ----------------------------------------- */}
        {/* Login Method Switch                       */}
        {/* ----------------------------------------- */}

        <div className="login-methods">

          <button
            type="button"
            className={
              loginMethod === 'email'
                ? 'login-method active'
                : 'login-method'
            }
            onClick={() => switchLoginMethod('email')}
          >
            Email & Password
          </button>

          <button
            type="button"
            className={
              loginMethod === 'phone'
                ? 'login-method active'
                : 'login-method'
            }
            onClick={() => switchLoginMethod('phone')}
          >
            Phone OTP
          </button>

        </div>


        {/* ----------------------------------------- */}
        {/* EMAIL LOGIN                               */}
        {/* ----------------------------------------- */}

        {loginMethod === 'email' && (

          <form onSubmit={handleEmailLogin}>

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
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
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
              {loading
                ? 'Signing in...'
                : 'Sign In'}
            </button>

          </form>

        )}


        {/* ----------------------------------------- */}
        {/* PHONE OTP LOGIN                           */}
        {/* ----------------------------------------- */}

        {loginMethod === 'phone' && (

          <form
            onSubmit={
              otpSent
                ? handleVerifyOtp
                : handleSendOtp
            }
          >

            {!otpSent && (

              <div className="form-group">

                <label htmlFor="phone">
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                  required
                />

                <small>
                  Enter your phone number with country code.
                </small>

              </div>

            )}


            {otpSent && (

              <>

                <div className="otp-message">

                  OTP sent to

                  <strong>
                    {phone}
                  </strong>

                </div>


                <div className="form-group">

                  <label htmlFor="otp">
                    Enter OTP
                  </label>

                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6)
                      )
                    }
                    placeholder="Enter 6-digit OTP"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength="6"
                    required
                  />

                </div>


                <button
                  type="button"
                  className="change-phone-button"
                  onClick={() => {
                    setOtpSent(false)
                    setOtp('')
                    setError('')
                  }}
                >
                  Change phone number
                </button>

              </>

            )}


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
              {loading
                ? otpSent
                  ? 'Verifying...'
                  : 'Sending OTP...'
                : otpSent
                  ? 'Verify OTP'
                  : 'Send OTP'}
            </button>

          </form>

        )}


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