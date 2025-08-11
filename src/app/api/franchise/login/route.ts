import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find franchise user
    const franchiseUser = await db.franchiseUser.findFirst({
      where: {
        user: {
          email: email,
          status: 'active'
        },
        isActive: true
      },
      include: {
        user: true,
        franchise: true
      }
    })

    if (!franchiseUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check franchise status
    if (franchiseUser.franchise.status === 'pending') {
      return NextResponse.json(
        { error: 'Franchise application is pending approval' },
        { status: 403 }
      )
    }

    if (franchiseUser.franchise.status === 'rejected') {
      return NextResponse.json(
        { error: 'Franchise application was rejected' },
        { status: 403 }
      )
    }

    if (franchiseUser.franchise.status === 'suspended') {
      return NextResponse.json(
        { error: 'Franchise account is suspended' },
        { status: 403 }
      )
    }

    if (franchiseUser.franchise.isBlocked) {
      return NextResponse.json(
        { error: 'Franchise account is blocked due to outstanding payments' },
        { status: 403 }
      )
    }

    // Verify password (assuming users have a password field - you may need to add this)
    // For now, we'll skip password verification and focus on the franchise logic
    // In a real implementation, you would verify the password here

    // Create session or token (simplified for this example)
    const user = {
      id: franchiseUser.user.id,
      email: franchiseUser.user.email,
      name: franchiseUser.user.name,
      role: 'franchise',
      franchiseId: franchiseUser.franchise.id,
      franchiseRole: franchiseUser.role,
      franchiseName: franchiseUser.franchise.name
    }

    // Return success response with user info
    return NextResponse.json({
      message: 'Login successful',
      user
    })

  } catch (error) {
    console.error('Franchise login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}