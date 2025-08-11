import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const whereClause: any = {}
    if (type) whereClause.type = type
    if (status) whereClause.status = status

    const exports = await db.dataExport.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(exports)
  } catch (error) {
    console.error('Error fetching data exports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data exports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      type,
      format,
      filters,
      columns,
      dateRange
    } = body

    // Validate required fields
    if (!name || !type || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse JSON fields
    let parsedFilters = {}
    let parsedColumns = []
    let parsedDateRange = {}
    
    try {
      parsedFilters = filters ? JSON.parse(filters) : {}
      parsedColumns = columns ? JSON.parse(columns) : []
      parsedDateRange = dateRange ? JSON.parse(dateRange) : {}
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in filters, columns, or dateRange' },
        { status: 400 }
      )
    }

    // Create data export record
    const exportRecord = await db.dataExport.create({
      data: {
        name,
        type,
        format,
        filters: JSON.stringify(parsedFilters),
        columns: JSON.stringify(parsedColumns),
        dateRange: JSON.stringify(parsedDateRange),
        status: 'processing',
        progress: 0,
        createdBy: 'system' // In real app, get from authenticated user
      }
    })

    // Start processing the export in the background
    processExport(exportRecord.id, type, format, parsedFilters, parsedColumns, parsedDateRange)

    return NextResponse.json(exportRecord)
  } catch (error) {
    console.error('Error creating data export:', error)
    return NextResponse.json(
      { error: 'Failed to create data export' },
      { status: 500 }
    )
  }
}

async function processExport(
  exportId: string,
  type: string,
  format: string,
  filters: any,
  columns: string[],
  dateRange: any
) {
  try {
    // Update progress
    await db.dataExport.update({
      where: { id: exportId },
      data: { progress: 10 }
    })

    // Fetch data based on type
    let data: any[] = []
    
    switch (type) {
      case 'sales':
        data = await fetchSalesData(filters, dateRange)
        break
      case 'inventory':
        data = await fetchInventoryData(filters, dateRange)
        break
      case 'customer':
        data = await fetchCustomerData(filters, dateRange)
        break
      case 'employee':
        data = await fetchEmployeeData(filters, dateRange)
        break
      case 'products':
        data = await fetchProductsData(filters, dateRange)
        break
      case 'stores':
        data = await fetchStoresData(filters, dateRange)
        break
      default:
        throw new Error(`Unknown export type: ${type}`)
    }

    // Update progress
    await db.dataExport.update({
      where: { id: exportId },
      data: { progress: 50 }
    })

    // Apply column filtering if specified
    if (columns.length > 0) {
      data = data.map(item => {
        const filteredItem: any = {}
        columns.forEach((col: string) => {
          if (item[col] !== undefined) {
            filteredItem[col] = item[col]
          }
        })
        return filteredItem
      })
    }

    // Update progress
    await db.dataExport.update({
      where: { id: exportId },
      data: { progress: 80 }
    })

    // Generate file based on format
    const { fileName, filePath, fileSize } = await generateExportFile(data, format, type)

    // Update export record with completion details
    await db.dataExport.update({
      where: { id: exportId },
      data: {
        status: 'completed',
        progress: 100,
        fileName,
        filePath,
        fileSize,
        completedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Error processing export:', error)
    
    // Update export record with error
    await db.dataExport.update({
      where: { id: exportId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

async function fetchSalesData(filters: any, dateRange: any) {
  const whereClause: any = {}
  
  if (dateRange.start && dateRange.end) {
    whereClause.createdAt = {
      gte: new Date(dateRange.start),
      lte: new Date(dateRange.end)
    }
  }

  const sales = await db.sale.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      store: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      saleItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return sales
}

async function fetchInventoryData(filters: any, dateRange: any) {
  const whereClause: any = {}
  
  if (filters.storeId) {
    whereClause.storeId = filters.storeId
  }

  const inventory = await db.inventory.findMany({
    where: whereClause,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          price: true
        }
      },
      store: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  })

  return inventory
}

async function fetchCustomerData(filters: any, dateRange: any) {
  const whereClause: any = {}
  
  if (dateRange.start && dateRange.end) {
    whereClause.createdAt = {
      gte: new Date(dateRange.start),
      lte: new Date(dateRange.end)
    }
  }

  const customers = await db.customer.findMany({
    where: whereClause,
    include: {
      sales: {
        select: {
          id: true,
          totalAmount: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return customers
}

async function fetchEmployeeData(filters: any, dateRange: any) {
  const whereClause: any = {}
  
  if (filters.role) {
    whereClause.role = filters.role
  }

  const employees = await db.user.findMany({
    where: whereClause,
    include: {
      timeEntries: {
        select: {
          id: true,
          clockIn: true,
          clockOut: true,
          totalHours: true
        }
      },
      performanceReviews: {
        select: {
          id: true,
          rating: true,
          reviewDate: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return employees
}

async function fetchProductsData(filters: any, dateRange: any) {
  const whereClause: any = {}
  
  if (filters.categoryId) {
    whereClause.categoryId = filters.categoryId
  }

  const products = await db.product.findMany({
    where: whereClause,
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      inventory: {
        select: {
          id: true,
          quantity: true,
          storeId: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return products
}

async function fetchStoresData(filters: any, dateRange: any) {
  const whereClause: any = {}
  
  if (filters.isActive !== undefined) {
    whereClause.isActive = filters.isActive
  }

  const stores = await db.store.findMany({
    where: whereClause,
    include: {
      manager: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          users: true,
          inventory: true,
          sales: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return stores
}

async function generateExportFile(data: any[], format: string, type: string) {
  const timestamp = new Date().toISOString().split('T')[0]
  const fileName = `${type}_export_${timestamp}.${format}`
  const filePath = `/exports/${fileName}`
  
  // In a real implementation, you would:
  // 1. Convert data to the requested format
  // 2. Save the file to storage (local, S3, etc.)
  // 3. Generate a download URL
  // 4. Calculate file size
  
  // For now, we'll simulate this
  const fileSize = Buffer.byteLength(JSON.stringify(data))
  
  return {
    fileName,
    filePath,
    fileSize
  }
}