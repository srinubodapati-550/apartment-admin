import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Users.css'

function Users() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'RESIDENT',
    status: 'ACTIVE'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        status,
        created_at
      `)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error loading users:', error)
      setUsers([])
    } else {
      setUsers(data || [])
    }

    setLoading(false)
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  // ---------------------------------------------
  // CREATE USER
  // ---------------------------------------------

  function openCreateModal() {
    setEditingUser(null)

    setForm({
      full_name: '',
      email: '',
      phone: '',
      role: 'RESIDENT',
      status: 'ACTIVE'
    })

    setShowModal(true)
  }

  // ---------------------------------------------
  // EDIT USER
  // ---------------------------------------------

  function openEditModal(user) {
    setEditingUser(user)

    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'RESIDENT',
      status: user.status || 'ACTIVE'
    })

    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingUser(null)
  }

  // ---------------------------------------------
  // CREATE USER
  // ---------------------------------------------

  async function handleCreateUser(e) {
    e.preventDefault()

    if (!form.full_name.trim()) {
      alert('Please enter full name')
      return
    }

    if (!form.email.trim()) {
      alert('Please enter email')
      return
    }

    try {
      setLoading(true)

      const { data, error } =
        await supabase.functions.invoke(
          'clever-action',
          {
            body: {
              full_name: form.full_name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
              role: form.role,
              status: form.status
            }
          }
        )

      if (error) {
        console.error(
          'Create user error:',
          error
        )

        alert(
          error.message ||
          'Failed to create user'
        )

        return
      }

      if (data?.error) {
        alert(data.error)
        return
      }

      alert(
        'User created successfully.'
      )

      setShowModal(false)

      setForm({
        full_name: '',
        email: '',
        phone: '',
        role: 'RESIDENT',
        status: 'ACTIVE'
      })

      await loadUsers()

    } catch (error) {

      console.error(
        'Unexpected error:',
        error
      )

      alert(
        'Something went wrong while creating the user.'
      )

    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------
  // UPDATE USER
  // ---------------------------------------------

  async function handleUpdateUser(e) {
    e.preventDefault()

    if (!editingUser) {
      return
    }

    if (!form.full_name.trim()) {
      alert('Please enter full name')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('users')
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          status: form.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)

      if (error) {
        console.error(
          'Update user error:',
          error
        )

        alert(
          error.message ||
          'Failed to update user'
        )

        return
      }

      alert(
        'User updated successfully.'
      )

      setShowModal(false)
      setEditingUser(null)

      await loadUsers()

    } catch (error) {

      console.error(
        'Unexpected update error:',
        error
      )

      alert(
        'Something went wrong while updating the user.'
      )

    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------
  // ACTIVATE / DEACTIVATE USER
  // ---------------------------------------------

  async function toggleUserStatus(user) {

    const isActive =
      user.status === 'ACTIVE'

    const newStatus =
      isActive
        ? 'INACTIVE'
        : 'ACTIVE'

    const action =
      isActive
        ? 'deactivate'
        : 'activate'

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.full_name || 'this user'}?`
    )

    if (!confirmed) {
      return
    }

    try {

      setLoading(true)

      const { error } = await supabase
        .from('users')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {

        console.error(
          'Status update error:',
          error
        )

        alert(
          error.message ||
          `Failed to ${action} user`
        )

        return
      }

      alert(
        `User ${isActive ? 'deactivated' : 'activated'} successfully.`
      )

      await loadUsers()

    } catch (error) {

      console.error(
        'Unexpected status update error:',
        error
      )

      alert(
        `Something went wrong while trying to ${action} the user.`
      )

    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------
  // SEARCH
  // ---------------------------------------------

  const filteredUsers = users.filter((user) => {

    const searchText =
      search.toLowerCase()

    return (
      (user.full_name || '')
        .toLowerCase()
        .includes(searchText) ||

      (user.email || '')
        .toLowerCase()
        .includes(searchText) ||

      (user.phone || '')
        .toLowerCase()
        .includes(searchText)
    )
  })

  return (
    <div className="users-page">

      {/* Header */}
      <div className="users-header">

        <div>
          <h1>Users</h1>

          <p>
            Manage apartment residents and administrators
          </p>
        </div>

        <button
          className="create-user-btn"
          onClick={openCreateModal}
        >
          + Create User
        </button>

      </div>

      {/* Search */}
      <div className="users-toolbar">

        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      {/* Users table */}
      <div className="users-card">

        {loading ? (

          <div className="users-loading">
            Loading users...
          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="users-empty">
            No users found.
          </div>

        ) : (

          <div className="users-table-wrapper">

            <table className="users-table">

              <thead>

                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {filteredUsers.map((user) => (

                  <tr key={user.id}>

                    <td className="user-name">
                      {user.full_name || '-'}
                    </td>

                    <td>
                      {user.email || '-'}
                    </td>

                    <td>
                      {user.phone || '-'}
                    </td>

                    <td>

                      <span
                        className={`role-badge ${
                          user.role === 'ADMIN'
                            ? 'role-admin'
                            : 'role-resident'
                        }`}
                      >
                        {user.role || '-'}
                      </span>

                    </td>

                    <td>

                      <span
                        className={`status-badge ${
                          user.status === 'ACTIVE'
                            ? 'status-active'
                            : 'status-inactive'
                        }`}
                      >
                        {user.status || '-'}
                      </span>

                    </td>

                    <td>
                      {user.created_at
                        ? new Date(
                            user.created_at
                          ).toLocaleDateString()
                        : '-'}
                    </td>

                    <td>

                      <div className="user-actions">

                        <button
                          className="edit-user-btn"
                          onClick={() =>
                            openEditModal(user)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className={
                            user.status === 'ACTIVE'
                              ? 'deactivate-user-btn'
                              : 'activate-user-btn'
                          }
                          onClick={() =>
                            toggleUserStatus(user)
                          }
                        >
                          {user.status === 'ACTIVE'
                            ? 'Deactivate'
                            : 'Activate'}
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

      {/* Create / Edit User Modal */}
      {showModal && (

        <div className="modal-overlay">

          <div className="create-user-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingUser
                    ? 'Edit User'
                    : 'Create User'}
                </h2>

                <p>
                  {editingUser
                    ? 'Update user information'
                    : 'Create a new apartment user'}
                </p>

              </div>

              <button
                className="close-modal-btn"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                editingUser
                  ? handleUpdateUser
                  : handleCreateUser
              }
            >

              {/* Full Name */}
              <div className="form-group">

                <label>
                  Full Name *
                </label>

                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />

              </div>

              {/* Email */}
              <div className="form-group">

                <label>
                  Email *
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  disabled={!!editingUser}
                />

                {editingUser && (
                  <small
                    style={{
                      color: '#777',
                      marginTop: '4px',
                      display: 'block'
                    }}
                  >
                    Email cannot be changed here.
                  </small>
                )}

              </div>

              {/* Phone */}
              <div className="form-group">

                <label>
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />

              </div>

              {/* Role + Status */}
              <div className="form-row">

                <div className="form-group">

                  <label>
                    Role
                  </label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >

                    <option value="RESIDENT">
                      Resident
                    </option>

                    <option value="ADMIN">
                      Admin
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>

              {/* Actions */}
              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-user-btn"
                >
                  {editingUser
                    ? 'Save Changes'
                    : 'Create User'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default Users