
import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import "./Notices.css"

function Notices() {
  const [loading, setLoading] = useState(true)
  const [notices, setNotices] = useState([])

  const [searchText, setSearchText] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [selectedNotice, setSelectedNotice] = useState(null)

  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    status: "DRAFT",
    expiryDate: "",
  })

  // =========================================================
  // LOAD NOTICES
  // =========================================================

  useEffect(() => {
    loadNotices()
  }, [])

  async function loadNotices() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("notices")
        .select(`
          id,
          apartment_id,
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
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setNotices(data || [])
    } catch (error) {
      console.error("Unable to load notices:", error)
      alert(`Unable to load notices: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // CREATE NOTICE
  // =========================================================

  async function createNotice(event) {
    event.preventDefault()

    try {
      setSaving(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error("User not logged in")
      }

      const {
        data: apartments,
        error: apartmentError,
      } = await supabase
        .from("apartments")
        .select("id")
        .limit(1)

      if (apartmentError) {
        throw apartmentError
      }

      if (!apartments || apartments.length === 0) {
        throw new Error("No apartment found")
      }

      const apartmentId = apartments[0].id

      const isPublished = formData.status === "PUBLISHED"

      const { error } = await supabase
        .from("notices")
        .insert([
          {
            apartment_id: apartmentId,
            title: formData.title.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
            status: isPublished ? "PUBLISHED" : "DRAFT",
            published_by: isPublished ? user.id : null,
            published_at: isPublished
              ? new Date().toISOString()
              : null,
            expiry_date: formData.expiryDate
              ? formData.expiryDate
              : null,
          },
        ])

      if (error) {
        throw error
      }

      alert(
        isPublished
          ? "Notice published successfully"
          : "Notice saved as draft"
      )

      setShowCreateModal(false)

      setFormData({
        title: "",
        description: "",
        priority: "NORMAL",
        status: "DRAFT",
        expiryDate: "",
      })

      await loadNotices()
    } catch (error) {
      console.error("Unable to create notice:", error)
      alert(`Unable to create notice: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // =========================================================
  // NOTICE STATUS
  // =========================================================

  function getNoticeStatus(notice) {
    if (notice.status === "DRAFT") {
      return "DRAFT"
    }

    if (
      notice.status === "PUBLISHED" &&
      notice.expiry_date &&
      new Date(notice.expiry_date) < new Date()
    ) {
      return "EXPIRED"
    }

    return notice.status
  }

  // =========================================================
  // OPEN VIEW
  // =========================================================

  function openViewModal(notice) {
    setSelectedNotice(notice)
    setShowViewModal(true)
  }

  // =========================================================
  // OPEN EDIT
  // =========================================================

  function openEditModal(notice) {
    setSelectedNotice(notice)

    setFormData({
      title: notice.title || "",
      description: notice.description || "",
      priority: notice.priority || "NORMAL",
      status: notice.status || "DRAFT",
      expiryDate: notice.expiry_date
        ? notice.expiry_date.split("T")[0]
        : "",
    })

    setShowViewModal(false)
    setShowEditModal(true)
  }

  // =========================================================
  // UPDATE NOTICE
  // =========================================================

  async function updateNotice(event) {
    event.preventDefault()

    if (!selectedNotice) {
      return
    }

    try {
      setEditing(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error("User not logged in")
      }

      const isPublished = formData.status === "PUBLISHED"

      let publishedBy = selectedNotice.published_by
      let publishedAt = selectedNotice.published_at

      // Draft -> Published
      if (
        selectedNotice.status === "DRAFT" &&
        formData.status === "PUBLISHED"
      ) {
        publishedBy = user.id
        publishedAt = new Date().toISOString()
      }

      // Published -> Draft
      if (
        selectedNotice.status === "PUBLISHED" &&
        formData.status === "DRAFT"
      ) {
        publishedBy = null
        publishedAt = null
      }

      const { error } = await supabase
        .from("notices")
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          status: formData.status,
          published_by: isPublished ? publishedBy : null,
          published_at: isPublished ? publishedAt : null,
          expiry_date: formData.expiryDate
            ? formData.expiryDate
            : null,
        })
        .eq("id", selectedNotice.id)

      if (error) {
        throw error
      }

      alert("Notice updated successfully")

      setShowEditModal(false)
      setSelectedNotice(null)

      await loadNotices()
    } catch (error) {
      console.error("Unable to update notice:", error)
      alert(`Unable to update notice: ${error.message}`)
    } finally {
      setEditing(false)
    }
  }

  // =========================================================
  // DELETE CONFIRMATION
  // =========================================================

  function openDeleteConfirmation() {
    if (!selectedNotice) {
      return
    }

    setShowDeleteConfirm(true)
  }

  function closeDeleteConfirmation() {
    if (deleting) {
      return
    }

    setShowDeleteConfirm(false)
  }

  // =========================================================
  // DELETE NOTICE
  // =========================================================

  async function deleteNotice() {
    if (!selectedNotice) {
      return
    }

    try {
      setDeleting(true)

      const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", selectedNotice.id)

      if (error) {
        throw error
      }

      alert("Notice deleted successfully")

      setShowDeleteConfirm(false)
      setShowViewModal(false)
      setSelectedNotice(null)

      await loadNotices()
    } catch (error) {
      console.error("Unable to delete notice:", error)
      alert(`Unable to delete notice: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // =========================================================
  // FILTER
  // =========================================================

  const filteredNotices = notices.filter((notice) => {
    const actualStatus = getNoticeStatus(notice)

    const search = searchText.toLowerCase()

    const matchesSearch =
      notice.title?.toLowerCase().includes(search) ||
      notice.description?.toLowerCase().includes(search)

    const matchesPriority =
      selectedPriority === "ALL" ||
      notice.priority === selectedPriority

    const matchesStatus =
      selectedStatus === "ALL" ||
      actualStatus === selectedStatus

    return (
      matchesSearch &&
      matchesPriority &&
      matchesStatus
    )
  })

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalNotices = notices.length

  const publishedCount = notices.filter(
    (notice) =>
      getNoticeStatus(notice) === "PUBLISHED"
  ).length

  const draftCount = notices.filter(
    (notice) =>
      getNoticeStatus(notice) === "DRAFT"
  ).length

  const expiredCount = notices.filter(
    (notice) =>
      getNoticeStatus(notice) === "EXPIRED"
  ).length

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="notices-page">

      {/* PAGE HEADER */}

      <div className="page-title-section">

        <div>
          <h2>Notices</h2>

          <p>
            Manage apartment announcements and notices
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Notice
        </button>

      </div>


      {/* SUMMARY */}

      <div className="notices-summary">

        <div className="summary-card">
          <span>Total Notices</span>
          <strong>{totalNotices}</strong>
        </div>

        <div className="summary-card">
          <span>Published</span>
          <strong>{publishedCount}</strong>
        </div>

        <div className="summary-card">
          <span>Draft</span>
          <strong>{draftCount}</strong>
        </div>

        <div className="summary-card">
          <span>Expired</span>
          <strong>{expiredCount}</strong>
        </div>

      </div>


      {/* NOTICES SECTION */}

      <div className="notices-section">

        <div className="notices-section-header">

          <div>
            <h3>All Notices</h3>

            <p>
              View and manage apartment notices
            </p>
          </div>

          <div className="notices-filters">

            <input
              type="text"
              placeholder="Search notices..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            <select
              value={selectedPriority}
              onChange={(event) =>
                setSelectedPriority(event.target.value)
              }
            >
              <option value="ALL">
                All Priorities
              </option>

              <option value="LOW">
                Low
              </option>

              <option value="NORMAL">
                Normal
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="URGENT">
                Urgent
              </option>
            </select>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value)
              }
            >
              <option value="ALL">
                All Status
              </option>

              <option value="PUBLISHED">
                Published
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


        {/* TABLE */}

        {loading ? (

          <div className="empty-state">
            <p>Loading notices...</p>
          </div>

        ) : filteredNotices.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              📢
            </div>

            <h3>No notices found</h3>

            <p>
              Create a notice to communicate with residents.
            </p>

          </div>

        ) : (

          <div className="notices-table-wrapper">

            <table className="notices-table">

              <thead>
                <tr>
                  <th>Notice</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Expiry</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredNotices.map((notice) => {

                  const actualStatus =
                    getNoticeStatus(notice)

                  return (
                    <tr key={notice.id}>

                      <td>
                        <div className="notice-title">

                          <strong>
                            {notice.title}
                          </strong>

                          <span>
                            {notice.description}
                          </span>

                        </div>
                      </td>

                      <td>
                        <span
                          className={`notice-priority ${notice.priority.toLowerCase()}`}
                        >
                          {notice.priority}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`notice-status ${actualStatus.toLowerCase()}`}
                        >
                          {actualStatus}
                        </span>
                      </td>

                      <td>
                        {notice.published_at
                          ? new Date(
                              notice.published_at
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        {notice.expiry_date
                          ? new Date(
                              notice.expiry_date
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>

                        <button
                          className="view-notice-button"
                          onClick={() =>
                            openViewModal(notice)
                          }
                        >
                          View
                        </button>

                      </td>

                    </tr>
                  )
                })}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =====================================================
          CREATE MODAL
      ===================================================== */}

      {showCreateModal && (

        <div className="modal-overlay">

          <div className="notice-modal">

            <div className="modal-header">

              <div>
                <h3>Create Notice</h3>

                <p>
                  Create a new apartment notice
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                ✕
              </button>

            </div>

            <form onSubmit={createNotice}>

              <div className="form-group">

                <label>Title</label>

                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter notice title"
                />

              </div>


              <div className="form-group">

                <label>Description</label>

                <textarea
                  required
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="Enter notice details"
                />

              </div>


              <div className="form-group">

                <label>Priority</label>

                <select
                  value={formData.priority}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      priority: event.target.value,
                    })
                  }
                >
                  <option value="LOW">
                    Low
                  </option>

                  <option value="NORMAL">
                    Normal
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                  <option value="URGENT">
                    Urgent
                  </option>
                </select>

              </div>


              <div className="form-group">

                <label>Status</label>

                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      status: event.target.value,
                    })
                  }
                >
                  <option value="DRAFT">
                    Draft
                  </option>

                  <option value="PUBLISHED">
                    Published
                  </option>
                </select>

              </div>


              <div className="form-group">

                <label>Expiry Date</label>

                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      expiryDate:
                        event.target.value,
                    })
                  }
                />

                <span className="form-help">
                  Leave empty if the notice should not expire.
                </span>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : formData.status === "PUBLISHED"
                    ? "Publish Notice"
                    : "Save Draft"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {showViewModal && selectedNotice && (

        <div className="modal-overlay">

          <div className="notice-modal">

            <div className="modal-header">

              <div>

                <h3>
                  Notice Details
                </h3>

                <p>
                  View notice information
                </p>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                ✕
              </button>

            </div>


            <div className="notice-details">

              <div className="notice-detail-row">

                <label>Title</label>

                <strong>
                  {selectedNotice.title}
                </strong>

              </div>


              <div className="notice-detail-row">

                <label>Description</label>

                <div className="notice-detail-description">
                  {selectedNotice.description}
                </div>

              </div>


              <div className="notice-detail-grid">

                <div className="notice-detail-row">

                  <label>Priority</label>

                  <span
                    className={`notice-priority ${selectedNotice.priority.toLowerCase()}`}
                  >
                    {selectedNotice.priority}
                  </span>

                </div>


                <div className="notice-detail-row">

                  <label>Status</label>

                  <span
                    className={`notice-status ${getNoticeStatus(
                      selectedNotice
                    ).toLowerCase()}`}
                  >
                    {getNoticeStatus(selectedNotice)}
                  </span>

                </div>


                <div className="notice-detail-row">

                  <label>Published</label>

                  <span>
                    {selectedNotice.published_at
                      ? new Date(
                          selectedNotice.published_at
                        ).toLocaleString()
                      : "-"}
                  </span>

                </div>


                <div className="notice-detail-row">

                  <label>Expiry</label>

                  <span>
                    {selectedNotice.expiry_date
                      ? new Date(
                          selectedNotice.expiry_date
                        ).toLocaleDateString()
                      : "No expiry"}
                  </span>

                </div>


                <div className="notice-detail-row">

                  <label>Created</label>

                  <span>
                    {selectedNotice.created_at
                      ? new Date(
                          selectedNotice.created_at
                        ).toLocaleString()
                      : "-"}
                  </span>

                </div>


                <div className="notice-detail-row">

                  <label>Last Updated</label>

                  <span>
                    {selectedNotice.updated_at
                      ? new Date(
                          selectedNotice.updated_at
                        ).toLocaleString()
                      : "-"}
                  </span>

                </div>

              </div>

            </div>


            <div className="modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                Close
              </button>


              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  openEditModal(selectedNotice)
                }
              >
                Edit Notice
              </button>


              <button
                type="button"
                className="secondary-button"
                style={{
                  color: "#dc2626",
                  borderColor: "#fecaca",
                }}
                onClick={openDeleteConfirmation}
              >
                Delete Notice
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      {showEditModal && selectedNotice && (

        <div className="modal-overlay">

          <div className="notice-modal">

            <div className="modal-header">

              <div>

                <h3>
                  Edit Notice
                </h3>

                <p>
                  Update notice information
                </p>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowEditModal(false)
                }
              >
                ✕
              </button>

            </div>


            <form onSubmit={updateNotice}>

              <div className="form-group">

                <label>Title</label>

                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      title: event.target.value,
                    })
                  }
                />

              </div>


              <div className="form-group">

                <label>Description</label>

                <textarea
                  required
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      description:
                        event.target.value,
                    })
                  }
                />

              </div>


              <div className="form-group">

                <label>Priority</label>

                <select
                  value={formData.priority}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      priority: event.target.value,
                    })
                  }
                >
                  <option value="LOW">
                    Low
                  </option>

                  <option value="NORMAL">
                    Normal
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                  <option value="URGENT">
                    Urgent
                  </option>
                </select>

              </div>


              <div className="form-group">

                <label>Status</label>

                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      status: event.target.value,
                    })
                  }
                >
                  <option value="DRAFT">
                    Draft
                  </option>

                  <option value="PUBLISHED">
                    Published
                  </option>

                  <option value="EXPIRED">
                    Expired
                  </option>
                </select>

              </div>


              <div className="form-group">

                <label>Expiry Date</label>

                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      expiryDate:
                        event.target.value,
                    })
                  }
                />

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowEditModal(false)
                  }
                  disabled={editing}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={editing}
                >
                  {editing
                    ? "Updating..."
                    : "Update Notice"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      {showDeleteConfirm && selectedNotice && (

        <div className="modal-overlay">

          <div className="notice-modal">

            <div className="modal-header">

              <div>

                <h3>
                  Delete Notice
                </h3>

                <p>
                  Please confirm this action
                </p>

              </div>

              <button
                className="close-button"
                onClick={closeDeleteConfirmation}
                disabled={deleting}
              >
                ✕
              </button>

            </div>


            <div className="notice-details">

              <div
                style={{
                  padding: "16px",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: "8px",
                }}
              >

                <strong
                  style={{
                    display: "block",
                    marginBottom: "10px",
                    color: "#9a3412",
                  }}
                >
                  Are you sure you want to delete this notice?
                </strong>

                <div
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  {selectedNotice.title}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  This action cannot be undone.
                </div>

              </div>

            </div>


            <div className="modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={closeDeleteConfirmation}
                disabled={deleting}
              >
                Cancel
              </button>


              <button
                type="button"
                className="primary-button"
                style={{
                  background: "#dc2626",
                }}
                onClick={deleteNotice}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default Notices

