import { useState } from 'react'
import { supabase } from './supabaseClient'
import './Login.css'

function ResetPassword({ onPasswordUpdated }) {

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  async function handleSubmit(e) {

    e.preventDefault()

    setError('')


    if (password.length < 6) {

      setError(
        'Password must contain at least 6 characters.'
      )

      return
    }


    if (password !== confirmPassword) {

      setError(
        'Passwords do not match.'
      )

      return
    }


    setLoading(true)


    const { error } =
      await supabase.auth.updateUser({
        password
      })


    if (error) {

      setError(error.message)

      setLoading(false)

      return
    }


    alert(
      'Password updated successfully. Please sign in.'
    )


    await supabase.auth.signOut()

    onPasswordUpdated()
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
          Create a new password
        </p>

      </div>


      <div className="login-card">

        <div className="login-header">

          <h2>
            Set New Password
          </h2>

          <p>
            Please choose a secure new password.
          </p>

        </div>


        <form onSubmit={handleSubmit}>


          <div className="form-group">

            <label>
              New Password
            </label>


            <div className="password-wrapper">

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }

                value={password}

                onChange={(e) =>
                  setPassword(e.target.value)
                }

                placeholder="Enter new password"

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



          <div className="form-group">

            <label>
              Confirm Password
            </label>


            <input
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }

              value={confirmPassword}

              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }

              placeholder="Confirm new password"

              required
            />

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
              ? 'Updating...'
              : 'Update Password'}

          </button>


        </form>

      </div>

    </div>

  )
}

export default ResetPassword