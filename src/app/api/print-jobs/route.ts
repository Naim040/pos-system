import { NextRequest, NextResponse } from 'next/server'

// GET /api/print-jobs - Get all print jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Mock print jobs data
    const allPrintJobs = [
      {
        id: 'job_1',
        printerId: '1',
        templateId: '1',
        type: 'receipt',
        data: { receiptId: '12345', total: 25.99 },
        priority: 'high',
        status: 'completed',
        createdAt: new Date(Date.now() - 300000).toISOString(),
        completedAt: new Date(Date.now() - 295000).toISOString(),
        retryCount: 0
      },
      {
        id: 'job_2',
        printerId: '2',
        templateId: '2',
        type: 'kitchen_order',
        data: { orderId: '67890', items: [] },
        priority: 'high',
        status: 'printing',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        retryCount: 0
      },
      {
        id: 'job_3',
        printerId: '3',
        templateId: '3',
        type: 'invoice',
        data: { invoiceId: '54321', total: 156.78 },
        priority: 'normal',
        status: 'pending',
        createdAt: new Date(Date.now() - 120000).toISOString(),
        retryCount: 1
      },
      {
        id: 'job_4',
        printerId: '1',
        templateId: '1',
        type: 'receipt',
        data: { receiptId: '98765', total: 12.50 },
        priority: 'normal',
        status: 'failed',
        createdAt: new Date(Date.now() - 180000).toISOString(),
        retryCount: 3,
        error: 'Printer offline'
      }
    ]

    // Filter by status if provided
    let filteredJobs = allPrintJobs
    if (status) {
      filteredJobs = allPrintJobs.filter(job => job.status === status)
    }

    // Apply pagination
    const paginatedJobs = filteredJobs.slice(offset, offset + limit)

    return NextResponse.json({
      jobs: paginatedJobs,
      total: filteredJobs.length,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching print jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch print jobs' },
      { status: 500 }
    )
  }
}

// POST /api/print-jobs - Create new print job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { printerId, templateId, type, data, priority = 'normal' } = body

    if (!printerId || !templateId || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: printerId, templateId, type, data' },
        { status: 400 }
      )
    }

    // Validate print job type
    const validTypes = ['receipt', 'invoice', 'kitchen_order', 'label', 'report']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid print job type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // Create new print job
    const newJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      printerId,
      templateId,
      type,
      data,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0
    }

    console.log('Creating print job:', newJob)

    // In a real implementation, this would:
    // 1. Save to database
    // 2. Add to print queue
    // 3. Trigger printing process

    return NextResponse.json(newJob, { status: 201 })
  } catch (error) {
    console.error('Error creating print job:', error)
    return NextResponse.json(
      { error: 'Failed to create print job' },
      { status: 500 }
    )
  }
}