import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/printers/[id] - Get specific printer
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    // Mock printer data - in real implementation, fetch from database
    const printer = {
      id: id,
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
    }

    if (!printer) {
      return NextResponse.json(
        { error: 'Printer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(printer)
  } catch (error) {
    console.error('Error fetching printer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch printer' },
      { status: 500 }
    )
  }
}

// PUT /api/printers/[id] - Update printer
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()

    const { name, type, connection, ipAddress, port, paperSize, isDefault, isEnabled, templateId } = body

    // Validate input
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

    // Update printer (mock implementation)
    const updatedPrinter = {
      id,
      name,
      type,
      connection,
      ipAddress: connection === 'network' ? ipAddress : null,
      port: connection === 'network' ? port : null,
      paperSize,
      isDefault: isDefault || false,
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      status: 'offline', // Will be updated after testing
      lastUsed: new Date().toISOString(),
      templateId: templateId || null,
      updatedAt: new Date().toISOString()
    }

    console.log('Updating printer:', updatedPrinter)

    return NextResponse.json(updatedPrinter)
  } catch (error) {
    console.error('Error updating printer:', error)
    return NextResponse.json(
      { error: 'Failed to update printer' },
      { status: 500 }
    )
  }
}

// DELETE /api/printers/[id] - Delete printer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    // Delete printer (mock implementation)
    console.log('Deleting printer:', id)

    return NextResponse.json({ message: 'Printer deleted successfully' })
  } catch (error) {
    console.error('Error deleting printer:', error)
    return NextResponse.json(
      { error: 'Failed to delete printer' },
      { status: 500 }
    )
  }
}