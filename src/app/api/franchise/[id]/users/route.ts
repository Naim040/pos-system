import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withFranchiseProtection } from '@/lib/franchiseMiddleware'

// Get franchise users
export const GET = withFranchiseProtection(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const users = await db.franchiseUser.findMany({
      where: { franchiseId: params.id },
      include: {
        user: true
      },
      orderBy: { joinedAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get franchise users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch franchise users' },
      { status: 500 }
    )
  }
})

// Create new franchise user
export const POST = withFranchiseProtection(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { name, email, role, permissions } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create the user
    const user = await db.user.create({
      data: {
        email,
        name,
        role: 'franchise',
        status: 'active'
      }
    })

    // Create the franchise user relationship
    const franchiseUser = await db.franchiseUser.create({
      data: {
        franchiseId: params.id,
        userId: user.id,
        role,
        permissions: permissions ? JSON.stringify(permissions) : null,
        isActive: true
      }
    })

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: franchiseUser.role,
        isActive: franchiseUser.isActive,
        joinedAt: franchiseUser.joinedAt
      }
    })

  } catch (error) {
    console.error('Create franchise user error:', error)
    return NextResponse.json(
      { error: 'Failed to create franchise user' },
      { status: 500 }
    )
  }
})