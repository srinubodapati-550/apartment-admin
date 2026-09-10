import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Dashboard.css'

function Dashboard({ user }) {

  const [loading, setLoading] = useState(true)

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


  async function loadDashboardData() {

    setLoading(true)


    /* -------------------------
       1. Load Apartment
    -------------------------- */

    const { data: apartments, error: apartmentError } =
      await supabase
        .from('apartments')
        .select('id, name')
        .limit(1)


    if (apartmentError) {

      console.error(
        'Apartment error:',
        apartmentError
      )

    }


    if (
      apartments &&
      apartments.length > 0
    ) {

      setApartmentName(
        apartments[0].name
      )

    }


    /* -------------------------
       2. Load Flats
    -------------------------- */

    const { data: flats, error: flatsError } =
      await supabase
        .from('flats')
        .select('id, status')


    if (flatsError) {

      console.error(
        'Flats error:',
        flatsError
      )

      setLoading(false)

      return

    }
/* -------------------------
   3. Load Open Complaints
-------------------------- */

const { data: complaints, error: complaintsError } =
  await supabase
    .from('complaints')
    .select('id, status')


if (complaintsError) {

  console.error(
    'Complaints error:',
    complaintsError
  )

        }

        /* -------------------------
   Load Fund Balances
-------------------------- */

const { data: funds, error: fundsError } =
  await supabase
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

    /* -------------------------
   Load Monthly Financial Summary
-------------------------- */

const { data: monthlySummary, error: summaryError } =
  await supabase
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

    /* -------------------------
       3. Calculate Statistics
    -------------------------- */

    const totalFlats =
      flats?.length || 0


    const occupiedFlats =
      flats?.filter(
        (flat) =>
          flat.status === 'OCCUPIED'
      ).length || 0


    const vacantFlats =
      flats?.filter(
        (flat) =>
          flat.status === 'VACANT'
      ).length || 0

      const openComplaints =
        complaints?.filter(
         (complaint) =>
         complaint.status === 'OPEN' ||
         complaint.status === 'IN_PROGRESS'
        ).length || 0

/* -------------------------
   Calculate Fund Balances
-------------------------- */

const maintenanceFund =
  funds?.find(
    (fund) =>
      fund.fund_type === 'MAINTENANCE'
  )?.current_balance || 0


const corpusFund =
  funds?.find(
    (fund) =>
      fund.fund_type === 'CORPUS'
  )?.current_balance || 0


/* -------------------------
   Monthly Financial Data
-------------------------- */

const latestMonth =
  monthlySummary?.[0]


const monthlyIncome =
  latestMonth?.total_income || 0


const monthlyExpenses =
  latestMonth?.total_expenses || 0


const monthlyNetBalance =
  latestMonth?.net_balance || 0

 setStats({

  totalFlats,

  occupiedFlats,

  vacantFlats,

  openComplaints,

  maintenanceFund,

  corpusFund,

  monthlyIncome,

  monthlyExpenses,

  monthlyNetBalance

})


    setLoading(false)

  }


  return (

    <div className="dashboard-page">


      {/* Welcome */}

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

      </div>


      {/* Statistics */}

      <div className="stats-grid">


        {/* Total Flats */}

        <div className="stat-card">

          <div className="stat-icon">
            🏢
          </div>

          <div>

            <p>Total Flats</p>

            <h3>
              {loading
                ? '--'
                : stats.totalFlats}
            </h3>

          </div>

        </div>


        {/* Occupied Flats */}

        <div className="stat-card">

          <div className="stat-icon">
            🏠
          </div>

          <div>

            <p>Occupied Flats</p>

            <h3>
              {loading
                ? '--'
                : stats.occupiedFlats}
            </h3>

          </div>

        </div>


        {/* Vacant Flats */}

        <div className="stat-card">

          <div className="stat-icon">
            🔑
          </div>

          <div>

            <p>Vacant Flats</p>

            <h3>
              {loading
                ? '--'
                : stats.vacantFlats}
            </h3>

          </div>

        </div>


        {/* Open Complaints */}

        <div className="stat-card">

          <div className="stat-icon">
            ⚠️
          </div>

          <div>

            <p>Open Complaints</p>

            <h3>
             {loading
                ? '--'
                 : stats.openComplaints}
            </h3>

          </div>

        </div>


      </div>


{/* Financial Overview */}

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

    <div className="fund-card">

      <div className="fund-icon">
        💰
      </div>

      <div>

        <p>
          Maintenance Fund
        </p>

        <h2>
          ₹ {Number(
            stats.maintenanceFund
          ).toLocaleString('en-IN')}
        </h2>

      </div>

    </div>


    {/* Corpus Fund */}

    <div className="fund-card">

      <div className="fund-icon">
        🏦
      </div>

      <div>

        <p>
          Corpus Fund
        </p>

        <h2>
          ₹ {Number(
            stats.corpusFund
          ).toLocaleString('en-IN')}
        </h2>

      </div>

    </div>

  </div>


  {/* Monthly Summary */}

  <div className="monthly-summary">

    <h3>
      Latest Monthly Summary
    </h3>


    <div className="monthly-grid">


      <div className="monthly-item">

        <span>
          Monthly Income
        </span>

        <strong>
          ₹ {Number(
            stats.monthlyIncome
          ).toLocaleString('en-IN')}
        </strong>

      </div>


      <div className="monthly-item">

        <span>
          Monthly Expenses
        </span>

        <strong>
          ₹ {Number(
            stats.monthlyExpenses
          ).toLocaleString('en-IN')}
        </strong>

      </div>


      <div className="monthly-item net-balance">

        <span>
          Net Balance
        </span>

        <strong>
          ₹ {Number(
            stats.monthlyNetBalance
          ).toLocaleString('en-IN')}
        </strong>

      </div>


    </div>

  </div>

</div>


    </div>

  )

}

export default Dashboard