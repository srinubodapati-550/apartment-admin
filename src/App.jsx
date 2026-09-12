import { useEffect, useState } from 'react'

import { supabase } from './supabaseClient'

import Login from './Login'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'

import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Funds from './pages/Funds'
import Bills from './pages/Bills'
import Flats from './pages/Flats'
import Notices from './pages/Notices'
import Users from './pages/Users'
import Complaints from './pages/Complaints'

import './App.css'

function App() {

  const [user, setUser] = useState(null)

  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState('login')

  const [currentPage, setCurrentPage] =  useState('dashboard')

  useEffect(() => {

    checkSession()

  }, [])

function renderPage() {

  switch (currentPage) {

    case 'dashboard':
      return <Dashboard user={user} />


    case 'flats':
      return <Flats />

    case 'users':
      return <Users />

    case 'residents':
      return <div>Residents Page</div>

    case 'payments':
      return <Bills />

    case 'expenses':
      return <div>Expenses Page</div>

    case 'funds':
      return <Funds />

    case 'notices':
      return <Notices/>

    case 'complaints':
      return <Complaints />

    default:
      return <Dashboard user={user} />
  }

}
  async function checkSession() {

    /*
      Check if this is a password reset URL
    */

    if (
      window.location.pathname ===
      '/reset-password'
    ) {

      setPage('reset-password')

      setLoading(false)

      return
    }


    const { data } =
      await supabase.auth.getSession()


    if (!data.session) {

      setLoading(false)

      return
    }


const { data: profile } =
  await supabase
    .from('users')
    .select('id, full_name, email, role, status')
    .eq('id', data.session.user.id)
    .single()

if (
  profile?.role === 'ADMIN' &&
  profile?.status === 'ACTIVE'
) {
  setUser(profile)
} else {
  await supabase.auth.signOut()
}


    setLoading(false)

  }


  if (loading) {

    return (
      <div>
        Loading...
      </div>
    )

  }


  /*
    Reset Password
  */

  if (page === 'reset-password') {

    return (

      <ResetPassword

        onPasswordUpdated={() => {

          window.history.replaceState(
            {},
            '',
            '/'
          )

          setPage('login')

        }}

      />

    )

  }


  /*
    Forgot Password
  */

  if (page === 'forgot-password') {

    return (

      <ForgotPassword

        onBack={() =>
          setPage('login')
        }

      />

    )

  }


  /*
    Login
  */

  if (!user) {

    return (

      <Login

        onLogin={setUser}

        onForgotPassword={() =>
          setPage('forgot-password')
        }

      />

    )

  }


  /*
    Dashboard
  */

  return (

  <div className="admin-layout">

<Sidebar
  user={user}
  currentPage={currentPage}
  setCurrentPage={setCurrentPage}
  onLogout={async () => {
    await supabase.auth.signOut()

    setUser(null)

    setPage('login')
  }}
/>



    <main className="admin-main">

      <Header user={user} />

      {renderPage()}

    </main>

  </div>

)

}


export default App