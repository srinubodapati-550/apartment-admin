import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Bills.css'

function Bills() {

  const [loading, setLoading] = useState(true)
  const [bills, setBills] = useState([])
  const [flats, setFlats] = useState([])
  const [funds, setFunds] = useState([])

  const [showGenerateModal, setShowGenerateModal] =
    useState(false)
    const [showEditModal, setShowEditModal] =
     useState(false)

    const [selectedBill, setSelectedBill] =
     useState(null)

    const [editFormData, setEditFormData] =
    useState({
    amount: '',
    dueDate: ''
    })

  const [formData, setFormData] = useState({
    billMonth: '',
    amount: '',
    dueDate: '',
    fundId: ''
  })

  const [payments, setPayments] = useState([])

  const [selectedPayment, setSelectedPayment] =  useState(null)

  const [showRejectModal, setShowRejectModal] =  useState(false)

  const [rejectionReason, setRejectionReason] =  useState('')

  useEffect(() => {

    loadData()

  }, [])

  async function loadPayments() {

  const { data, error } = await supabase
    .from('resident_payments')
    .select(`
      id,
      bill_id,
      amount,
      payment_date,
      payment_method,
      transaction_reference,
      payment_proof_url,
      status,
      created_at,

      resident_bills (
        id,
        bill_month,
        amount,
        flats (
          flat_number
        )
      ),

      users!resident_payments_submitted_by_fkey (
        full_name
      )
    `)
    .eq('status', 'SUBMITTED')
    .order('created_at', {
      ascending: false
    })


  if (error) {

    console.error(
      'Error loading payments:',
      error
    )

    return

  }


  setPayments(data || [])

}

  async function loadData() {

    setLoading(true)

    await Promise.all([
    loadBills(),
    loadFlats(),
    loadFunds(),
    loadPayments()
    ])

    setLoading(false)

  }


  async function loadBills() {

    const { data, error } = await supabase
      .from('resident_bills')
      .select(`
        id,
        bill_type,
        bill_month,
        amount,
        due_date,
        status,
        flats (
          flat_number
        ),
        funds (
          name
        )
      `)
      .order(
        'bill_month',
        { ascending: false }
      )


    if (error) {

      console.error(
        'Error loading bills:',
        error
      )

      return

    }


    setBills(data || [])

  }


async function loadFlats() {

  const { data, error } = await supabase
    .from('flats')
    .select(`
      id,
      block_id,
      flat_number,
      status,
      blocks (
        apartment_id,
        name
      )
    `)
    .eq('status', 'OCCUPIED')


  console.log('Occupied flats:', data)

  console.log('Flats error:', error)


  if (error) {

    console.error(
      'Error loading occupied flats:',
      error
    )

    return

  }


  setFlats(data || [])

}


  async function loadFunds() {

    const { data, error } = await supabase
      .from('funds')
      .select(`
        id,
        name,
        fund_type,
        status
      `)
      .eq('status', 'ACTIVE')


    if (error) {

      console.error(
        'Error loading funds:',
        error
      )

      return

    }


    setFunds(data || [])

  }


  function handleChange(event) {

    const {
      name,
      value
    } = event.target


    setFormData({

      ...formData,

      [name]: value

    })

  }


  async function generateBills(event) {

    event.preventDefault()


    if (
      !formData.billMonth ||
      !formData.amount ||
      !formData.dueDate ||
      !formData.fundId
    ) {

      alert(
        'Please fill all fields.'
      )

      return

    }


    if (flats.length === 0) {

      alert(
        'No occupied flats found.'
      )

      return

    }


    const selectedFund =
      funds.find(
        (fund) =>
          fund.id === formData.fundId
      )


    const billsToInsert =
      flats.map(
        (flat) => ({

            apartment_id:
             flat.blocks?.apartment_id,

          flat_id:
            flat.id,

          fund_id:
            formData.fundId,

          bill_type:
            selectedFund?.fund_type === 'CORPUS'
              ? 'CORPUS'
              : 'MAINTENANCE',

          bill_month:
            `${formData.billMonth}-01`,

          amount:
            Number(formData.amount),

          due_date:
            formData.dueDate,

          status:
            'PENDING'

        })
      )


    const { error } = await supabase
      .from('resident_bills')
      .insert(billsToInsert)


 if (error) {

  console.error(
    'Generate bills error:',
    error
  )

  alert(
    `Unable to generate bills: ${error.message}`
  )

  return

}


    alert(
      `Bills generated successfully for ${flats.length} occupied flats.`
    )


    setShowGenerateModal(false)


    setFormData({
      billMonth: '',
      amount: '',
      dueDate: '',
      fundId: ''
    })


    loadBills()

  }


  function formatCurrency(amount) {

    return Number(
      amount || 0
    ).toLocaleString(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }
    )

  }


  function formatDate(date) {

    if (!date) return '-'

    return new Date(
      date
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    )

  }

