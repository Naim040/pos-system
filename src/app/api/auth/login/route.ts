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

    // Find user by email
    let user = await db.user.findUnique({
      where: { email }
    })

    // If user doesn't exist but password is 'password', create a demo user
    if (!user && password === 'password') {
      // Extract name from email for demo
      const name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
      
      user = await db.user.create({
        data: {
          email,
          name: `${name} User`,
          role: 'staff' // Default role for demo users
        }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check password (for demo purposes, we'll use plain text comparison)
    // In production, you should use proper password hashing
    const isPasswordValid = password === 'password' // Simple demo password
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session (simple token-based for demo)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    // Return user info and session token
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token: sessionToken
    })

    // Set HTTP-only cookie for session
    response.cookies.set('pos_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}