
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Dashboard.css'

const APARTMENT_ID =
  '6a50bb64-c6ea-480b-a4e3-e8677c894a99'

function Dashboard({ user, onNavigate }) {

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [apartmentName, setApartmentName] =
    useState('Apartment Management')

  const [stats, setStats] = useState({
    totalFlats: 0,
    occupiedFlats: 0,
    vacantFlats: 0,
    openComplaints: 0,

    maintenanceFund: 0,
    corpusFund: 0,

    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyNetBalance: 0
  })


  useEffect(() => {
    loadDashboardData()
  }, [])


  async function loadDashboardData(isRefresh = false) {

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {

      /* =========================
         1. Load Apartment
      ========================== */

      const {
        data: apartment,
        error: apartmentError
      } = await supabase
        .from('apartments')
        .select('id, name')
        .eq('id', APARTMENT_ID)
        .single()


      if (apartmentError) {
        console.error(
          'Apartment error:',
          apartmentError
        )
      }


      if (apartment) {
        setApartmentName(apartment.name)
      }


      /* =========================
         2. Load Blocks
      ========================== */

      const {
        data: blocks,
        error: blocksError
      } = await supabase
        .from('blocks')
        .select('id')
        .eq('apartment_id', APARTMENT_ID)


      if (blocksError) {

        console.error(
          'Blocks error:',
          blocksError
        )

      }


      const blockIds =
        blocks?.map(block => block.id) || []


      /* =========================
         3. Load Flats
      ========================== */

      let flats = []


      if (blockIds.length > 0) {

        const {
          data,
          error: flatsError
        } = await supabase
          .from('flats')
          .select(`
            id,
            block_id,
            flat_number,
            status
          `)
          .in('block_id', blockIds)


        if (flatsError) {

          console.error(
            'Flats error:',
            flatsError
          )

        } else {

          flats = data || []

        }

      }


      /* =========================
         4. Load Complaints
      ========================== */

      const {
        data: complaints,
        error: complaintsError
      } = await supabase
        .from('complaints')
        .select('id, status')
        .eq('apartment_id', APARTMENT_ID)


      if (complaintsError) {

        console.error(
          'Complaints error:',
          complaintsError
        )

      }


      /* =========================
         5. Load Fund Balances
      ========================== */

      const {
        data: funds,
        error: fundsError
      } = await supabase
        .from('v_fund_balances')
        .select(`
          fund_name,
          fund_type,
          current_balance
        `)


      if (fundsError) {

        console.error(
          'Fund balances error:',
          fundsError
        )

      }


      /* =========================
         6. Load Monthly Summary
      ========================== */

      const {
        data: monthlySummary,
        error: summaryError
      } = await supabase
        .from('v_monthly_financial_summary')
        .select(`
          financial_month,
          total_income,
          total_expenses,
          net_balance
        `)
        .order(
          'financial_month',
          { ascending: false }
        )
        .limit(1)


      if (summaryError) {

        console.error(
          'Monthly financial summary error:',
          summaryError
        )

      }


      /* =========================
         7. Calculate Flat Stats
      ========================== */

      const totalFlats =
        flats.length


      const occupiedFlats =
        flats.filter(
          flat =>
            flat.status === 'OCCUPIED'
        ).length


      const vacantFlats =
        flats.filter(
          flat =>
            flat.status === 'VACANT'
        ).length


      /* =========================
         8. Calculate Complaints
      ========================== */

      const openComplaints =
        complaints?.filter(
          complaint =>
            complaint.status === 'OPEN' ||
            complaint.status === 'IN_PROGRESS'
        ).length || 0


      /* =========================
         9. Fund Balances
      ========================== */

      const maintenanceFund =
        funds?.find(
          fund =>
            fund.fund_type === 'MAINTENANCE'
        )?.current_balance || 0


      const corpusFund =
        funds?.find(
          fund =>
            fund.fund_type === 'CORPUS'
        )?.current_balance || 0


      /* =========================
         10. Monthly Summary
      ========================== */

      const latestMonth =
        monthlySummary?.[0]


      const monthlyIncome =
        Number(
          latestMonth?.total_income || 0
        )


      const monthlyExpenses =
        Number(
          latestMonth?.total_expenses || 0
        )


      const monthlyNetBalance =
        Number(
          latestMonth?.net_balance || 0
        )


      /* =========================
         11. Update Dashboard
      ========================== */

      setStats({

        totalFlats,

        occupiedFlats,

        vacantFlats,

        openComplaints,

        maintenanceFund:
          Number(maintenanceFund),

        corpusFund:
          Number(corpusFund),

        monthlyIncome,

        monthlyExpenses,

        monthlyNetBalance

      })


      setLastUpdated(
        new Date()
      )

    } catch (error) {

      console.error(
        'Dashboard loading error:',
        error
      )

    } finally {

      setLoading(false)
      setRefreshing(false)

    }

  }


  /* =========================
     Navigation
  ========================== */

  function navigate(page) {

    if (onNavigate) {
      onNavigate(page)
    }

  }


  /* =========================
     Currency
  ========================== */

  function formatCurrency(value) {

    return Number(value || 0)
      .toLocaleString('en-IN', {
        maximumFractionDigits: 2
      })

  }


  /* =========================
     Time
  ========================== */

  function formatTime(date) {

    if (!date) return ''

    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    )

  }


  return (

    <div className="dashboard-page">


      {/* =========================
          Welcome Header
      ========================== */}

      <div className="welcome-section">

        <div>

          <h2>
            Welcome back,{' '}
            {user?.full_name || 'Admin'} 👋
          </h2>

          <p>
            {apartmentName}
          </p>

        </div>


        <div className="dashboard-refresh">

          {lastUpdated && (
            <span>
              Updated {formatTime(lastUpdated)}
            </span>
          )}

          <button
            className="refresh-button"
            onClick={() =>
              loadDashboardData(true)
            }
            disabled={refreshing}
            title="Refresh dashboard"
          >
            {refreshing ? '↻' : '⟳'}

            <span>
              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}
            </span>

          </button>

        </div>

      </div>


      {/* =========================
          Statistics
      ========================== */}

      <div className="stats-grid">


        {/* Total Flats */}

        <button
          className="stat-card clickable-card"
          onClick={() => navigate('flats')}
        >

          <div className="stat-icon">
            🏢
          </div>

          <div className="stat-content">

            <p>Total Flats</p>

            <h3>
              {loading
                ? '--'
                : stats.totalFlats}
            </h3>

          </div>

          <span className="card-arrow">
            →
          </span>

        </button>


        {/* Occupied Flats */}

        <button
          className="stat-card clickable-card"
          onClick={() => navigate('flats')}
        >

          <div className="stat-icon">
            🏠
          </div>

          <div className="stat-content">

            <p>Occupied Flats</p>

            <h3>
              {loading
                ? '--'
                : stats.occupiedFlats}
            </h3>

          </div>

          <span className="card-arrow">
            →
          </span>

        </button>


        {/* Vacant Flats */}

        <button
          className="stat-card clickable-card"
          onClick={() => navigate('flats')}
        >

          <div className="stat-icon">
            🔑
          </div>

          <div className="stat-content">

            <p>Vacant Flats</p>

            <h3>
              {loading
                ? '--'
                : stats.vacantFlats}
            </h3>

          </div>

          <span className="card-arrow">
            →
          </span>

        </button>


        {/* Open Complaints */}

        <button
          className="stat-card clickable-card complaint-stat"
          onClick={() =>
            navigate('complaints')
          }
        >

          <div className="stat-icon">
            ⚠️
          </div>

          <div className="stat-content">

            <p>Open Complaints</p>

            <h3>
              {loading
                ? '--'
                : stats.openComplaints}
            </h3>

          </div>

          <span className="card-arrow">
            →
          </span>

        </button>


      </div>


      {/* =========================
          Financial Overview
      ========================== */}

      <div className="financial-section">

        <div className="section-header">

          <div>

            <h3>
              Financial Overview
            </h3>

            <p>
              Current apartment financial status
            </p>

          </div>

        </div>


        <div className="financial-grid">


          {/* Maintenance Fund */}

          <button
            className="fund-card clickable-financial"
            onClick={() => navigate('funds')}
          >

            <div className="fund-icon">
              💰
            </div>

            <div className="fund-content">

              <p>
                Maintenance Fund
              </p>

              <h2>
                ₹ {formatCurrency(
                  stats.maintenanceFund
                )}
              </h2>

            </div>

            <span className="financial-arrow">
              →
            </span>

          </button>


          {/* Corpus Fund */}

          <button
            className="fund-card clickable-financial"
            onClick={() => navigate('funds')}
          >

            <div className="fund-icon">
              🏦
            </div>

            <div className="fund-content">

              <p>
                Corpus Fund
              </p>

              <h2>
                ₹ {formatCurrency(
                  stats.corpusFund
                )}
              </h2>

            </div>

            <span className="financial-arrow">
              →
            </span>

          </button>


        </div>


        {/* =========================
            Monthly Summary
        ========================== */}

        <div className="monthly-summary">

          <h3>
            Latest Monthly Summary
          </h3>


          <div className="monthly-grid">


            {/* Monthly Income */}

            <button
              className="monthly-item clickable-monthly"
              onClick={() =>
                navigate('payments')
              }
            >

              <span>
                Monthly Income
              </span>

              <strong>
                ₹ {formatCurrency(
                  stats.monthlyIncome
                )}
              </strong>

              <small>
                View payments →
              </small>

            </button>


            {/* Monthly Expenses */}

            <button
              className="monthly-item clickable-monthly"
              onClick={() =>
                navigate('expenses')
              }
            >

              <span>
                Monthly Expenses
              </span>

              <strong>
                ₹ {formatCurrency(
                  stats.monthlyExpenses
                )}
              </strong>

              <small>
                View expenses →
              </small>

            </button>


            {/* Net Balance */}

            <button
              className="monthly-item net-balance clickable-monthly"
              onClick={() =>
                navigate('funds')
              }
            >

              <span>
                Net Balance
              </span>

              <strong>
                ₹ {formatCurrency(
                  stats.monthlyNetBalance
                )}
              </strong>

              <small>
                View financials →
              </small>

            </button>


          </div>

        </div>


      </div>


      {/* =========================
          Quick Actions
      ========================== */}

      <div className="quick-actions-section">

        <div className="section-header">

          <div>

            <h3>
              Quick Actions
            </h3>

            <p>
              Common apartment management tasks
            </p>

          </div>

        </div>


        <div className="quick-actions-grid">


          <button
            className="quick-action"
            onClick={() =>
              navigate('complaints')
            }
          >

            <span className="quick-action-icon">
              ⚠️
            </span>

            <span className="quick-action-text">

              <strong>
                Complaints
              </strong>

              <small>
                Manage complaints
              </small>

            </span>

            <span className="quick-action-arrow">
              →
            </span>

          </button>


          <button
            className="quick-action"
            onClick={() =>
              navigate('expenses')
            }
          >

            <span className="quick-action-icon">
              💸
            </span>

            <span className="quick-action-text">

              <strong>
                Expenses
              </strong>

              <small>
                Manage expenses
              </small>

            </span>

            <span className="quick-action-arrow">
              →
            </span>

          </button>


          <button
            className="quick-action"
            onClick={() =>
              navigate('notices')
            }
          >

            <span className="quick-action-icon">
              📢
            </span>

            <span className="quick-action-text">

              <strong>
                Notices
              </strong>

              <small>
                Manage notices
              </small>

            </span>

            <span className="quick-action-arrow">
              →
            </span>

          </button>


          <button
            className="quick-action"
            onClick={() =>
              navigate('users')
            }
          >

            <span className="quick-action-icon">
              👤
            </span>

            <span className="quick-action-text">

              <strong>
                Users
              </strong>

              <small>
                Manage residents
              </small>

            </span>

            <span className="quick-action-arrow">
              →
            </span>

          </button>


          <button
            className="quick-action"
            onClick={() =>
              navigate('flats')
            }
          >

            <span className="quick-action-icon">
              🏢
            </span>

            <span className="quick-action-text">

              <strong>
                Flats
              </strong>

              <small>
                Manage flats
              </small>

            </span>

            <span className="quick-action-arrow">
              →
            </span>

          </button>


          <button
            className="quick-action"
            onClick={() =>
              navigate('funds')
            }
          >

            <span className="quick-action-icon">
              🏦
            </span>

            <span className="quick-action-text">

              <strong>
                Funds
              </strong>

              <small>
                View fund balances
              </small>

            </span>

            <span className="quick-action-arrow">
              →
            </span>

          </button>


        </div>

      </div>


    </div>

  )
}

export default Dashboard