function openEditModal(bill) {

  if (bill.status !== 'PENDING') {

    alert(
      'Only pending bills can be edited.'
    )

    return

  }


  setSelectedBill(bill)


  setEditFormData({

    amount: bill.amount,

    dueDate: bill.due_date

  })


  setShowEditModal(true)

}

function handleEditChange(event) {

  const {
    name,
    value
  } = event.target


  setEditFormData({

    ...editFormData,

    [name]: value

  })

}

async function updateBill(event) {

  event.preventDefault()


  if (
    !editFormData.amount ||
    !editFormData.dueDate
  ) {

    alert(
      'Please fill all fields.'
    )

    return

  }


  const { error } = await supabase
    .from('resident_bills')
    .update({

      amount:
        Number(editFormData.amount),

      due_date:
        editFormData.dueDate

    })
    .eq(
      'id',
      selectedBill.id
    )


  if (error) {

    console.error(
      'Update bill error:',
      error
    )


    alert(
      `Unable to update bill: ${error.message}`
    )

    return

  }


  alert(
    'Bill updated successfully.'
  )


  setShowEditModal(false)

  setSelectedBill(null)


  await loadBills()

}

async function approvePayment(payment) {

  const confirmed = window.confirm(
    `Approve payment of ₹${payment.amount}?`
  )


  if (!confirmed) return


  const {
    data: { user }
  } = await supabase.auth.getUser()


  if (!user) {

    alert(
      'You are not logged in.'
    )

    return

  }


  const { error } = await supabase
    .rpc(
      'approve_resident_payment',
      {
        p_payment_id: payment.id,
        p_admin_id: user.id
      }
    )


  if (error) {

    console.error(
      'Approve payment error:',
      error
    )

    alert(
      `Unable to approve payment: ${error.message}`
    )

    return

  }


  alert(
    'Payment approved successfully.'
  )


  await loadPayments()

  await loadBills()

}

function openRejectModal(payment) {

  setSelectedPayment(payment)

  setRejectionReason('')

  setShowRejectModal(true)

}

