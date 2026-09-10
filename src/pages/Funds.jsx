import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Funds.css'

function Funds() {

  const [loading, setLoading] = useState(true)

  const [funds, setFunds] = useState([])

  const [transactions, setTransactions] =
    useState([])


  useEffect(() => {

    loadFundsData()

  }, [])


  async function loadFundsData() {

    setLoading(true)


    /* -------------------------
       Load Fund Balances
    -------------------------- */

    const {
      data: fundData,
      error: fundError
    } = await supabase
      .from('v_fund_balances')
      .select(`
        fund_id,
        apartment_id,
        fund_name,
        fund_type,
        current_balance
      `)
      .order('fund_name')


    if (fundError) {

      console.error(
        'Error loading funds:',
        fundError
      )

    } else {

      setFunds(fundData || [])

    }


    /* -------------------------
       Load Transactions
    -------------------------- */

    const {
      data: transactionData,
      error: transactionError
    } = await supabase
      .from('financial_transactions')
      .select(`
        id,
        fund_id,
        transaction_date,
        transaction_type,
        category,
        description,
        amount,
        created_at,
        funds (
          name,
          fund_type
        )
      `)
      .order(
        'transaction_date',
        { ascending: false }
      )
      .limit(10)


    if (transactionError) {

      console.error(
        'Error loading transactions:',
        transactionError
      )

    } else {

      setTransactions(
        transactionData || []
      )

    }


    setLoading(false)

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


  const maintenanceFund =
    funds.find(
      (fund) =>
        fund.fund_type === 'MAINTENANCE'
    )


  const corpusFund =
    funds.find(
      (fund) =>
        fund.fund_type === 'CORPUS'
    )


  return (

    <div className="funds-page">


      {/* Page Header */}

      <div className="page-title-section">

        <div>

          <h2>
            Funds Management
          </h2>

          <p>
            Monitor maintenance and corpus funds.
          </p>

        </div>

      </div>


      {/* Fund Cards */}

      <div className="funds-grid">


        {/* Maintenance Fund */}

        <div className="fund-main-card">

          <div className="fund-card-header">

            <div className="large-fund-icon">
              💰
            </div>

            <div>

              <h3>
                {maintenanceFund?.fund_name ||
                  'Maintenance Fund'}
              </h3>

              <span>
                Regular apartment maintenance
              </span>

            </div>

          </div>


          <div className="fund-balance">

            <p>
              Current Balance
            </p>

            <h1>

              {loading
                ? '--'
                : formatCurrency(
                    maintenanceFund?.current_balance
                  )}

            </h1>

          </div>


          <div className="fund-type">

            MAINTENANCE FUND

          </div>

        </div>


        {/* Corpus Fund */}

        <div className="fund-main-card">

          <div className="fund-card-header">

            <div className="large-fund-icon">
              🏦
            </div>

            <div>

              <h3>
                {corpusFund?.fund_name ||
                  'Corpus Fund'}
              </h3>

              <span>
                Major repairs and projects
              </span>

            </div>

          </div>


          <div className="fund-balance">

            <p>
              Current Balance
            </p>

            <h1>

              {loading
                ? '--'
                : formatCurrency(
                    corpusFund?.current_balance
                  )}

            </h1>

          </div>


          <div className="fund-type corpus-type">

            CORPUS FUND

          </div>

        </div>


      </div>


      {/* Transactions */}

      <div className="transactions-section">


        <div className="transactions-header">

          <div>

            <h3>
              Recent Fund Transactions
            </h3>

            <p>
              Latest financial activity
            </p>

          </div>

        </div>


        {loading ? (

          <div className="empty-state">

            Loading transactions...

          </div>

        ) : transactions.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              📊
            </div>

            <h3>
              No transactions yet
            </h3>

            <p>
              Financial transactions will appear here.
            </p>

          </div>

        ) : (

          <div className="transactions-table-wrapper">

            <table className="transactions-table">

              <thead>

                <tr>

                  <th>Date</th>

                  <th>Fund</th>

                  <th>Type</th>

                  <th>Category</th>

                  <th>Description</th>

                  <th>Amount</th>

                </tr>

              </thead>


              <tbody>

                {transactions.map(
                  (transaction) => (

                    <tr
                      key={transaction.id}
                    >

                      <td>

                        {formatDate(
                          transaction.transaction_date
                        )}

                      </td>


                      <td>

                        {transaction.funds?.name ||
                          '-'}

                      </td>


                      <td>

                        <span
                          className={`transaction-badge ${
                            transaction.transaction_type
                          }`}
                        >

                          {transaction.transaction_type}

                        </span>

                      </td>


                      <td>

                        {transaction.category || '-'}

                      </td>


                      <td>

                        {transaction.description || '-'}

                      </td>


                      <td className="amount-cell">

                        {formatCurrency(
                          transaction.amount
                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


    </div>

  )

}


export default Funds