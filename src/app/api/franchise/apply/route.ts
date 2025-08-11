import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateLicenseKey } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
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
      adminName,
      adminEmail,
      adminPassword
    } = await request.json()

    // Validate required fields
    if (!name || !email || !contactPerson || !adminName || !adminEmail || !adminPassword) {
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
        // Note: In a real implementation, you would hash the password here
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
        status: 'pending',
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
      message: 'Franchise application submitted successfully',
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
    console.error('Franchise application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}