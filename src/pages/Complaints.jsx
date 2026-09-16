
import { useEffect, useMemo, useState } from "react"
import { supabase } from "../supabaseClient"
import "./Complaints.css"

const APARTMENT_ID = "6a50bb64-c6ea-480b-a4e3-e8677c894a99"

const STATUS_OPTIONS = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
]

const PRIORITY_OPTIONS = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]

const CATEGORY_OPTIONS = [
  "Maintenance",
  "Security",
  "Cleanliness",
  "Lift",
  "Water",
  "Electricity",
  "Parking",
  "Noise",
  "Other",
]

const EMPTY_ADD_FORM = {
  flat_id: "",
  raised_by: "",
  category: "Maintenance",
  priority: "NORMAL",
  title: "",
  description: "",
}

function Complaints() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [complaints, setComplaints] = useState([])
  const [flats, setFlats] = useState([])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [manageMode, setManageMode] = useState(false)

  const [manageForm, setManageForm] = useState({
    status: "",
    priority: "",
    resolution_notes: "",
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM)

  const [flatResidents, setFlatResidents] = useState([])
  const [loadingFlatResidents, setLoadingFlatResidents] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    await Promise.all([
      loadComplaints(),
      loadFlats(),
    ])

    setLoading(false)
  }

  async function loadComplaints() {
    const { data, error } = await supabase
      .from("complaints")
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
        resolution_notes,
        flats (
          flat_number
        )
      `)
      .eq("apartment_id", APARTMENT_ID)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading complaints:", error)
      alert(`Unable to load complaints: ${error.message}`)
      return
    }

    setComplaints(data || [])
  }

  async function loadFlats() {
    const { data, error } = await supabase
      .from("flats")
      .select(`
        id,
        flat_number,
        status
      `)
      .order("flat_number", { ascending: true })

    if (error) {
      console.error("Error loading flats:", error)
      alert(`Unable to load flats: ${error.message}`)
      return
    }

    console.log("Complaints - Flats loaded:", data)

    setFlats(data || [])
  }

  async function loadFlatResidents(flatId) {
    if (!flatId) {
      setFlatResidents([])
      return
    }

    setLoadingFlatResidents(true)

    const { data, error } = await supabase
      .from("flat_members")
      .select(`
        user_id,
        relationship,
        is_primary,
        status,
        users (
          id,
          full_name,
          email,
          role,
          status
        )
      `)
      .eq("flat_id", flatId)
      .eq("status", "ACTIVE")

    if (error) {
      console.error("Error loading flat residents:", error)
      alert(`Unable to load residents: ${error.message}`)
      setFlatResidents([])
      setLoadingFlatResidents(false)
      return
    }

    const residents = (data || [])
      .filter(
        (member) =>
          member.users &&
          member.users.status === "ACTIVE" &&
          member.users.role === "RESIDENT"
      )
      .map((member) => ({
        user_id: member.user_id,
        full_name: member.users.full_name,
        email: member.users.email,
        relationship: member.relationship,
        is_primary: member.is_primary,
      }))
      .sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1

        return (a.full_name || "").localeCompare(
          b.full_name || ""
        )
      })

    setFlatResidents(residents)

    // Automatically select the only active resident
    if (residents.length === 1) {
      setAddForm((previous) => ({
        ...previous,
        raised_by: residents[0].user_id,
      }))
    }

    setLoadingFlatResidents(false)
  }

  const filteredComplaints = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return complaints.filter((complaint) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        complaint.status === statusFilter

      if (!matchesStatus) {
        return false
      }

      if (!searchValue) {
        return true
      }

      const searchableText = [
        complaint.complaint_number,
        complaint.title,
        complaint.category,
        complaint.priority,
        complaint.status,
        complaint.flats?.flat_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(searchValue)
    })
  }, [complaints, search, statusFilter])

  function openViewModal(complaint) {
    setSelectedComplaint(complaint)
    setManageMode(false)
  }

  function openManageModal(complaint) {
    setSelectedComplaint(complaint)

    setManageForm({
      status: complaint.status || "OPEN",
      priority: complaint.priority || "NORMAL",
      resolution_notes: complaint.resolution_notes || "",
    })

    setManageMode(true)
  }

  function closeModal() {
    setSelectedComplaint(null)
    setManageMode(false)
  }

  function openAddModal() {
    setAddForm(EMPTY_ADD_FORM)
    setFlatResidents([])
    setShowAddModal(true)
  }

  function closeAddModal() {
    if (saving) return

    setShowAddModal(false)
    setAddForm(EMPTY_ADD_FORM)
    setFlatResidents([])
  }

  async function handleAddComplaint(event) {
    event.preventDefault()

    if (!addForm.flat_id) {
      alert("Please select a flat.")
      return
    }

    if (!addForm.raised_by) {
      alert("Please select who raised the complaint.")
      return
    }

    if (!addForm.category) {
      alert("Please select a category.")
      return
    }

    if (!addForm.title.trim()) {
      alert("Please enter a complaint title.")
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from("complaints")
      .insert({
        apartment_id: APARTMENT_ID,
        flat_id: addForm.flat_id,
        raised_by: addForm.raised_by,
        category: addForm.category,
        title: addForm.title.trim(),
        description: addForm.description.trim() || null,
        priority: addForm.priority,
        status: "OPEN",
      })

    if (error) {
      console.error("Error creating complaint:", error)
      alert(`Unable to create complaint: ${error.message}`)
      setSaving(false)
      return
    }

    alert("Complaint created successfully.")

    setSaving(false)
    closeAddModal()
    await loadComplaints()
  }

  async function handleManageComplaint(event) {
    event.preventDefault()

    if (!selectedComplaint) return

    setSaving(true)

    const updateData = {
      status: manageForm.status,
      priority: manageForm.priority,
      resolution_notes:
        manageForm.resolution_notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (
      manageForm.status === "RESOLVED" ||
      manageForm.status === "CLOSED"
    ) {
      updateData.closed_at =
        selectedComplaint.closed_at ||
        new Date().toISOString()
    } else {
      updateData.closed_at = null
    }

    const { data, error } = await supabase
      .from("complaints")
      .update(updateData)
      .eq("id", selectedComplaint.id)
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
        resolution_notes,
        flats (
          flat_number
        )
      `)
      .single()

    if (error) {
      console.error("Error updating complaint:", error)
      alert(`Unable to update complaint: ${error.message}`)
      setSaving(false)
      return
    }

    setSelectedComplaint(data)

    setComplaints((previous) =>
      previous.map((complaint) =>
        complaint.id === data.id
          ? data
          : complaint
      )
    )

    alert("Complaint updated successfully.")

    setSaving(false)
    setManageMode(false)
  }

  function formatDate(value) {
    if (!value) return "—"

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function getStatusClass(status) {
    return `status-${(status || "")
      .toLowerCase()
      .replace(/\s+/g, "_")}`
  }

  function getPriorityClass(priority) {
    return `priority-${(priority || "").toLowerCase()}`
  }

  return (
    <div className="complaints-page">
      <div className="page-header">
        <div>
          <h1>Complaints</h1>
          <p>
            Manage resident complaints and track their resolution.
          </p>
        </div>

        <button
          className="primary-button add-complaint-button"
          onClick={openAddModal}
        >
          + Add Complaint
        </button>
      </div>

      <div className="complaints-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search complaints..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          className="status-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="ALL">All Status</option>

          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="complaints-card">
        {loading ? (
          <div className="loading-state">
            Loading complaints...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>

            <h3>No complaints found</h3>

            <p>
              {search || statusFilter !== "ALL"
                ? "Try changing your search or filter."
                : "There are no complaints yet."}
            </p>

            {!search && statusFilter === "ALL" && (
              <button
                className="primary-button"
                onClick={openAddModal}
              >
                + Add Complaint
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Flat</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
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
                        {complaint.complaint_number ||
                          "Complaint"}
                      </div>
                    </td>

                    <td>
                      {complaint.flats?.flat_number || "—"}
                    </td>

                    <td>{complaint.category}</td>

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
                        {complaint.status.replace("_", " ")}
                      </span>
                    </td>

                    <td>
                      {formatDate(complaint.created_at)}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-button"
                          onClick={() =>
                            openViewModal(complaint)
                          }
                        >
                          View
                        </button>

                        <button
                          className="secondary-button"
                          onClick={() =>
                            openManageModal(complaint)
                          }
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW / MANAGE MODAL */}
      {selectedComplaint && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >
          <div className="modal-container">
            <div className="modal-header">
              <div>
                <h2>
                  {manageMode
                    ? "Manage Complaint"
                    : "Complaint Details"}
                </h2>

                <span className="modal-subtitle">
                  {selectedComplaint.complaint_number ||
                    "Complaint"}
                </span>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            {manageMode ? (
              <form
                className="complaint-form"
                onSubmit={handleManageComplaint}
              >
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">
                      Complaint
                    </span>

                    <strong>
                      {selectedComplaint.title}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      Flat
                    </span>

                    <strong>
                      {selectedComplaint.flats?.flat_number ||
                        "—"}
                    </strong>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>

                    <select
                      value={manageForm.status}
                      onChange={(event) =>
                        setManageForm({
                          ...manageForm,
                          status: event.target.value,
                        })
                      }
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>

                    <select
                      value={manageForm.priority}
                      onChange={(event) =>
                        setManageForm({
                          ...manageForm,
                          priority: event.target.value,
                        })
                      }
                    >
                      {PRIORITY_OPTIONS.map((priority) => (
                        <option
                          key={priority}
                          value={priority}
                        >
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Resolution Notes</label>

                  <textarea
                    rows="5"
                    placeholder="Enter resolution details..."
                    value={manageForm.resolution_notes}
                    onChange={(event) =>
                      setManageForm({
                        ...manageForm,
                        resolution_notes:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="workflow-info">
                  <strong>Workflow</strong>

                  <p>
                    OPEN → IN PROGRESS → RESOLVED → CLOSED
                  </p>

                  <p>
                    REJECTED can be used when the complaint is
                    not valid or cannot be accepted.
                  </p>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeModal}
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
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">
                      Complaint
                    </span>

                    <strong>
                      {selectedComplaint.complaint_number ||
                        "—"}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      Flat
                    </span>

                    <strong>
                      {selectedComplaint.flats?.flat_number ||
                        "—"}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      Category
                    </span>

                    <strong>
                      {selectedComplaint.category}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      Priority
                    </span>

                    <span
                      className={`priority-badge ${getPriorityClass(
                        selectedComplaint.priority
                      )}`}
                    >
                      {selectedComplaint.priority}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      Status
                    </span>

                    <span
                      className={`status-badge ${getStatusClass(
                        selectedComplaint.status
                      )}`}
                    >
                      {selectedComplaint.status.replace(
                        "_",
                        " "
                      )}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      Created
                    </span>

                    <strong>
                      {formatDate(
                        selectedComplaint.created_at
                      )}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      Updated
                    </span>

                    <strong>
                      {formatDate(
                        selectedComplaint.updated_at
                      )}
                    </strong>
                  </div>

                  {selectedComplaint.closed_at && (
                    <div className="detail-item">
                      <span className="detail-label">
                        Closed
                      </span>

                      <strong>
                        {formatDate(
                          selectedComplaint.closed_at
                        )}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h3>Description</h3>

                  <div className="description-box">
                    {selectedComplaint.description ||
                      "No description provided."}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Resolution Notes</h3>

                  <div className="resolution-box">
                    {selectedComplaint.resolution_notes ||
                      "No resolution notes yet."}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="secondary-button"
                    onClick={closeModal}
                  >
                    Close
                  </button>

                  <button
                    className="primary-button"
                    onClick={() =>
                      openManageModal(selectedComplaint)
                    }
                  >
                    Manage Complaint
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ADD COMPLAINT MODAL */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddModal()
            }
          }}
        >
          <div className="modal-container">
            <div className="modal-header">
              <div>
                <h2>Add Complaint</h2>

                <span className="modal-subtitle">
                  Create a new resident complaint
                </span>
              </div>

              <button
                className="modal-close"
                onClick={closeAddModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form
              className="complaint-form"
              onSubmit={handleAddComplaint}
            >
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Flat <span className="required">*</span>
                  </label>

                  <select
                    value={addForm.flat_id}
                    onChange={(event) => {
                      const flatId = event.target.value

                      setAddForm({
                        ...addForm,
                        flat_id: flatId,
                        raised_by: "",
                      })

                      loadFlatResidents(flatId)
                    }}
                    required
                  >
                    <option value="">
                      Select Flat
                    </option>

                    {flats.map((flat) => (
                      <option
                        key={flat.id}
                        value={flat.id}
                      >
                        {flat.flat_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Raised By{" "}
                    <span className="required">*</span>
                  </label>

                  <select
                    value={addForm.raised_by}
                    onChange={(event) =>
                      setAddForm({
                        ...addForm,
                        raised_by: event.target.value,
                      })
                    }
                    disabled={
                      !addForm.flat_id ||
                      loadingFlatResidents
                    }
                    required
                  >
                    <option value="">
                      {!addForm.flat_id
                        ? "Select Flat first"
                        : loadingFlatResidents
                        ? "Loading residents..."
                        : flatResidents.length === 0
                        ? "No active residents"
                        : "Select Resident"}
                    </option>

                    {flatResidents.map((resident) => (
                      <option
                        key={resident.user_id}
                        value={resident.user_id}
                      >
                        {resident.full_name}
                        {resident.relationship
                          ? ` (${resident.relationship})`
                          : ""}
                        {resident.is_primary
                          ? " - Primary"
                          : ""}
                      </option>
                    ))}
                  </select>

                  {addForm.flat_id &&
                    !loadingFlatResidents &&
                    flatResidents.length === 0 && (
                      <small className="form-help error-text">
                        No active resident is linked to this
                        flat.
                      </small>
                    )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Category{" "}
                    <span className="required">*</span>
                  </label>

                  <select
                    value={addForm.category}
                    onChange={(event) =>
                      setAddForm({
                        ...addForm,
                        category: event.target.value,
                      })
                    }
                    required
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>

                  <select
                    value={addForm.priority}
                    onChange={(event) =>
                      setAddForm({
                        ...addForm,
                        priority: event.target.value,
                      })
                    }
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Title <span className="required">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter complaint title"
                  value={addForm.title}
                  onChange={(event) =>
                    setAddForm({
                      ...addForm,
                      title: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  rows="5"
                  placeholder="Describe the complaint..."
                  value={addForm.description}
                  onChange={(event) =>
                    setAddForm({
                      ...addForm,
                      description:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div className="new-complaint-info">
                <strong>New complaint workflow</strong>

                <p>
                  The complaint will be created with status
                  <strong> OPEN</strong>.
                </p>

                <p>
                  You can update the status and resolution
                  details after creating it.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeAddModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving ||
                    loadingFlatResidents ||
                    flatResidents.length === 0
                  }
                >
                  {saving
                    ? "Creating..."
                    : "Create Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Complaints
