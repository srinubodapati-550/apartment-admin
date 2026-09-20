import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './Flats.css'

function Flats() {

  const [loading, setLoading] = useState(true)

  const [flats, setFlats] = useState([])

  const [flatMembers, setFlatMembers] = useState([])

  const [residents, setResidents] = useState([])

  const [newMemberId, setNewMemberId] = useState('')
  const [newMemberRelationship, setNewMemberRelationship] = useState('FAMILY')

  const [blocks, setBlocks] = useState([])

  const [selectedBlock, setSelectedBlock] =
    useState('ALL')

  const [selectedStatus, setSelectedStatus] =
    useState('ALL')

    const [showAddModal, setShowAddModal] =
     useState(false)

    const [formData, setFormData] =
     useState({
    blockId: '',
    flatNumber: '',
    floorNumber: '',
    flatType: '',
    areaSqft: '',
    status: 'VACANT'
    })

const [showEditModal, setShowEditModal] =
  useState(false)

const [selectedFlat, setSelectedFlat] =
  useState(null)

const [editFormData, setEditFormData] = useState({
  blockId: '',
  flatNumber: '',
  floorNumber: '',
  flatType: '',
  areaSqft: '',
  status: 'VACANT',
  ownerId: '',
  ownerPhone: '',
  memberCount: 0
})

  useEffect(() => {

    loadData()

  }, [])


  async function loadData() {

    setLoading(true)

await Promise.all([
  loadFlats(),
  loadBlocks(),
  loadFlatMembers(),
  loadResidents()
])

    setLoading(false)

  }


  async function loadFlats() {

    const { data, error } = await supabase
      .from('flats')
      .select(`
        id,
        flat_number,
        floor_number,
        flat_type,
        area_sqft,
        status,
        block_id,
        member_count,
        blocks (
          id,
          name
        )
      `)
      .order(
        'flat_number',
        {
          ascending: true
        }
      )


    if (error) {

      console.error(
        'Error loading flats:',
        error
      )

      alert(
        `Unable to load flats: ${error.message}`
      )

      return

    }


    setFlats(data || [])

  }

async function loadFlatMembers() {
  const { data, error } = await supabase
    .from('flat_members')
    .select(`
      id,
      flat_id,
      user_id,
      relationship,
      is_primary,
      status,
      users (*)
    `)
    .eq('status', 'ACTIVE')

  if (error) {
    console.error('Error loading flat members:', error)
    alert(`Unable to load flat residents: ${error.message}`)
    return
  }

  setFlatMembers(data || [])
}

async function loadResidents() {

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      phone,
      role,
      status
    `)
    .eq('role', 'RESIDENT')
    .eq('status', 'ACTIVE')
    .order('full_name', {
      ascending: true
    })

  if (error) {

    console.error(
      'Error loading residents:',
      error
    )

    alert(
      `Unable to load residents: ${error.message}`
    )

    return
  }

  setResidents(data || [])
}

function getFlatOwner(flatId) {

  const owner = flatMembers.find(
    (member) =>
      member.flat_id === flatId &&
      member.relationship === 'OWNER' &&
      member.is_primary === true &&
      member.status === 'ACTIVE'
  )

  if (!owner) {
    return '-'
  }

  const user = owner.users

  if (!user) {
    return '-'
  }

  return (
    user.full_name ||
    user.name ||
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.email ||
    '-'
  )
}


function getFlatMemberCount(flatId) {

  return flatMembers.filter(
    (member) =>
      member.flat_id === flatId &&
      member.status === 'ACTIVE'
  ).length
}


  async function loadBlocks() {

    const { data, error } = await supabase
      .from('blocks')
      .select(`
        id,
        name
      `)
      .order(
        'name',
        {
          ascending: true
        }
      )


    if (error) {

      console.error(
        'Error loading blocks:',
        error
      )

      return

    }


    setBlocks(data || [])

  }


  const filteredFlats =
    flats.filter((flat) => {

      const blockMatch =
        selectedBlock === 'ALL' ||
        flat.block_id === selectedBlock


      const statusMatch =
        selectedStatus === 'ALL' ||
        flat.status === selectedStatus


      return (
        blockMatch &&
        statusMatch
      )

    })


  const totalFlats =
    flats.length


  const occupiedFlats =
    flats.filter(
      (flat) =>
        flat.status === 'OCCUPIED'
    ).length


  const vacantFlats =
    flats.filter(
      (flat) =>
        flat.status === 'VACANT'
    ).length


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

async function addFlat(event) {

  event.preventDefault()


  if (
    !formData.blockId ||
    !formData.flatNumber ||
    !formData.floorNumber
  ) {

    alert(
      'Please fill all required fields.'
    )

    return

  }


  const { error } = await supabase
    .from('flats')
    .insert({

      block_id:
        formData.blockId,

      flat_number:
        formData.flatNumber.trim(),

      floor_number:
        Number(formData.floorNumber),

      flat_type:
        formData.flatType || null,

      area_sqft:
        formData.areaSqft
          ? Number(formData.areaSqft)
          : null,

      status:
        formData.status

    })


  if (error) {

    console.error(
      'Add flat error:',
      error
    )

    alert(
      `Unable to add flat: ${error.message}`
    )

    return

  }


  alert(
    'Flat added successfully.'
  )


  setShowAddModal(false)


  setFormData({

    blockId: '',
    flatNumber: '',
    floorNumber: '',
    flatType: '',
    areaSqft: '',
    status: 'VACANT'

  })


  await loadFlats()

}

function openEditModal(flat) {
  setSelectedFlat(flat)

  const currentOwner = flatMembers.find(
    (member) =>
      member.flat_id === flat.id &&
      member.relationship === 'OWNER' &&
      member.is_primary === true &&
      member.status === 'ACTIVE'
  )

  setEditFormData({
  blockId: flat.block_id,
  flatNumber: flat.flat_number,
  floorNumber: flat.floor_number,
  flatType: flat.flat_type,
  areaSqft: flat.area_sqft,
  status: flat.status,
  ownerId: currentOwner ? currentOwner.user_id : '',
  ownerPhone: currentOwner?.users?.phone || '',
  memberCount: flat.member_count || 0
})

  setShowEditModal(true)
}

function handleEditChange(event) {

  const {
    name,
    value
  } = event.target

  if (name === 'status') {

    setEditFormData({
      ...editFormData,
      status: value,
      memberCount:
        value === 'VACANT'
          ? 0
          : Number(editFormData.memberCount) < 1
            ? 1
            : editFormData.memberCount,
      ownerId:
        value === 'VACANT'
          ? ''
          : editFormData.ownerId
    })

    return
  }

  setEditFormData({

    ...editFormData,

    [name]: value

  })

}

async function addMember() {

  if (!selectedFlat) {
    alert('Please select a flat.')
    return
  }

  if (!newMemberId) {
    alert('Please select a resident.')
    return
  }

  const alreadyMember = flatMembers.some(
    (member) =>
      member.flat_id === selectedFlat.id &&
      member.user_id === newMemberId &&
      member.status === 'ACTIVE'
  )

  if (alreadyMember) {
    alert('This resident is already a member of this flat.')
    return
  }

  const { error } = await supabase
    .from('flat_members')
    .insert({
      flat_id: selectedFlat.id,
      user_id: newMemberId,
      relationship: newMemberRelationship,
      is_primary: false,
      status: 'ACTIVE',
      move_in_date: new Date()
        .toISOString()
        .split('T')[0]
    })

  if (error) {
    console.error('Add member error:', error)

    alert(
      `Unable to add member: ${error.message}`
    )

    return
  }

  alert('Member added successfully.')

  setNewMemberId('')
  setNewMemberRelationship('FAMILY')

  await loadFlatMembers()
}

async function updateFlat(event) {

  event.preventDefault()

  const memberCount = Number(
    editFormData.memberCount
  )

  if (editFormData.status === 'VACANT') {

    if (memberCount !== 0) {
      alert(
        'A vacant flat must have 0 members.'
      )
      return
    }

  }

  if (editFormData.status === 'OCCUPIED') {

    if (memberCount < 1) {
      alert(
        'An occupied flat must have at least 1 member.'
      )
      return
    }

  }

  if (
    !editFormData.blockId ||
    !editFormData.flatNumber ||
    !editFormData.floorNumber
  ) {

    alert(
      'Please fill all required fields.'
    )

    return

  }


  // 1. Update flat details
  const { error } = await supabase
    .from('flats')
    .update({


      block_id:
        editFormData.blockId,

      flat_number:
        editFormData.flatNumber.trim(),

      floor_number:
        Number(editFormData.floorNumber),

      flat_type:
        editFormData.flatType || null,

      area_sqft:
        editFormData.areaSqft
          ? Number(editFormData.areaSqft)
          : null,

      status:
        editFormData.status,

      member_count:
      Number(editFormData.memberCount)

    })
    .eq(
      'id',
      selectedFlat.id
    )


  if (error) {

    console.error(
      'Update flat error:',
      error
    )

    alert(
      `Unable to update flat: ${error.message}`
    )

    return

  }


  // 2. Update owner phone number
  if (editFormData.ownerId) {

    const { error: phoneError } = await supabase
      .from('users')
      .update({
        phone:
          editFormData.ownerPhone
            ? editFormData.ownerPhone.trim()
            : null
      })
      .eq(
        'id',
        editFormData.ownerId
      )


    if (phoneError) {

      console.error(
        'Update owner phone error:',
        phoneError
      )

      alert(
        `Flat updated, but owner phone could not be updated: ${phoneError.message}`
      )

      return

    }

  }


  // 3. Find current primary owner
  const existingOwner = flatMembers.find(
    (member) =>
      member.flat_id === selectedFlat.id &&
      member.relationship === 'OWNER' &&
      member.is_primary === true &&
      member.status === 'ACTIVE'
  )


  // 4. If the flat is being made vacant,
  //    deactivate the current primary owner.
  if (editFormData.status === 'VACANT') {

    const currentOwner = flatMembers.find(
      (member) =>
        member.flat_id === selectedFlat.id &&
        member.relationship === 'OWNER' &&
        member.is_primary === true &&
        member.status === 'ACTIVE'
    )

    if (currentOwner) {

      const { error: vacantOwnerError } =
        await supabase
          .from('flat_members')
          .update({
            status: 'INACTIVE',
            is_primary: false,
            move_out_date:
              new Date()
                .toISOString()
                .split('T')[0]
          })
          .eq(
            'id',
            currentOwner.id
          )

      if (vacantOwnerError) {

        console.error(
          'Deactivate owner for vacant flat error:',
          vacantOwnerError
        )

        alert(
          `Flat status changed, but owner could not be removed: ${vacantOwnerError.message}`
        )

        return
      }
    }

  }

  // 5. Change owner if required
  if (
    editFormData.ownerId &&
    (!existingOwner ||
      existingOwner.user_id !== editFormData.ownerId)
  ) {

    // Deactivate previous owner
    if (existingOwner) {

      const { error: oldOwnerError } = await supabase
        .from('flat_members')
        .update({
          status: 'INACTIVE',
          is_primary: false,
          move_out_date:
            new Date()
              .toISOString()
              .split('T')[0]
        })
        .eq(
          'id',
          existingOwner.id
        )


      if (oldOwnerError) {

        console.error(
          'Deactivate old owner error:',
          oldOwnerError
        )

        alert(
          `Flat updated, but previous owner could not be changed: ${oldOwnerError.message}`
        )

        return

      }

    }


    // Check whether new owner already belongs to this flat
    const { data: existingMembership, error: membershipCheckError } =
      await supabase
        .from('flat_members')
        .select('id')
        .eq(
          'flat_id',
          selectedFlat.id
        )
        .eq(
          'user_id',
          editFormData.ownerId
        )
        .maybeSingle()


    if (membershipCheckError) {

      console.error(
        'Check owner membership error:',
        membershipCheckError
      )

      alert(
        `Unable to check owner membership: ${membershipCheckError.message}`
      )

      return

    }


    if (existingMembership) {

      // Reactivate existing membership
      const { error: membershipUpdateError } =
        await supabase
          .from('flat_members')
          .update({
            relationship: 'OWNER',
            is_primary: true,
            status: 'ACTIVE',
            move_out_date: null
          })
          .eq(
            'id',
            existingMembership.id
          )


      if (membershipUpdateError) {

        console.error(
          'Update owner membership error:',
          membershipUpdateError
        )

        alert(
          `Unable to update owner: ${membershipUpdateError.message}`
        )

        return

      }

    } else {

      // Create new owner membership
      const { error: membershipInsertError } =
        await supabase
          .from('flat_members')
          .insert({
            flat_id:
              selectedFlat.id,

            user_id:
              editFormData.ownerId,

            relationship:
              'OWNER',

            is_primary:
              true,

            status:
              'ACTIVE',

            move_in_date:
              new Date()
                .toISOString()
                .split('T')[0]
          })


      if (membershipInsertError) {

        console.error(
          'Insert owner membership error:',
          membershipInsertError
        )

        alert(
          `Unable to add owner: ${membershipInsertError.message}`
        )

        return

      }

    }

  }


  alert(
    'Flat updated successfully.'
  )


  setShowEditModal(false)

  setSelectedFlat(null)


  await loadData()

}

  return (

    <div className="flats-page">


      {/* PAGE HEADER */}

      <div className="page-title-section">

        <div>

          <h2>
            Flats
          </h2>

          <p>
            Manage apartment flats and occupancy.
          </p>

        </div>


<button
  className="primary-button"
  onClick={() =>
    setShowAddModal(true)
  }
>
  + Add Flat
</button>

      </div>


      {/* SUMMARY CARDS */}

      <div className="flats-summary">


        <div className="summary-card">

          <span>
            Total Flats
          </span>

          <strong>
            {totalFlats}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Occupied
          </span>

          <strong>
            {occupiedFlats}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Vacant
          </span>

          <strong>
            {vacantFlats}
          </strong>

        </div>


      </div>


      {/* FLATS SECTION */}

      <div className="flats-section">


        <div className="flats-section-header">

          <div>

            <h3>
              All Flats
            </h3>

            <p>
              View and manage all flats.
            </p>

          </div>


          {/* FILTERS */}

          <div className="flats-filters">


            <select
              value={selectedBlock}
              onChange={(event) =>
                setSelectedBlock(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                All Blocks
              </option>


              {

                blocks.map(
                  (block) => (

                    <option
                      key={block.id}
                      value={block.id}
                    >

                      {block.name}

                    </option>

                  )
                )

              }

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

              <option value="OCCUPIED">
                Occupied
              </option>

              <option value="VACANT">
                Vacant
              </option>

            </select>


          </div>

        </div>


        {

          loading ? (

            <div className="empty-state">

              Loading flats...

            </div>

          ) : filteredFlats.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                🏢
              </div>

              <h3>
                No flats found
              </h3>

              <p>
                No flats match the selected filters.
              </p>

            </div>

          ) : (

            <div className="flats-table-wrapper">

              <table className="flats-table">

                <thead>

                  <tr>

                    <th>
                      Flat
                    </th>

                    <th>
                      Block
                    </th>

                    <th>
                      Floor
                    </th>

                    <th>
                      Type
                    </th>

<th>
  Area
</th>

<th>
  Owner
</th>

<th>
  Members
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

                    filteredFlats.map(
                      (flat) => (

                        <tr
                          key={flat.id}
                        >

                          <td>

                            <strong>
                              {flat.flat_number}
                            </strong>

                          </td>


                          <td>

                            {flat.blocks?.name || '-'}

                          </td>


                          <td>

                            {flat.floor_number || '-'}

                          </td>


                          <td>

                            {flat.flat_type || '-'}

                          </td>


<td>

  {
    flat.area_sqft
      ? `${flat.area_sqft} sq.ft`
      : '-'
  }

</td>


<td>

  <div className="flat-owner">

    <strong>
      {getFlatOwner(flat.id)}
    </strong>

  </div>

</td>


<td>

  <span className="member-count">

    {flat.member_count || 0}

  </span>

</td>


<td>

  <span
    className={
      `flat-status ${flat.status}`
    }
  >

    {flat.status}

  </span>

</td>


                          <td>

<button
  className="edit-flat-button"
  onClick={() =>
    openEditModal(flat)
  }
>
  ✏️ Edit
</button>

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
{
  showAddModal && (

    <div className="modal-overlay">

      <div className="flat-modal">


        {/* MODAL HEADER */}

        <div className="modal-header">

          <div>

            <h3>
              Add Flat
            </h3>

            <p>
              Add a new flat to the apartment.
            </p>

          </div>


          <button
            className="close-button"
            onClick={() =>
              setShowAddModal(false)
            }
          >
            ✕
          </button>

        </div>


        <form
          onSubmit={addFlat}
        >


          {/* BLOCK */}

          <div className="form-group">

            <label>
              Block *
            </label>

            <select
              name="blockId"
              value={formData.blockId}
              onChange={handleChange}
              required
            >

              <option value="">
                Select Block
              </option>


              {
                blocks.map(
                  (block) => (

                    <option
                      key={block.id}
                      value={block.id}
                    >

                      {block.name}

                    </option>

                  )
                )
              }

            </select>

          </div>


          {/* FLAT NUMBER */}

          <div className="form-group">

            <label>
              Flat Number *
            </label>

            <input
              type="text"
              name="flatNumber"
              value={formData.flatNumber}
              onChange={handleChange}
              placeholder="Example: A-101"
              required
            />

          </div>


          {/* FLOOR */}

          <div className="form-group">

            <label>
              Floor Number *
            </label>

            <input
              type="number"
              name="floorNumber"
              value={formData.floorNumber}
              onChange={handleChange}
              placeholder="Example: 1"
              min="0"
              required
            />

          </div>


          {/* FLAT TYPE */}

          <div className="form-group">

            <label>
              Flat Type
            </label>

            <select
              name="flatType"
              value={formData.flatType}
              onChange={handleChange}
            >

              <option value="">
                Select Type
              </option>

              <option value="1BHK">
                1 BHK
              </option>

              <option value="2BHK">
                2 BHK
              </option>

              <option value="3BHK">
                3 BHK
              </option>

              <option value="4BHK">
                4 BHK
              </option>

              <option value="VILLA">
                Villa
              </option>

            </select>

          </div>


          {/* AREA */}

          <div className="form-group">

            <label>
              Area (sq.ft)
            </label>

            <input
              type="number"
              name="areaSqft"
              value={formData.areaSqft}
              onChange={handleChange}
              placeholder="Example: 1200"
              min="1"
            />

          </div>


          {/* STATUS */}

          <div className="form-group">

            <label>
              Status
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >

              <option value="VACANT">
                Vacant
              </option>

              <option value="OCCUPIED">
                Occupied
              </option>

            </select>

          </div>


          {/* ACTIONS */}

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setShowAddModal(false)
              }
            >

              Cancel

            </button>


            <button
              type="submit"
              className="primary-button"
            >

              Add Flat

            </button>

          </div>


        </form>


      </div>

    </div>

  )
}

{
  showEditModal &&
  selectedFlat && (

    <div className="modal-overlay">

      <div className="flat-modal">


        <div className="modal-header">

          <div>

            <h3>
              Edit Flat
            </h3>

            <p>
              Update flat details.
            </p>

          </div>


          <button
            className="close-button"
            onClick={() => {

              setShowEditModal(false)

              setSelectedFlat(null)

            }}
          >
            ✕
          </button>

        </div>


        <form
          onSubmit={updateFlat}
        >


          {/* BLOCK */}

          <div className="form-group">

            <label>
              Block *
            </label>

            <select
              name="blockId"
              value={editFormData.blockId}
              onChange={handleEditChange}
              required
            >

              <option value="">
                Select Block
              </option>

              {
                blocks.map(
                  (block) => (

                    <option
                      key={block.id}
                      value={block.id}
                    >

                      {block.name}

                    </option>

                  )
                )
              }

            </select>

          </div>


          {/* FLAT NUMBER */}

          <div className="form-group">

            <label>
              Flat Number *
            </label>

            <input
              type="text"
              name="flatNumber"
              value={editFormData.flatNumber}
              onChange={handleEditChange}
              required
            />

          </div>


          {/* FLOOR */}

          <div className="form-group">

            <label>
              Floor Number *
            </label>

            <input
              type="number"
              name="floorNumber"
              value={editFormData.floorNumber}
              onChange={handleEditChange}
              min="0"
              required
            />

          </div>


          {/* FLAT TYPE */}

          <div className="form-group">

            <label>
              Flat Type
            </label>

            <select
              name="flatType"
              value={editFormData.flatType}
              onChange={handleEditChange}
            >

              <option value="">
                Select Type
              </option>

              <option value="1BHK">
                1 BHK
              </option>

              <option value="2BHK">
                2 BHK
              </option>

              <option value="3BHK">
                3 BHK
              </option>

              <option value="4BHK">
                4 BHK
              </option>

              <option value="VILLA">
                Villa
              </option>

            </select>

          </div>


          {/* AREA */}

          <div className="form-group">

            <label>
              Area (sq.ft)
            </label>

            <input
              type="number"
              name="areaSqft"
              value={editFormData.areaSqft}
              onChange={handleEditChange}
              min="1"
            />

          </div>
  {/* Owner */}
<div className="form-group">
  <label>Owner</label>

  <select
    value={editFormData.ownerId}
    onChange={(e) =>
      setEditFormData({
        ...editFormData,
        ownerId: e.target.value
      })
    }
  >
    <option value="">Select Owner</option>

    {residents.map((resident) => (
      <option key={resident.id} value={resident.id}>
        {resident.full_name}
        {resident.phone ? ` - ${resident.phone}` : ''}
        {resident.email ? ` - ${resident.email}` : ''}
      </option>
    ))}
  </select>
</div>

          {/* Phone */}
<div className="form-group">
  <label>Phone Number</label>

  <input
    type="tel"
    value={editFormData.ownerPhone}
    onChange={(e) =>
      setEditFormData({
        ...editFormData,
        ownerPhone: e.target.value
      })
    }
    placeholder="Enter phone number"
  />
</div>
          {/* Current Members*/}
<div className="form-group">
  <label>Number of Members</label>

  <input
    type="number"
    min="0"
    value={editFormData.memberCount}
    onChange={(e) =>
      setEditFormData({
        ...editFormData,
        memberCount: e.target.value
      })
    }
    placeholder="Enter number of members"
  />
</div>

          {/* STATUS */}

          <div className="form-group">

            <label>
              Status
            </label>

            <select
              name="status"
              value={editFormData.status}
              onChange={handleEditChange}
            >

              <option value="VACANT">
                Vacant
              </option>

              <option value="OCCUPIED">
                Occupied
              </option>

            </select>

          </div>


          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() => {

                setShowEditModal(false)

                setSelectedFlat(null)

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

    </div>

  )

}


export default Flats