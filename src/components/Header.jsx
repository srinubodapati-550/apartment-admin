import './Header.css'

function Header({ user }) {

  return (

    <header className="header">

      <div className="header-left">

        <h1>
          Dashboard
        </h1>

        <p>
          Overview of your apartment community
        </p>

      </div>


      <div className="header-right">

        <button className="notification-button">

          🔔

          <span className="notification-dot"></span>

        </button>


        <div className="header-user">

          <div className="header-avatar">

            {user?.full_name
              ? user.full_name.charAt(0).toUpperCase()
              : 'A'}

          </div>


          <div>

            <strong>
              {user?.full_name || 'Admin'}
            </strong>

            <span>
              Administrator
            </span>

          </div>

        </div>

      </div>

    </header>

  )
}

export default Header