
import './Sidebar.css'

function Sidebar({
  user,
  onLogout,
  currentPage,
  setCurrentPage
}) {
  return (
    <aside className="sidebar">

      {/* Logo */}

      <div className="sidebar-logo">

        <div className="sidebar-logo-icon">
          🏢
        </div>

        <div>
          <h2>Apartment</h2>
          <span>Management</span>
        </div>

      </div>


      {/* Navigation */}

      <nav className="sidebar-nav">

        <p className="menu-title">
          MAIN MENU
        </p>


        {/* Dashboard */}

        <button
          className={`nav-item ${
            currentPage === 'dashboard'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentPage('dashboard')
          }
        >
          <span className="nav-icon">▣</span>
          Dashboard
        </button>


        {/* Flats */}

        <button
          className={`nav-item ${
            currentPage === 'flats'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentPage('flats')
          }
        >
          <span className="nav-icon">▢</span>
          Flats
        </button>





        {/* Finance */}

        <p className="menu-title finance-title">
          FINANCE
        </p>


        {/* Payments */}

        <button
          className={`nav-item ${
            currentPage === 'payments'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentPage('payments')
          }
        >
          <span className="nav-icon">💳</span>
          Bills & Payments
        </button>


        {/* Expenses */}

        <button
          className={`nav-item ${
            currentPage === 'expenses'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentPage('expenses')
          }
        >
          <span className="nav-icon">📉</span>
          Expenses
        </button>


        {/* Funds */}

        <button
          className={`nav-item ${
            currentPage === 'funds'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentPage('funds')
          }
        >
          <span className="nav-icon">🏦</span>
          Funds
        </button>


        {/* Management */}

        <p className="menu-title management-title">
          COMMUNICATION & COMPLAINTS
        </p>


        {/* Notices */}

        <button
          className={`nav-item ${
            currentPage === 'notices'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentPage('notices')
          }
        >
          <span className="nav-icon">📢</span>
          Notices
        </button>


        {/* Complaints */}

        <button
          className={`nav-item ${
            currentPage === 'complaints'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentPage('complaints')
          }
        >
          <span className="nav-icon">⚠️</span>
          Complaints
        </button>

        {/* User Management */}

        <p className="menu-title management-title">
          USER MANAGEMENT
        </p>

        {/* Users */}

        <button
          className={`nav-item ${
            currentPage === 'users'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setCurrentPage('users')
          }
        >
          <span className="nav-icon">👤</span>
          Users
        </button>


      </nav>


      {/* Bottom User Section */}

      <div className="sidebar-bottom">

        <div className="sidebar-user">

          <div className="user-avatar">
            {user?.full_name
              ? user.full_name.charAt(0).toUpperCase()
              : 'A'}
          </div>

          <div className="user-info">

            <strong>
              {user?.full_name || 'Admin'}
            </strong>

            <span>Administrator</span>

          </div>

        </div>


        <button
          className="logout-button"
          onClick={onLogout}
        >
          <span>🚪</span>
          Logout
        </button>

      </div>

    </aside>
  )
}

export default Sidebar

