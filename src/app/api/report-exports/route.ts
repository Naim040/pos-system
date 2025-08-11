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

    const exports = await db.reportExport.findMany({
      where: whereClause,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(exports)
  } catch (error) {
    console.error('Error fetching report exports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report exports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      templateId,
      name,
      type,
      format,
      config,
      filters
    } = body

    // Validate required fields
    if (!name || !type || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse JSON fields
    let parsedConfig = {}
    let parsedFilters = {}
    
    try {
      parsedConfig = config ? JSON.parse(config) : {}
      parsedFilters = filters ? JSON.parse(filters) : {}
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in config or filters' },
        { status: 400 }
      )
    }

    // Create report export record
    const exportRecord = await db.reportExport.create({
      data: {
        templateId,
        name,
        type,
        format,
        config: JSON.stringify(parsedConfig),
        filters: JSON.stringify(parsedFilters),
        status: 'processing',
        createdBy: 'system' // In real app, get from authenticated user
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    // Start processing the report export in the background
    processReportExport(exportRecord.id, type, format, parsedConfig, parsedFilters)

    return NextResponse.json(exportRecord)
  } catch (error) {
    console.error('Error creating report export:', error)
    return NextResponse.json(
      { error: 'Failed to create report export' },
      { status: 500 }
    )
  }
}

async function processReportExport(
  exportId: string,
  type: string,
  format: string,
  config: any,
  filters: any
) {
  try {
    // Update status to processing
    await db.reportExport.update({
      where: { id: exportId },
      data: { status: 'processing' }
    })

    // Generate report data based on type and config
    const reportData = await generateReportData(type, config, filters)

    // Generate file based on format
    const { fileName, filePath, fileSize } = await generateReportFile(reportData, format, type)

    // Update export record with completion details
    await db.reportExport.update({
      where: { id: exportId },
      data: {
        status: 'completed',
        fileName,
        filePath,
        fileSize,
        completedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Error processing report export:', error)
    
    // Update export record with error
    await db.reportExport.update({
      where: { id: exportId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

async function generateReportData(type: string, config: any, filters: any) {
  switch (type) {
    case 'sales':
      return await generateSalesReport(config, filters)
    case 'inventory':
      return await generateInventoryReport(config, filters)
    case 'customer':
      return await generateCustomerReport(config, filters)
    case 'employee':
      return await generateEmployeeReport(config, filters)
    case 'financial':
      return await generateFinancialReport(config, filters)
    default:
      throw new Error(`Unknown report type: ${type}`)
  }
}

async function generateSalesReport(config: any, filters: any) {
  const whereClause: any = {}
  
  if (filters.dateRange?.start && filters.dateRange?.end) {
    whereClause.createdAt = {
      gte: new Date(filters.dateRange.start),
      lte: new Date(filters.dateRange.end)
    }
  }
  
  if (filters.storeId) {
    whereClause.storeId = filters.storeId
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
              barcode: true,
              price: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Calculate summary statistics
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalTransactions = sales.length
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0
  
  // Group by various dimensions based on config
  const groupBy = config.groupBy || 'none'
  let groupedData: any = {}
  
  switch (groupBy) {
    case 'store':
      groupedData = sales.reduce((acc, sale) => {
        const storeName = sale.store?.name || 'Unknown'
        if (!acc[storeName]) {
          acc[storeName] = {
            storeName,
            totalSales: 0,
            transactionCount: 0,
            averageTransaction: 0
          }
        }
        acc[storeName].totalSales += sale.totalAmount
        acc[storeName].transactionCount += 1
        return acc
      }, {})
      
      // Calculate averages
      Object.values(groupedData).forEach((group: any) => {
        group.averageTransaction = group.transactionCount > 0 ? group.totalSales / group.transactionCount : 0
      })
      break
      
    case 'product':
      groupedData = sales.reduce((acc, sale) => {
        sale.saleItems.forEach((item) => {
          const productName = item.product.name
          if (!acc[productName]) {
            acc[productName] = {
              productName,
              totalSales: 0,
              quantitySold: 0,
              revenue: 0
            }
          }
          acc[productName].quantitySold += item.quantity
          acc[productName].revenue += item.totalPrice
        })
        return acc
      }, {})
      break
      
    default:
      groupedData = {
        summary: {
          totalSales,
          totalTransactions,
          averageTransaction,
          reportGenerated: new Date().toISOString()
        },
        detailedData: sales
      }
  }

  return {
    type: 'sales',
    generatedAt: new Date().toISOString(),
    summary: {
      totalSales,
      totalTransactions,
      averageTransaction
    },
    groupedData,
    detailedData: sales
  }
}

async function generateInventoryReport(config: any, filters: any) {
  const whereClause: any = {}
  
  if (filters.storeId) {
    whereClause.storeId = filters.storeId
  }
  
  if (filters.lowStock !== undefined) {
    whereClause.quantity = {
      lte: filters.lowStock
    }
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
          price: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
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

  // Calculate inventory statistics
  const totalProducts = inventory.length
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0)
  
  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock)
  const outOfStockItems = inventory.filter(item => item.quantity === 0)

  return {
    type: 'inventory',
    generatedAt: new Date().toISOString(),
    summary: {
      totalProducts,
      totalQuantity,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length
    },
    detailedData: inventory,
    alerts: {
      lowStockItems,
      outOfStockItems
    }
  }
}

async function generateCustomerReport(config: any, filters: any) {
  const whereClause: any = {}
  
  if (filters.dateRange?.start && filters.dateRange?.end) {
    whereClause.createdAt = {
      gte: new Date(filters.dateRange.start),
      lte: new Date(filters.dateRange.end)
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

  // Calculate customer statistics
  const totalCustomers = customers.length
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0)
  const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0
  
  // Group by loyalty tier
  const loyaltyTierStats = customers.reduce((acc, customer) => {
    const tier = customer.loyaltyTier
    if (!acc[tier]) {
      acc[tier] = {
        tier,
        customerCount: 0,
        totalSpent: 0,
        averageSpent: 0
      }
    }
    acc[tier].customerCount += 1
    acc[tier].totalSpent += customer.totalSpent
    return acc
  }, {})
  
  // Calculate averages for each tier
  Object.values(loyaltyTierStats).forEach((tier: any) => {
    tier.averageSpent = tier.customerCount > 0 ? tier.totalSpent / tier.customerCount : 0
  })

  return {
    type: 'customer',
    generatedAt: new Date().toISOString(),
    summary: {
      totalCustomers,
      totalSpent,
      averageSpent
    },
    loyaltyTierStats,
    detailedData: customers
  }
}

async function generateEmployeeReport(config: any, filters: any) {
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
          totalHours: true,
          status: true
        }
      },
      performanceReviews: {
        select: {
          id: true,
          rating: true,
          reviewDate: true,
          period: true
        }
      },
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

  // Calculate employee statistics
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(emp => emp.status === 'active').length
  
  // Calculate performance metrics
  const employeeStats = employees.map(employee => {
    const totalHours = employee.timeEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0)
    const totalSales = employee.sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const averageRating = employee.performanceReviews.length > 0 
      ? employee.performanceReviews.reduce((sum, review) => sum + review.rating, 0) / employee.performanceReviews.length
      : 0
    
    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      totalHours,
      totalSales,
      averageRating,
      reviewCount: employee.performanceReviews.length
    }
  })

  return {
    type: 'employee',
    generatedAt: new Date().toISOString(),
    summary: {
      totalEmployees,
      activeEmployees
    },
    employeeStats,
    detailedData: employees
  }
}

async function generateFinancialReport(config: any, filters: any) {
  const whereClause: any = {}
  
  if (filters.dateRange?.start && filters.dateRange?.end) {
    whereClause.createdAt = {
      gte: new Date(filters.dateRange.start),
      lte: new Date(filters.dateRange.end)
    }
  }

  const sales = await db.sale.findMany({
    where: whereClause,
    include: {
      saleItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              costPrice: true
            }
          }
        }
      }
    }
  })

  // Calculate financial metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalTax = sales.reduce((sum, sale) => sum + sale.taxAmount, 0)
  const totalDiscounts = sales.reduce((sum, sale) => sum + sale.discount, 0)
  
  // Calculate cost of goods sold
  const cogs = sales.reduce((sum, sale) => {
    const saleCOGS = sale.saleItems.reduce((itemSum, item) => {
      return itemSum + (item.quantity * item.product.costPrice)
    }, 0)
    return sum + saleCOGS
  }, 0)
  
  const grossProfit = totalRevenue - cogs
  const netProfit = grossProfit - totalTax - totalDiscounts
  
  // Calculate profit margins
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    type: 'financial',
    generatedAt: new Date().toISOString(),
    summary: {
      totalRevenue,
      totalTax,
      totalDiscounts,
      cogs,
      grossProfit,
      netProfit,
      grossMargin: Math.round(grossMargin * 100) / 100,
      netMargin: Math.round(netMargin * 100) / 100
    },
    detailedData: sales
  }
}

async function generateReportFile(data: any, format: string, type: string) {
  const timestamp = new Date().toISOString().split('T')[0]
  const fileName = `${type}_report_${timestamp}.${format}`
  const filePath = `/reports/${fileName}`
  
  // In a real implementation, you would:
  // 1. Convert data to the requested format (PDF, Excel, etc.)
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