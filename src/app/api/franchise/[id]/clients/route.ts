import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withFranchiseProtection } from '@/lib/franchiseMiddleware'

// Get franchise clients
export const GET = withFranchiseProtection(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const clients = await db.franchiseClient.findMany({
      where: { franchiseId: params.id },
      include: {
        licenses: true,
        royaltyPayments: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Get franchise clients error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch franchise clients' },
      { status: 500 }
    )
  }
})

// Create new franchise client
export const POST = withFranchiseProtection(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { clientName, clientEmail, clientCompany, clientPhone } = await request.json()

    if (!clientName || !clientEmail) {
      return NextResponse.json(
        { error: 'Client name and email are required' },
        { status: 400 }
      )
    }

    // Check if client already exists
    const existingClient = await db.franchiseClient.findFirst({
      where: {
        franchiseId: params.id,
        clientEmail
      }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email already exists' },
        { status: 409 }
      )
    }

    // Create the client
    const client = await db.franchiseClient.create({
      data: {
        franchiseId: params.id,
        clientId: `client_${Date.now()}`, // Generate unique client ID
        clientName,
        clientEmail,
        clientCompany,
        clientPhone,
        status: 'pending',
        createdBy: 'franchise_user' // In real app, get from authenticated user
      }
    })

    // Create royalty payment records for the client
    const now = new Date()
    await db.royaltyPayment.createMany({
      data: [
        {
          franchiseId: params.id,
          clientId: client.id,
          amount: 20.00, // One-time fee
          currency: 'USD',
          paymentType: 'one_time',
          status: 'pending',
          dueDate: now,
          createdBy: 'system'
        },
        {
          franchiseId: params.id,
          clientId: client.id,
          amount: 5.00, // Monthly fee
          currency: 'USD',
          paymentType: 'monthly',
          status: 'pending',
          dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1), // Next month
          createdBy: 'system'
        }
      ]
    })

    // Update franchise client count
    await db.franchise.update({
      where: { id: params.id },
      data: {
        currentClients: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      message: 'Client created successfully',
      client
    })

  } catch (error) {
    console.error('Create franchise client error:', error)
    return NextResponse.json(
      { error: 'Failed to create franchise client' },
      { status: 500 }
    )
  }
})