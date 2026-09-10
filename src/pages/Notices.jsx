import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Notices.css'

function Notices() {

  const [loading, setLoading] = useState(true)

  const [notices, setNotices] = useState([])

  const [searchText, setSearchText] = useState('')

  const [selectedPriority, setSelectedPriority] =
    useState('ALL')

  const [selectedStatus, setSelectedStatus] =
    useState('ALL')


  useEffect(() => {

    loadNotices()

  }, [])


  async function loadNotices() {

    setLoading(true)

    const { data, error } = await supabase
      .from('notices')
      .select(`
        id,
        title,
        description,
        priority,
        published_by,
        published_at,
        expiry_date,
        status,
        created_at,
        updated_at
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      )


    if (error) {

      console.error(
        'Error loading notices:',
        error
      )

      alert(
        `Unable to load notices: ${error.message}`
      )

      setLoading(false)

      return

    }


    setNotices(data || [])

    setLoading(false)

  }


  function formatDate(date) {

    if (!date) {
      return '-'
    }

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    )

  }


  function getNoticeStatus(notice) {

    if (
      notice.status === 'DRAFT'
    ) {
      return 'DRAFT'
    }


    if (
      notice.expiry_date &&
      new Date(notice.expiry_date) <
      new Date()
    ) {
      return 'EXPIRED'
    }


    return notice.status || 'ACTIVE'

  }


  const filteredNotices =
    notices.filter((notice) => {

      const search =
        searchText
          .trim()
          .toLowerCase()


      const searchMatch =
        !search ||
        notice.title
          ?.toLowerCase()
          .includes(search) ||
        notice.description
          ?.toLowerCase()
          .includes(search)


      const priorityMatch =
        selectedPriority === 'ALL' ||
        notice.priority === selectedPriority


      const statusMatch =
        selectedStatus === 'ALL' ||
        getNoticeStatus(notice) === selectedStatus


      return (
        searchMatch &&
        priorityMatch &&
        statusMatch
      )

    })


  const totalNotices =
    notices.length


  const activeNotices =
    notices.filter(
      (notice) =>
        getNoticeStatus(notice) === 'ACTIVE'
    ).length


  const draftNotices =
    notices.filter(
      (notice) =>
        getNoticeStatus(notice) === 'DRAFT'
    ).length


  const expiredNotices =
    notices.filter(
      (notice) =>
        getNoticeStatus(notice) === 'EXPIRED'
    ).length


  return (

    <div className="notices-page">


      {/* PAGE HEADER */}

      <div className="page-title-section">

        <div>

          <h2>
            Notices
          </h2>

          <p>
            Manage society announcements and communications.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={() =>
            alert(
              'Create Notice will be added in Step 24.6B.'
            )
          }
        >
          + Create Notice
        </button>

      </div>


      {/* SUMMARY CARDS */}

      <div className="notices-summary">


        <div className="summary-card">

          <span>
            Total Notices
          </span>

          <strong>
            {totalNotices}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Active
          </span>

          <strong>
            {activeNotices}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Draft
          </span>

          <strong>
            {draftNotices}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Expired
          </span>

          <strong>
            {expiredNotices}
          </strong>

        </div>


      </div>


      {/* NOTICES SECTION */}

      <div className="notices-section">


        <div className="notices-section-header">

          <div>

            <h3>
              All Notices
            </h3>

            <p>
              View and manage society announcements.
            </p>

          </div>


          {/* FILTERS */}

          <div className="notices-filters">


            <input
              type="text"
              placeholder="🔍 Search notices..."
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
            />


            <select
              value={selectedPriority}
              onChange={(event) =>
                setSelectedPriority(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                All Priorities
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="NORMAL">
                Normal
              </option>

            </select>


            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="DRAFT">
                Draft
              </option>

              <option value="EXPIRED">
                Expired
              </option>

            </select>


          </div>

        </div>


        {/* CONTENT */}

        {

          loading ? (

            <div className="empty-state">

              Loading notices...

            </div>

          ) : filteredNotices.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                📢
              </div>

              <h3>
                No notices found
              </h3>

              <p>
                No notices match the selected filters.
              </p>

            </div>

          ) : (

            <div className="notices-table-wrapper">

              <table className="notices-table">

                <thead>

                  <tr>

                    <th>
                      Notice
                    </th>

                    <th>
                      Priority
                    </th>

                    <th>
                      Published
                    </th>

                    <th>
                      Expiry
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {

                    filteredNotices.map(
                      (notice) => {

                        const status =
                          getNoticeStatus(
                            notice
                          )


                        return (

                          <tr
                            key={notice.id}
                          >

                            {/* NOTICE */}

                            <td>

                              <div className="notice-title">

                                <strong>
                                  {notice.title}
                                </strong>

                                {

                                  notice.description && (

                                    <span>

                                      {
                                        notice.description
                                          .length > 80
                                          ? `${notice.description.substring(0, 80)}...`
                                          : notice.description
                                      }

                                    </span>

                                  )

                                }

                              </div>

                            </td>


                            {/* PRIORITY */}

                            <td>

                              <span
                                className={
                                  `notice-priority ${(
                                    notice.priority ||
                                    'NORMAL'
                                  ).toLowerCase()}`
                                }
                              >

                                {notice.priority || 'NORMAL'}

                              </span>

                            </td>


                            {/* PUBLISHED */}

                            <td>

                              {formatDate(
                                notice.published_at
                              )}

                            </td>


                            {/* EXPIRY */}

                            <td>

                              {formatDate(
                                notice.expiry_date
                              )}

                            </td>


                            {/* STATUS */}

                            <td>

                              <span
                                className={
                                  `notice-status ${status.toLowerCase()}`
                                }
                              >

                                {status}

                              </span>

                            </td>


                            {/* ACTION */}

                            <td>

                              <button
                                className="view-notice-button"
                                onClick={() =>
                                  alert(
                                    'View/Edit will be added in the next step.'
                                  )
                                }
                              >
                                👁️ View
                              </button>

                            </td>


                          </tr>

                        )

                      }

                    )

                  }

                </tbody>

              </table>

            </div>

          )

        }


      </div>


    </div>

  )

}


export default Notices