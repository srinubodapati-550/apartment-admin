import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Header.css'

function Header({ user }) {

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)


  /*
    =========================
    Load Notifications
  =========================
  */

  async function loadNotifications() {

    if (!user?.id) return

    setLoadingNotifications(true)

    try {

      const {
        data,
        error
      } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          notification_type,
          reference_id,
          is_read,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false
        })
        .limit(10)


      if (error) {

        console.error(
          'Notifications error:',
          error
        )

        return
      }


      setNotifications(data || [])


      const unread =
        (data || []).filter(
          notification =>
            !notification.is_read
        ).length


      setUnreadCount(unread)

    } catch (error) {

      console.error(
        'Notification loading error:',
        error
      )

    } finally {

      setLoadingNotifications(false)

    }

  }


  /*
    =========================
    Initial Load
  =========================
  */

  useEffect(() => {

    loadNotifications()

  }, [user?.id])


  /*
    =========================
    Supabase Realtime
  =========================
  */

  useEffect(() => {

    if (!user?.id) return


    const channel =
      supabase
        .channel(
          `notifications-${user.id}`
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter:
              `user_id=eq.${user.id}`
          },
          payload => {

            console.log(
              'New notification:',
              payload.new
            )

            setNotifications(
              previous => [
                payload.new,
                ...previous
              ].slice(0, 10)
            )

            setUnreadCount(
              previous => previous + 1
            )

          }
        )
        .subscribe()


    return () => {

      supabase.removeChannel(
        channel
      )

    }

  }, [user?.id])


  /*
    =========================
    Mark One Notification Read
  =========================
  */

  async function markAsRead(
    notificationId
  ) {

    try {

      const {
        error
      } = await supabase
        .from('notifications')
        .update({
          is_read: true
        })
        .eq('id', notificationId)
        .eq('user_id', user.id)


      if (error) {

        console.error(
          'Mark notification read error:',
          error
        )

        return
      }


      setNotifications(
        previous =>
          previous.map(
            notification =>
              notification.id === notificationId
                ? {
                    ...notification,
                    is_read: true
                  }
                : notification
          )
      )


      setUnreadCount(
        previous =>
          Math.max(previous - 1, 0)
      )

    } catch (error) {

      console.error(
        'Mark notification error:',
        error
      )

    }

  }


  /*
    =========================
    Mark All Read
  =========================
  */

  async function markAllAsRead() {

    if (unreadCount === 0) return


    try {

      const {
        error
      } = await supabase
        .from('notifications')
        .update({
          is_read: true
        })
        .eq('user_id', user.id)
        .eq('is_read', false)


      if (error) {

        console.error(
          'Mark all notifications error:',
          error
        )

        return
      }


      setNotifications(
        previous =>
          previous.map(
            notification => ({
              ...notification,
              is_read: true
            })
          )
      )


      setUnreadCount(0)

    } catch (error) {

      console.error(
        'Mark all error:',
        error
      )

    }

  }


  /*
    =========================
    Time Formatting
  =========================
  */

  function formatNotificationTime(
    dateString
  ) {

    const date =
      new Date(dateString)

    const now =
      new Date()

    const difference =
      Math.floor(
        (now - date) / 1000
      )


    if (difference < 60) {
      return 'Just now'
    }


    if (difference < 3600) {

      return `${Math.floor(
        difference / 60
      )} min ago`

    }


    if (difference < 86400) {

      return `${Math.floor(
        difference / 3600
      )} hr ago`

    }


    if (difference < 604800) {

      return `${Math.floor(
        difference / 86400
      )} day ago`

    }


    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short'
      }
    )

  }


  /*
    =========================
    Notification Icon
  =========================
  */

  function getNotificationIcon(
    type
  ) {

    switch (type) {

      case 'NOTICE':
        return '📢'

      case 'COMPLAINT':
        return '⚠️'

      case 'PAYMENT':
        return '💰'

      case 'BILL':
        return '📄'

      case 'EXPENSE':
        return '💸'

      case 'MAINTENANCE':
        return '🔧'

      default:
        return '🔔'

    }

  }


  /*
    =========================
    Header
  =========================
  */

  return (

    <header className="header">


      {/* =========================
          Header Left
      ========================== */}

      <div className="header-left">

        <h1>
          Dashboard
        </h1>

        <p>
          Overview of your apartment community
        </p>

      </div>


      {/* =========================
          Header Right
      ========================== */}

      <div className="header-right">


        {/* =========================
            Notification Area
        ========================== */}

        <div className="notification-wrapper">


          <button
            className={`notification-button ${
              showNotifications
                ? 'notification-button-active'
                : ''
            }`}
            onClick={() =>
              setShowNotifications(
                previous => !previous
              )
            }
            title="Notifications"
          >

            <span className="notification-bell">
              🔔
            </span>


            {unreadCount > 0 && (

              <span className="notification-count">

                {unreadCount > 99
                  ? '99+'
                  : unreadCount}

              </span>

            )}

          </button>


          {/* =========================
              Notification Dropdown
          ========================== */}

          {showNotifications && (

            <div className="notification-dropdown">


              {/* Header */}

              <div className="notification-dropdown-header">

                <div>

                  <h3>
                    Notifications
                  </h3>

                  {unreadCount > 0 && (

                    <span>
                      {unreadCount} unread
                    </span>

                  )}

                </div>


                {unreadCount > 0 && (

                  <button
                    className="mark-all-button"
                    onClick={
                      markAllAsRead
                    }
                  >
                    Mark all as read
                  </button>

                )}

              </div>


              {/* =========================
                  Notification List
              ========================== */}

              <div className="notification-list">


                {loadingNotifications ? (

                  <div className="notification-empty">

                    Loading notifications...

                  </div>

                ) : notifications.length === 0 ? (

                  <div className="notification-empty">

                    <div className="notification-empty-icon">
                      🔔
                    </div>

                    <strong>
                      No notifications
                    </strong>

                    <span>
                      You're all caught up.
                    </span>

                  </div>

                ) : (

                  notifications.map(
                    notification => (

                      <div
                        key={
                          notification.id
                        }
                        className={`notification-item ${
                          !notification.is_read
                            ? 'notification-unread'
                            : ''
                        }`}
                        onClick={() => {

                          if (
                            !notification.is_read
                          ) {

                            markAsRead(
                              notification.id
                            )

                          }

                        }}
                      >


                        <div className="notification-item-icon">

                          {getNotificationIcon(
                            notification.notification_type
                          )}

                        </div>


                        <div className="notification-item-content">

                          <div className="notification-item-title">

                            <strong>
                              {notification.title}
                            </strong>

                            {!notification.is_read && (

                              <span className="notification-unread-dot">
                              </span>

                            )}

                          </div>


                          <p>
                            {notification.message}
                          </p>


                          <small>
                            {formatNotificationTime(
                              notification.created_at
                            )}
                          </small>

                        </div>


                      </div>

                    )
                  )

                )}

              </div>


              {/* Footer */}

              {notifications.length > 0 && (

                <div className="notification-dropdown-footer">

                  <span>
                    Showing latest 10 notifications
                  </span>

                </div>

              )}

            </div>

          )}

        </div>


        {/* =========================
            User
        ========================== */}

        <div className="header-user">

          <div className="header-avatar">

            {user?.full_name
              ? user.full_name
                  .charAt(0)
                  .toUpperCase()
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