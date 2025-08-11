import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/printers - Get all printers
export async function GET(request: NextRequest) {
  try {
    // For now, return mock printer data
    // In a real implementation, this would fetch from database
    const printers = [
      {
        id: '1',
        name: 'Main Receipt Printer',
        type: 'thermal',
        connection: 'usb',
        ipAddress: null,
        port: null,
        paperSize: '80mm',
        isDefault: true,
        isEnabled: true,
        status: 'online',
        lastUsed: new Date().toISOString(),
        templateId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Kitchen Printer',
        type: 'thermal',
        connection: 'network',
        ipAddress: '192.168.1.100',
        port: 9100,
        paperSize: '58mm',
        isDefault: false,
        isEnabled: true,
        status: 'online',
        lastUsed: new Date(Date.now() - 3600000).toISOString(),
        templateId: '2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Invoice Printer',
        type: 'laser',
        connection: 'network',
        ipAddress: '192.168.1.101',
        port: 9100,
        paperSize: 'a4',
        isDefault: false,
        isEnabled: false,
        status: 'offline',
        lastUsed: new Date(Date.now() - 86400000).toISOString(),
        templateId: '3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    return NextResponse.json(printers)
  } catch (error) {
    console.error('Error fetching printers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch printers' },
      { status: 500 }
    )
  }
}

// POST /api/printers - Create new printer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { name, type, connection, ipAddress, port, paperSize, templateId } = body

    if (!name || !type || !connection || !paperSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For network connections, validate IP and port
    if (connection === 'network' && (!ipAddress || !port)) {
      return NextResponse.json(
        { error: 'Network printers require IP address and port' },
        { status: 400 }
      )
    }

    // Create new printer (mock implementation)
    const newPrinter = {
      id: `printer_${Date.now()}`,
      name,
      type,
      connection,
      ipAddress: connection === 'network' ? ipAddress : null,
      port: connection === 'network' ? port : null,
      paperSize,
      isDefault: false,
      isEnabled: true,
      status: 'offline', // Will be updated after testing
      lastUsed: null,
      templateId: templateId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // In a real implementation, this would save to database
    console.log('Creating printer:', newPrinter)

    return NextResponse.json(newPrinter, { status: 201 })
  } catch (error) {
    console.error('Error creating printer:', error)
    return NextResponse.json(
      { error: 'Failed to create printer' },
      { status: 500 }
    )
  }
}