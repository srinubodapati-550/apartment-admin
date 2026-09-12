import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Complaints.css'

function Complaints() {
  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [selectedComplaint, setSelectedComplaint] = useState(null)

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('complaints')
      .select(`
        id,
        complaint_number,
        apartment_id,
        flat_id,
        raised_by,
        category,
        title,
        description,
        priority,
        status,
        created_at,
        updated_at,
        closed_at,
        flats (
          flat_number
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading complaints:', error)
      alert('Unable to load complaints.')
      setLoading(false)
      return
    }

    setComplaints(data || [])
    setLoading(false)
  }

  const filteredComplaints = complaints.filter((complaint) => {
    const searchText = search.toLowerCase().trim()

    const matchesSearch =
      !searchText ||
      (complaint.complaint_number || '')
        .toLowerCase()
        .includes(searchText) ||
      (complaint.title || '')
        .toLowerCase()
        .includes(searchText) ||
      (complaint.category || '')
        .toLowerCase()
        .includes(searchText) ||
      (complaint.flats?.flat_number || '')
        .toLowerCase()
        .includes(searchText)

    const matchesStatus =
      statusFilter === 'ALL' ||
      complaint.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'OPEN':
        return 'status-open'

      case 'IN_PROGRESS':
        return 'status-progress'

      case 'RESOLVED':
        return 'status-resolved'

      case 'CLOSED':
        return 'status-closed'

      case 'REJECTED':
        return 'status-rejected'

      default:
        return ''
    }
  }

  const getPriorityClass = (priority) => {
    switch ((priority || '').toUpperCase()) {
      case 'HIGH':
        return 'priority-high'

      case 'MEDIUM':
        return 'priority-medium'

      case 'LOW':
        return 'priority-low'

      case 'URGENT':
        return 'priority-urgent'

      default:
        return ''
    }
  }

  return (
    <div className="complaints-page">

      <div className="page-header">
        <div>
          <h1>Complaints</h1>
          <p>Manage resident complaints and track resolution.</p>
        </div>

        <div className="complaint-count">
          {filteredComplaints.length} complaints
        </div>
      </div>

      <div className="complaints-toolbar">

        <input
          type="text"
          placeholder="Search complaint, title, category or flat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>

      </div>

      <div className="complaints-card">

        {loading ? (
          <div className="loading-message">
            Loading complaints...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-message">
            No complaints found.
          </div>
        ) : (
          <div className="table-container">

            <table className="complaints-table">

              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Flat</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Raised On</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredComplaints.map((complaint) => (

                  <tr key={complaint.id}>

                    <td>
                      <div className="complaint-title">
                        {complaint.title}
                      </div>

                      <div className="complaint-number">
                        {complaint.complaint_number || '-'}
                      </div>
                    </td>

                    <td>
                      <strong>
                        {complaint.flats?.flat_number || '-'}
                      </strong>
                    </td>

                    <td>
                      {complaint.category}
                    </td>

                    <td>
                      <span
                        className={`priority-badge ${getPriorityClass(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          complaint.status
                        )}`}
                      >
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      {formatDate(complaint.created_at)}
                    </td>

                    <td>
                      <button
                        className="view-button"
                        onClick={() =>
                          setSelectedComplaint(complaint)
                        }
                      >
                        View
                      </button>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {selectedComplaint && (
        <div className="complaint-modal-overlay">

          <div className="complaint-modal">

            <div className="modal-header">
              <div>
                <h2>{selectedComplaint.title}</h2>

                <span className="complaint-number">
                  {selectedComplaint.complaint_number || '-'}
                </span>
              </div>

              <button
                className="close-button"
                onClick={() => setSelectedComplaint(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">

              <div className="detail-grid">

                <div>
                  <label>Flat</label>
                  <p>
                    {selectedComplaint.flats?.flat_number || '-'}
                  </p>
                </div>

                <div>
                  <label>Category</label>
                  <p>{selectedComplaint.category}</p>
                </div>

                <div>
                  <label>Priority</label>
                  <p>
                    <span
                      className={`priority-badge ${getPriorityClass(
                        selectedComplaint.priority
                      )}`}
                    >
                      {selectedComplaint.priority}
                    </span>
                  </p>
                </div>

                <div>
                  <label>Status</label>
                  <p>
                    <span
                      className={`status-badge ${getStatusClass(
                        selectedComplaint.status
                      )}`}
                    >
                      {selectedComplaint.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>

                <div>
                  <label>Raised On</label>
                  <p>
                    {formatDate(selectedComplaint.created_at)}
                  </p>
                </div>

              </div>

              <div className="description-section">
                <label>Description</label>

                <p>
                  {selectedComplaint.description || 'No description provided.'}
                </p>
              </div>

            </div>

            <div className="modal-footer">

              <button
                className="secondary-button"
                onClick={() => setSelectedComplaint(null)}
              >
                Close
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  alert('Status management will be added in the next step.')
                }
              >
                Manage Complaint
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default Complaints