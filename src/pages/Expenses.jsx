import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Expenses.css'

const APARTMENT_ID = '6a50bb64-c6ea-480b-a4e3-e8677c894a99'

const EXPENSE_CATEGORIES = [
  'Lift Maintenance',
  'Electricity',
  'Water',
  'Security',
  'Cleaning',
  'Plumbing',
  'Electrical',
  'Repairs & Maintenance',
  'Gardening',
  'AMC',
  'Insurance',
  'Property Tax',
  'Bank Charges',
  'Office & Administration',
  'Pest Control',
  'Generator / DG',
  'Fire & Safety',
  'Common Area Maintenance',
  'Legal & Professional',
  'Other',
]

const initialFormData = {
  fund_id: '',
  expense_date: new Date().toISOString().split('T')[0],
  category: '',
  description: '',
  amount: '',
  payment_method: '',
  reference_number: '',
  receipt_url: '',
}

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [funds, setFunds] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [selectedFund, setSelectedFund] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [selectedExpense, setSelectedExpense] = useState(null)

  const [formData, setFormData] = useState(initialFormData)

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  async function loadData() {
    try {
      setLoading(true)

      const [fundsResult, expensesResult] = await Promise.all([
        supabase
          .from('funds')
          .select('id, name, fund_type, status')
          .eq('apartment_id', APARTMENT_ID)
          .eq('status', 'ACTIVE')
          .order('name'),

        supabase
          .from('expenses')
          .select(`
            id,
            apartment_id,
            fund_id,
            major_project_id,
            expense_date,
            category,
            description,
            amount,
            payment_method,
            reference_number,
            receipt_url,
            created_by,
            created_at,
            updated_at
          `)
          .eq('apartment_id', APARTMENT_ID)
          .order('expense_date', { ascending: false })
          .order('created_at', { ascending: false }),
      ])

      if (fundsResult.error) {
        console.error('Funds load error:', fundsResult.error)
        alert(fundsResult.error.message)
        return
      }

      if (expensesResult.error) {
        console.error('Expenses load error:', expensesResult.error)
        alert(expensesResult.error.message)
        return
      }

      setFunds(fundsResult.data || [])
      setExpenses(expensesResult.data || [])
    } catch (error) {
      console.error('Load error:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  function getFundName(fundId) {
    const fund = funds.find((item) => item.id === fundId)

    return fund ? fund.name : 'Unknown Fund'
  }

  function formatAmount(amount) {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  function formatDate(date) {
    if (!date) return '-'

    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function resetForm() {
    setFormData({
      ...initialFormData,
      fund_id: funds.length > 0 ? funds[0].id : '',
    })
  }

  function handleInputChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // --------------------------------------------------
  // FILTERED EXPENSES
  // --------------------------------------------------

  const filteredExpenses = useMemo(() => {
    const search = searchText.trim().toLowerCase()

    return expenses.filter((expense) => {
      const matchesSearch =
        !search ||
        expense.category?.toLowerCase().includes(search) ||
        expense.description?.toLowerCase().includes(search) ||
        expense.payment_method?.toLowerCase().includes(search) ||
        expense.reference_number?.toLowerCase().includes(search) ||
        getFundName(expense.fund_id)?.toLowerCase().includes(search)

      const matchesFund =
        !selectedFund || expense.fund_id === selectedFund

      const matchesCategory =
        !selectedCategory ||
        expense.category === selectedCategory

      return (
        matchesSearch &&
        matchesFund &&
        matchesCategory
      )
    })
  }, [
    expenses,
    searchText,
    selectedFund,
    selectedCategory,
    funds,
  ])

  // --------------------------------------------------
  // SUMMARY
  // --------------------------------------------------

  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    )
  }, [expenses])

  const currentMonthExpenses = useMemo(() => {
    const now = new Date()

    const year = now.getFullYear()
    const month = now.getMonth()

    return expenses.reduce((total, expense) => {
      if (!expense.expense_date) return total

      const date = new Date(
        `${expense.expense_date}T00:00:00`
      )

      if (
        date.getFullYear() === year &&
        date.getMonth() === month
      ) {
        return total + Number(expense.amount || 0)
      }

      return total
    }, 0)
  }, [expenses])

  const corpusExpenses = useMemo(() => {
    const corpusFund = funds.find(
      (fund) => fund.fund_type === 'CORPUS'
    )

    if (!corpusFund) return 0

    return expenses
      .filter(
        (expense) => expense.fund_id === corpusFund.id
      )
      .reduce(
        (total, expense) =>
          total + Number(expense.amount || 0),
        0
      )
  }, [expenses, funds])

  const maintenanceExpenses = useMemo(() => {
    const maintenanceFund = funds.find(
      (fund) => fund.fund_type === 'MAINTENANCE'
    )

    if (!maintenanceFund) return 0

    return expenses
      .filter(
        (expense) =>
          expense.fund_id === maintenanceFund.id
      )
      .reduce(
        (total, expense) =>
          total + Number(expense.amount || 0),
        0
      )
  }, [expenses, funds])

  // --------------------------------------------------
  // CREATE EXPENSE
  // --------------------------------------------------

  async function createExpense(event) {
    event.preventDefault()

    if (
      !formData.fund_id ||
      !formData.expense_date ||
      !formData.category.trim() ||
      !formData.description.trim() ||
      !formData.amount
    ) {
      alert('Please fill all required fields')
      return
    }

    const amount = Number(formData.amount)

    if (Number.isNaN(amount) || amount <= 0) {
      alert('Amount must be greater than zero')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.rpc(
        'create_expense_with_transaction',
        {
          p_apartment_id: APARTMENT_ID,
          p_fund_id: formData.fund_id,
          p_expense_date: formData.expense_date,
          p_category: formData.category.trim(),
          p_description: formData.description.trim(),
          p_amount: amount,
          p_payment_method:
            formData.payment_method.trim() || null,
          p_reference_number:
            formData.reference_number.trim() || null,
          p_receipt_url:
            formData.receipt_url.trim() || null,
          p_major_project_id: null,
        }
      )

      if (error) {
        console.error(
          'Create expense error:',
          error
        )
        alert(error.message)
        return
      }

      alert('Expense added successfully')

      setShowAddModal(false)

      resetForm()

      await loadData()
    } catch (error) {
      console.error(
        'Create expense error:',
        error
      )
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  // --------------------------------------------------
  // OPEN ADD MODAL
  // --------------------------------------------------

  function openAddModal() {
    resetForm()
    setShowAddModal(true)
  }

  // --------------------------------------------------
  // OPEN VIEW MODAL
  // --------------------------------------------------

  function openViewModal(expense) {
    setSelectedExpense(expense)
    setShowViewModal(true)
  }

  // --------------------------------------------------
  // OPEN EDIT MODAL
  // --------------------------------------------------

  function openEditModal(expense) {
    setSelectedExpense(expense)

    setFormData({
      fund_id: expense.fund_id || '',
      expense_date: expense.expense_date || '',
      category: expense.category || '',
      description: expense.description || '',
      amount: expense.amount || '',
      payment_method: expense.payment_method || '',
      reference_number:
        expense.reference_number || '',
      receipt_url: expense.receipt_url || '',
    })

    setShowEditModal(true)
  }

  // --------------------------------------------------
  // UPDATE EXPENSE
  // --------------------------------------------------

  async function updateExpense(event) {
    event.preventDefault()

    if (!selectedExpense) {
      alert('No expense selected')
      return
    }

    if (
      !formData.fund_id ||
      !formData.expense_date ||
      !formData.category.trim() ||
      !formData.description.trim() ||
      !formData.amount
    ) {
      alert('Please fill all required fields')
      return
    }

    const amount = Number(formData.amount)

    if (Number.isNaN(amount) || amount <= 0) {
      alert('Amount must be greater than zero')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.rpc(
        'update_expense_with_transaction',
        {
          p_expense_id: selectedExpense.id,
          p_fund_id: formData.fund_id,
          p_expense_date: formData.expense_date,
          p_category: formData.category.trim(),
          p_description: formData.description.trim(),
          p_amount: amount,
          p_payment_method:
            formData.payment_method.trim() || null,
          p_reference_number:
            formData.reference_number.trim() || null,
          p_receipt_url:
            formData.receipt_url.trim() || null,
          p_major_project_id: null,
        }
      )

      if (error) {
        console.error(
          'Update expense error:',
          error
        )
        alert(error.message)
        return
      }

      alert('Expense updated successfully')

      setShowEditModal(false)
      setSelectedExpense(null)

      await loadData()
    } catch (error) {
      console.error(
        'Update expense error:',
        error
      )
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  // --------------------------------------------------
  // OPEN DELETE MODAL
  // --------------------------------------------------

  function openDeleteModal(expense) {
    setSelectedExpense(expense)
    setShowDeleteModal(true)
  }

  // --------------------------------------------------
  // DELETE EXPENSE
  // --------------------------------------------------

  async function deleteExpense() {
    if (!selectedExpense) return

    try {
      setDeleting(true)

      const { error } = await supabase.rpc(
        'delete_expense_with_transaction',
        {
          p_expense_id: selectedExpense.id,
        }
      )

      if (error) {
        console.error(
          'Delete expense error:',
          error
        )
        alert(error.message)
        return
      }

      alert('Expense deleted successfully')

      setShowDeleteModal(false)
      setSelectedExpense(null)

      await loadData()
    } catch (error) {
      console.error(
        'Delete expense error:',
        error
      )
      alert(error.message)
    } finally {
      setDeleting(false)
    }
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="page-container">

      {/* HEADER */}

      <div className="page-header">
        <div>
          <h1>Expenses</h1>

          <p>
            Manage apartment expenses and financial
            transactions
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddModal}
        >
          + Add Expense
        </button>
      </div>

      {/* SUMMARY CARDS */}

      <div className="summary-grid">

        <div className="summary-card">
          <div className="summary-label">
            Total Expenses
          </div>

          <div className="summary-value">
            {formatAmount(totalExpenses)}
          </div>

          <div className="summary-subtext">
            All recorded expenses
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">
            This Month
          </div>

          <div className="summary-value">
            {formatAmount(currentMonthExpenses)}
          </div>

          <div className="summary-subtext">
            Current month
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">
            Corpus Fund
          </div>

          <div className="summary-value">
            {formatAmount(corpusExpenses)}
          </div>

          <div className="summary-subtext">
            Corpus expenses
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">
            Maintenance Fund
          </div>

          <div className="summary-value">
            {formatAmount(maintenanceExpenses)}
          </div>

          <div className="summary-subtext">
            Maintenance expenses
          </div>
        </div>

      </div>

      {/* FILTERS */}

      <div className="filter-card">

        <div className="search-box">
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />
        </div>

        <select
          value={selectedFund}
          onChange={(event) =>
            setSelectedFund(event.target.value)
          }
        >
          <option value="">
            All Funds
          </option>

          {funds.map((fund) => (
            <option
              key={fund.id}
              value={fund.id}
            >
              {fund.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(event) =>
            setSelectedCategory(event.target.value)
          }
        >
          <option value="">
            All Categories
          </option>

          {EXPENSE_CATEGORIES.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>

        {(searchText ||
          selectedFund ||
          selectedCategory) && (
          <button
            className="secondary-button"
            onClick={() => {
              setSearchText('')
              setSelectedFund('')
              setSelectedCategory('')
            }}
          >
            Clear
          </button>
        )}

      </div>

      {/* TABLE */}

      <div className="table-card">

        {loading ? (
          <div className="loading-state">
            Loading expenses...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">

            <h3>
              No expenses found
            </h3>

            <p>
              {expenses.length === 0
                ? 'No expenses have been recorded yet.'
                : 'Try changing your search or filters.'}
            </p>

            {expenses.length === 0 && (
              <button
                className="primary-button"
                onClick={openAddModal}
              >
                + Add First Expense
              </button>
            )}

          </div>
        ) : (
          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Fund</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>

                    <td>
                      {formatDate(
                        expense.expense_date
                      )}
                    </td>

                    <td>
                      <strong>
                        {expense.category}
                      </strong>
                    </td>

                    <td>
                      {expense.description}
                    </td>

                    <td>
                      <span className="fund-badge">
                        {getFundName(
                          expense.fund_id
                        )}
                      </span>
                    </td>

                    <td>
                      {expense.payment_method || '-'}
                    </td>

                    <td>
                      <strong>
                        {formatAmount(
                          expense.amount
                        )}
                      </strong>
                    </td>

                    <td>
                      <div className="action-buttons">

                        <button
                          className="action-button view"
                          onClick={() =>
                            openViewModal(expense)
                          }
                        >
                          View
                        </button>

                        <button
                          className="action-button edit"
                          onClick={() =>
                            openEditModal(expense)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="action-button delete"
                          onClick={() =>
                            openDeleteModal(expense)
                          }
                        >
                          Delete
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

      {/* -------------------------------------------- */}
      {/* ADD EXPENSE MODAL */}
      {/* -------------------------------------------- */}

      {showAddModal && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  Add Expense
                </h2>

                <p>
                  Record a new apartment expense
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  !saving &&
                  setShowAddModal(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={createExpense}>

              <div className="form-grid">

                {/* DATE */}

                <div className="form-group">

                  <label>
                    Expense Date *
                  </label>

                  <input
                    type="date"
                    name="expense_date"
                    value={formData.expense_date}
                    onChange={handleInputChange}
                    required
                  />

                </div>

                {/* FUND */}

                <div className="form-group">

                  <label>
                    Fund *
                  </label>

                  <select
                    name="fund_id"
                    value={formData.fund_id}
                    onChange={handleInputChange}
                    required
                  >

                    <option value="">
                      Select Fund
                    </option>

                    {funds.map((fund) => (
                      <option
                        key={fund.id}
                        value={fund.id}
                      >
                        {fund.name}
                      </option>
                    ))}

                  </select>

                </div>

                {/* CATEGORY */}

                <div className="form-group">

                  <label>
                    Category *
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >

                    <option value="">
                      Select Category
                    </option>

                    {EXPENSE_CATEGORIES.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* AMOUNT */}

                <div className="form-group">

                  <label>
                    Amount *
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />

                </div>

                {/* DESCRIPTION */}

                <div className="form-group full-width">

                  <label>
                    Description *
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter expense details"
                    rows="3"
                    required
                  />

                </div>

                {/* PAYMENT METHOD */}

                <div className="form-group">

                  <label>
                    Payment Method
                  </label>

                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                  >

                    <option value="">
                      Select Method
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Cheque">
                      Cheque
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

                {/* REFERENCE */}

                <div className="form-group">

                  <label>
                    Reference Number
                  </label>

                  <input
                    type="text"
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleInputChange}
                    placeholder="Transaction / cheque number"
                  />

                </div>

                {/* RECEIPT */}

                <div className="form-group full-width">

                  <label>
                    Receipt URL
                  </label>

                  <input
                    type="text"
                    name="receipt_url"
                    value={formData.receipt_url}
                    onChange={handleInputChange}
                    placeholder="Optional receipt URL"
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowAddModal(false)
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
                    ? 'Saving...'
                    : 'Save Expense'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* -------------------------------------------- */}
      {/* VIEW EXPENSE MODAL */}
      {/* -------------------------------------------- */}

      {showViewModal && selectedExpense && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  Expense Details
                </h2>

                <p>
                  View expense information
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                ×
              </button>

            </div>

            <div className="details-grid">

              <div className="detail-item">

                <span className="detail-label">
                  Date
                </span>

                <span className="detail-value">
                  {formatDate(
                    selectedExpense.expense_date
                  )}
                </span>

              </div>

              <div className="detail-item">

                <span className="detail-label">
                  Fund
                </span>

                <span className="detail-value">
                  {getFundName(
                    selectedExpense.fund_id
                  )}
                </span>

              </div>

              <div className="detail-item">

                <span className="detail-label">
                  Category
                </span>

                <span className="detail-value">
                  {selectedExpense.category}
                </span>

              </div>

              <div className="detail-item">

                <span className="detail-label">
                  Amount
                </span>

                <span className="detail-value amount">
                  {formatAmount(
                    selectedExpense.amount
                  )}
                </span>

              </div>

              <div className="detail-item full-width">

                <span className="detail-label">
                  Description
                </span>

                <span className="detail-value">
                  {selectedExpense.description}
                </span>

              </div>

              <div className="detail-item">

                <span className="detail-label">
                  Payment Method
                </span>

                <span className="detail-value">
                  {selectedExpense.payment_method ||
                    '-'}
                </span>

              </div>

              <div className="detail-item">

                <span className="detail-label">
                  Reference Number
                </span>

                <span className="detail-value">
                  {selectedExpense.reference_number ||
                    '-'}
                </span>

              </div>

              <div className="detail-item full-width">

                <span className="detail-label">
                  Receipt
                </span>

                {selectedExpense.receipt_url ? (
                  <a
                    href={
                      selectedExpense.receipt_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="receipt-link"
                  >
                    View Receipt
                  </a>
                ) : (
                  <span className="detail-value">
                    No receipt attached
                  </span>
                )}

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="secondary-button"
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                Close
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  setShowViewModal(false)
                  openEditModal(
                    selectedExpense
                  )
                }}
              >
                Edit Expense
              </button>

            </div>

          </div>

        </div>
      )}

      {/* -------------------------------------------- */}
      {/* EDIT EXPENSE MODAL */}
      {/* -------------------------------------------- */}

      {showEditModal && selectedExpense && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  Edit Expense
                </h2>

                <p>
                  Update expense information
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  !saving &&
                  setShowEditModal(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={updateExpense}>

              <div className="form-grid">

                {/* DATE */}

                <div className="form-group">

                  <label>
                    Expense Date *
                  </label>

                  <input
                    type="date"
                    name="expense_date"
                    value={formData.expense_date}
                    onChange={handleInputChange}
                    required
                  />

                </div>

                {/* FUND */}

                <div className="form-group">

                  <label>
                    Fund *
                  </label>

                  <select
                    name="fund_id"
                    value={formData.fund_id}
                    onChange={handleInputChange}
                    required
                  >

                    <option value="">
                      Select Fund
                    </option>

                    {funds.map((fund) => (
                      <option
                        key={fund.id}
                        value={fund.id}
                      >
                        {fund.name}
                      </option>
                    ))}

                  </select>

                </div>

                {/* CATEGORY */}

                <div className="form-group">

                  <label>
                    Category *
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >

                    <option value="">
                      Select Category
                    </option>

                    {/* Keep old database categories visible */}
                    {formData.category &&
                      !EXPENSE_CATEGORIES.includes(
                        formData.category
                      ) && (
                        <option
                          value={formData.category}
                        >
                          {formData.category}
                        </option>
                      )}

                    {EXPENSE_CATEGORIES.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* AMOUNT */}

                <div className="form-group">

                  <label>
                    Amount *
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="0.01"
                    step="0.01"
                    required
                  />

                </div>

                {/* DESCRIPTION */}

                <div className="form-group full-width">

                  <label>
                    Description *
                  </label>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />

                </div>

                {/* PAYMENT METHOD */}

                <div className="form-group">

                  <label>
                    Payment Method
                  </label>

                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                  >

                    <option value="">
                      Select Method
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Cheque">
                      Cheque
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

                {/* REFERENCE */}

                <div className="form-group">

                  <label>
                    Reference Number
                  </label>

                  <input
                    type="text"
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleInputChange}
                    placeholder="Transaction / cheque number"
                  />

                </div>

                {/* RECEIPT */}

                <div className="form-group full-width">

                  <label>
                    Receipt URL
                  </label>

                  <input
                    type="text"
                    name="receipt_url"
                    value={formData.receipt_url}
                    onChange={handleInputChange}
                    placeholder="Optional receipt URL"
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowEditModal(false)
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
                    ? 'Updating...'
                    : 'Save Changes'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* -------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* -------------------------------------------- */}

      {showDeleteModal && selectedExpense && (
        <div className="modal-overlay">

          <div className="modal delete-modal">

            <div className="modal-header">

              <div>
                <h2>
                  Delete Expense
                </h2>

                <p>
                  This action cannot be undone
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  !deleting &&
                  setShowDeleteModal(false)
                }
              >
                ×
              </button>

            </div>

            <div className="delete-content">

              <div className="warning-icon">
                !
              </div>

              <p>
                Are you sure you want to delete this
                expense?
              </p>

              <div className="delete-summary">

                <div>
                  <strong>
                    {selectedExpense.category}
                  </strong>
                </div>

                <div>
                  {selectedExpense.description}
                </div>

                <div>
                  {formatAmount(
                    selectedExpense.amount
                  )}
                </div>

              </div>

              <p className="delete-warning">
                The related financial transaction
                will also be deleted.
              </p>

            </div>

            <div className="modal-footer">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setShowDeleteModal(false)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={deleteExpense}
                disabled={deleting}
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete Expense'}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default Expenses