async function rejectPayment(event) {

  event.preventDefault()


  if (!rejectionReason.trim()) {

    alert(
      'Please enter a rejection reason.'
    )

    return

  }


  const {
    data: { user }
  } = await supabase.auth.getUser()


  if (!user) {

    alert(
      'You are not logged in.'
    )

    return

  }


  const { error } = await supabase
    .rpc(
      'reject_resident_payment',
      {
        p_payment_id: selectedPayment.id,
        p_admin_id: user.id,
        p_rejection_reason:
          rejectionReason
    }
  )


  if (error) {

    console.error(
      'Reject payment error:',
      error
    )

    alert(
      `Unable to reject payment: ${error.message}`
    )

    return

  }


  alert(
    'Payment rejected.'
  )


  setShowRejectModal(false)

  setSelectedPayment(null)

  setRejectionReason('')


  await loadPayments()

}

  return (

    <div className="bills-page">


      {/* HEADER */}

      <div className="page-title-section">

        <div>

          <h2>
            Bills & Payments
          </h2>

          <p>
            Generate and manage resident maintenance bills.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={() =>
            setShowGenerateModal(true)
          }
        >

          + Generate Monthly Bills

        </button>

      </div>


      {/* SUMMARY */}

      <div className="bill-summary">

        <div className="summary-card">

          <span>Total Bills</span>

          <strong>
            {bills.length}
          </strong>

        </div>


        <div className="summary-card">

          <span>Pending</span>

          <strong>

            {
              bills.filter(
                (bill) =>
                  bill.status === 'PENDING'
              ).length
            }

          </strong>

        </div>


        <div className="summary-card">

          <span>Paid</span>

          <strong>

            {
              bills.filter(
                (bill) =>
                  bill.status === 'PAID'
              ).length
            }

          </strong>

        </div>

      </div>

{/* PENDING PAYMENT APPROVALS */}

<div className="payments-section">

  <div className="payments-section-header">

    <div>

      <h3>
        Payment Approvals
      </h3>

      <p>
        Review and approve resident payments.
      </p>

    </div>


    <div className="payment-count">

      {payments.length} Pending

    </div>

  </div>


  {

    payments.length === 0 ? (

      <div className="empty-state">

        <div className="empty-icon">
          💳
        </div>

        <h3>
          No payments awaiting approval
        </h3>

        <p>
          Submitted resident payments will appear here.
        </p>

      </div>

    ) : (

      <div className="bills-table-wrapper">

        <table className="bills-table">

          <thead>

            <tr>

              <th>Flat</th>

              <th>Month</th>

              <th>Amount</th>

              <th>Payment Date</th>

              <th>Method</th>

              <th>Reference</th>

              <th>Proof</th>

              <th>Action</th>

            </tr>

          </thead>


          <tbody>

            {

              payments.map(
                (payment) => (

                  <tr key={payment.id}>


                    <td>

                      {
                        payment.resident_bills
                          ?.flats
                          ?.flat_number || '-'
                      }

                    </td>


                    <td>

                      {formatDate(
                        payment.resident_bills
                          ?.bill_month
                      )}

                    </td>


                    <td>

                      {formatCurrency(
                        payment.amount
                      )}

                    </td>


                    <td>

                      {formatDate(
                        payment.payment_date
                      )}

                    </td>


                    <td>

                      {payment.payment_method || '-'}

                    </td>


                    <td>

                      {
                        payment.transaction_reference || '-'
                      }

                    </td>


                    <td>

                      {
                        payment.payment_proof_url ? (

                          <a
                            href={
                              payment.payment_proof_url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >

                            View Proof

                          </a>

                        ) : (

                          '-'

                        )
                      }

                    </td>


                    <td>

                      <div className="payment-actions">

                        <button
                          className="approve-button"
                          onClick={() =>
                            approvePayment(payment)
                          }
                        >

                          ✓ Approve

                        </button>


                        <button
                          className="reject-button"
                          onClick={() =>
                            openRejectModal(payment)
                          }
                        >

                          ✕ Reject

                        </button>

                      </div>

                    </td>


                  </tr>

                )
              )

            }

          </tbody>

        </table>

      </div>

    )

  }

</div>


      {/* BILLS TABLE */}

      <div className="bills-section">

        <h3>
          Monthly Bills
        </h3>


        {loading ? (

          <div className="empty-state">

            Loading bills...

          </div>

        ) : bills.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              💳
            </div>

            <h3>
              No bills generated yet
            </h3>

            <p>
              Generate monthly maintenance bills for occupied flats.
            </p>

          </div>

        ) : (

          <div className="bills-table-wrapper">

            <table className="bills-table">

              <thead>

                <tr>

                  <th>Flat</th>

                  <th>Type</th>

                  <th>Month</th>

                  <th>Fund</th>

                  <th>Amount</th>

                  <th>Due Date</th>

                  <th>Status</th>

                  <th>Action</th>

                </tr>

              </thead>


              <tbody>

                {

                  bills.map(
                    (bill) => (

                      <tr key={bill.id}>

                        <td>

                          {bill.flats?.flat_number}

                        </td>


                        <td>

                          {bill.bill_type}

                        </td>


                        <td>

                          {formatDate(
                            bill.bill_month
                          )}

                        </td>


                        <td>

                          {bill.funds?.name}

                        </td>


                        <td>

                          {formatCurrency(
                            bill.amount
                          )}

                        </td>


                        <td>

                          {formatDate(
                            bill.due_date
                          )}

                        </td>


                        <td>

                          <span
                            className={`bill-status ${bill.status}`}
                          >

                            {bill.status}

                          </span>

                        </td>

                        <td>

                        {bill.status === 'PENDING' ? (

                         <button
                         className="edit-bill-button"
                         onClick={() =>
                         openEditModal(bill)
                        }
                        >

                        ✏️ Edit

                        </button>

                         ) : (

                        <span className="locked-text">

                        Locked

                        </span>

                         )}

                        </td>

                      </tr>

                    )
                  )

                }

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* GENERATE BILL MODAL */}

      {

        showGenerateModal && (

          <div className="modal-overlay">

            <div className="bill-modal">

              <div className="modal-header">

                <div>

                  <h3>
                    Generate Monthly Bills
                  </h3>

                  <p>
                    Bills will be created for all occupied flats.
                  </p>

                </div>


                <button
                  className="close-button"
                  onClick={() =>
                    setShowGenerateModal(false)
                  }
                >
                  ✕
                </button>

              </div>


              <form
                onSubmit={generateBills}
              >


                {/* BILL MONTH */}

                <div className="form-group">

                  <label>
                    Billing Month
                  </label>

                  <input
                    type="month"
                    name="billMonth"
                    value={
                      formData.billMonth
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                {/* FUND */}

                <div className="form-group">

                  <label>
                    Fund
                  </label>

                  <select
                    name="fundId"
                    value={
                      formData.fundId
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Fund
                    </option>


                    {

                      funds.map(
                        (fund) => (

                          <option
                            key={fund.id}
                            value={fund.id}
                          >

                            {fund.name}

                          </option>

                        )
                      )

                    }

                  </select>

                </div>


                {/* AMOUNT */}

                <div className="form-group">

                  <label>
                    Amount Per Flat (₹)
                  </label>

                  <input
                    type="number"
                    name="amount"
                    min="1"
                    value={
                      formData.amount
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="2500"
                    required
                  />

                </div>


                {/* DUE DATE */}

                <div className="form-group">

                  <label>
                    Due Date
                  </label>

                  <input
                    type="date"
                    name="dueDate"
                    value={
                      formData.dueDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                <div className="modal-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowGenerateModal(false)
                    }
                  >

                    Cancel

                  </button>


                  <button
                    type="submit"
                    className="primary-button"
                  >

                    Generate Bills

                  </button>

                </div>


              </form>

            </div>

          </div>

        )

      }


      {
  showEditModal && selectedBill && (

    <div className="modal-overlay">

      <div className="bill-modal">

        <div className="modal-header">

          <div>

            <h3>
              Edit Bill
            </h3>

            <p>

              Flat:{' '}

              {selectedBill.flats?.flat_number}

            </p>

          </div>


          <button
            className="close-button"
            onClick={() => {

              setShowEditModal(false)

              setSelectedBill(null)

            }}
          >

            ✕

          </button>

        </div>


        <form onSubmit={updateBill}>


          {/* AMOUNT */}

          <div className="form-group">

            <label>
              Amount Per Flat (₹)
            </label>

            <input
              type="number"
              name="amount"
              min="1"
              value={
                editFormData.amount
              }
              onChange={
                handleEditChange
              }
              required
            />

          </div>


          {/* DUE DATE */}

          <div className="form-group">

            <label>
              Due Date
            </label>

            <input
              type="date"
              name="dueDate"
              value={
                editFormData.dueDate
              }
              onChange={
                handleEditChange
              }
              required
            />

          </div>


          <div className="modal-actions">


            <button
              type="button"
              className="secondary-button"
              onClick={() => {

                setShowEditModal(false)

                setSelectedBill(null)

              }}
            >

              Cancel

            </button>


            <button
              type="submit"
              className="primary-button"
            >

              Save Changes

            </button>


          </div>


        </form>

      </div>

    </div>

  )
}

{
  showRejectModal &&
  selectedPayment && (

    <div className="modal-overlay">

      <div className="bill-modal">

        <div className="modal-header">

          <div>

            <h3>
              Reject Payment
            </h3>

            <p>

              Enter the reason for rejecting this payment.

            </p>

          </div>

        </div>


        <form onSubmit={rejectPayment}>

          <div className="form-group">

            <label>
              Rejection Reason
            </label>

            <textarea
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(
                  event.target.value
                )
              }
              placeholder="Example: Transaction reference could not be verified."
              required
            />

          </div>


          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() => {

                setShowRejectModal(false)

                setSelectedPayment(null)

              }}
            >

              Cancel

            </button>


            <button
              type="submit"
              className="reject-button"
            >

              Reject Payment

            </button>

          </div>

        </form>

      </div>

    </div>

  )
}

    </div>

  )

}


export default Bills