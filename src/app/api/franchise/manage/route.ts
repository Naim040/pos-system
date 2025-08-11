import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withLicenseProtection } from '@/lib/licenseMiddleware'

// Get all franchises (admin only)
async function getFranchises() {
  try {
    const franchises = await db.franchise.findMany({
      include: {
        users: {
          include: {
            user: true
          }
        },
        clients: true,
        royaltyPayments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        licenses: {
          take: 5
        },
        _count: {
          select: {
            clients: true,
            users: true,
            licenses: true,
            royaltyPayments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ franchises })
  } catch (error) {
    console.error('Get franchises error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch franchises' },
      { status: 500 }
    )
  }
}

// Create new franchise (admin only)
async function createFranchise(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      website,
      contactPerson,
      businessLicense,
      taxId,
      oneTimeFee,
      monthlyFee,
      maxClients,
      contractStart,
      contractEnd,
      adminName,
      adminEmail
    } = data

    // Validate required fields
    if (!name || !email || !contactPerson || !adminName || !adminEmail) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      )
    }

    // Check if franchise email already exists
    const existingFranchise = await db.franchise.findUnique({
      where: { email }
    })

    if (existingFranchise) {
      return NextResponse.json(
        { error: 'Franchise with this email already exists' },
        { status: 409 }
      )
    }

    // Check if admin user already exists
    const existingUser = await db.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create the admin user
    const adminUser = await db.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        role: 'franchise',
        status: 'active'
      }
    })

    // Create the franchise
    const franchise = await db.franchise.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        website,
        contactPerson,
        businessLicense,
        taxId,
        oneTimeFee: oneTimeFee || 20.00,
        monthlyFee: monthlyFee || 5.00,
        maxClients: maxClients || 50,
        contractStart: contractStart ? new Date(contractStart) : null,
        contractEnd: contractEnd ? new Date(contractEnd) : null,
        status: 'approved',
        approvedBy: 'system', // In real app, this would be the current admin user
        approvedAt: new Date(),
        createdBy: adminUser.id
      }
    })

    // Create the franchise user relationship
    await db.franchiseUser.create({
      data: {
        franchiseId: franchise.id,
        userId: adminUser.id,
        role: 'admin',
        isActive: true
      }
    })

    return NextResponse.json({
      message: 'Franchise created successfully',
      franchise: {
        id: franchise.id,
        name: franchise.name,
        email: franchise.email,
        status: franchise.status
      },
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name
      }
    })

  } catch (error) {
    console.error('Create franchise error:', error)
    return NextResponse.json(
      { error: 'Failed to create franchise' },
      { status: 500 }
    )
  }
}

// Update franchise status (admin only)
async function updateFranchiseStatus(request: NextRequest) {
  try {
    const { franchiseId, status, blockReason } = await request.json()

    if (!franchiseId || !status) {
      return NextResponse.json(
        { error: 'Franchise ID and status are required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (status === 'approved') {
      updateData.approvedAt = new Date()
      // In real app, set approvedBy to current admin user
    }

    if (status === 'suspended' || blockReason) {
      updateData.isBlocked = true
      updateData.blockReason = blockReason
    } else {
      updateData.isBlocked = false
      updateData.blockReason = null
    }

    const franchise = await db.franchise.update({
      where: { id: franchiseId },
      data: updateData
    })

    return NextResponse.json({
      message: 'Franchise status updated successfully',
      franchise
    })

  } catch (error) {
    console.error('Update franchise status error:', error)
    return NextResponse.json(
      { error: 'Failed to update franchise status' },
      { status: 500 }
    )
  }
}

export const GET = withLicenseProtection(async (request: NextRequest) => {
  return getFranchises()
})

export const POST = withLicenseProtection(async (request: NextRequest) => {
  const { action } = await request.json()
  
  if (action === 'create') {
    return createFranchise(request)
  } else if (action === 'update_status') {
    return updateFranchiseStatus(request)
  }
  
  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  )
})