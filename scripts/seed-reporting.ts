import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding advanced reporting data...')

  // Create report templates
  const templates = await Promise.all([
    prisma.reportTemplate.create({
      data: {
        name: 'Daily Sales Summary',
        description: 'Comprehensive daily sales report with key metrics',
        category: 'sales',
        config: JSON.stringify({
          charts: ['line', 'bar'],
          metrics: ['total_sales', 'total_transactions', 'average_transaction'],
          groupBy: 'hour',
          includeComparison: true
        }),
        isDefault: true,
        isSystem: true,
        createdBy: 'system'
      }
    }),
    prisma.reportTemplate.create({
      data: {
        name: 'Inventory Status Report',
        description: 'Current inventory levels and stock alerts',
        category: 'inventory',
        config: JSON.stringify({
          charts: ['table'],
          metrics: ['total_products', 'low_stock_items', 'out_of_stock_items'],
          includeAlerts: true
        }),
        isDefault: true,
        isSystem: true,
        createdBy: 'system'
      }
    }),
    prisma.reportTemplate.create({
      data: {
        name: 'Customer Loyalty Analysis',
        description: 'Customer loyalty metrics and tier distribution',
        category: 'customer',
        config: JSON.stringify({
          charts: ['pie', 'bar'],
          metrics: ['total_customers', 'loyalty_tier_distribution', 'average_spent'],
          groupBy: 'loyalty_tier'
        }),
        isDefault: false,
        isSystem: true,
        createdBy: 'system'
      }
    }),
    prisma.reportTemplate.create({
      data: {
        name: 'Employee Performance Report',
        description: 'Employee performance metrics and productivity analysis',
        category: 'employee',
        config: JSON.stringify({
          charts: ['bar', 'radar'],
          metrics: ['total_hours', 'sales_performance', 'customer_ratings'],
          groupBy: 'employee'
        }),
        isDefault: false,
        isSystem: true,
        createdBy: 'system'
      }
    }),
    prisma.reportTemplate.create({
      data: {
        name: 'Financial Summary',
        description: 'Comprehensive financial performance report',
        category: 'financial',
        config: JSON.stringify({
          charts: ['line', 'area'],
          metrics: ['revenue', 'profit', 'expenses', 'margins'],
          includeTrends: true
        }),
        isDefault: true,
        isSystem: true,
        createdBy: 'system'
      }
    })
  ])

  console.log(`✅ Created ${templates.length} report templates`)

  // Create report schedules
  const schedules = await Promise.all([
    prisma.reportSchedule.create({
      data: {
        name: 'Daily Sales Report',
        description: 'Automated daily sales summary sent to management',
        type: 'sales',
        frequency: 'daily',
        format: 'pdf',
        config: JSON.stringify({
          templateId: templates[0].id,
          includeCharts: true,
          includeComparison: true
        }),
        recipients: JSON.stringify(['manager@company.com', 'admin@company.com']),
        isActive: true,
        timezone: 'America/New_York',
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        createdBy: 'system'
      }
    }),
    prisma.reportSchedule.create({
      data: {
        name: 'Weekly Inventory Report',
        description: 'Weekly inventory status and stock level report',
        type: 'inventory',
        frequency: 'weekly',
        format: 'excel',
        config: JSON.stringify({
          templateId: templates[1].id,
          includeAlerts: true,
          includeLowStockDetails: true
        }),
        recipients: JSON.stringify(['inventory@company.com']),
        isActive: true,
        timezone: 'America/New_York',
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        createdBy: 'system'
      }
    }),
    prisma.reportSchedule.create({
      data: {
        name: 'Monthly Financial Report',
        description: 'Comprehensive monthly financial performance report',
        type: 'financial',
        frequency: 'monthly',
        format: 'pdf',
        config: JSON.stringify({
          templateId: templates[4].id,
          includeDetailedAnalysis: true,
          includeYearOverYear: true
        }),
        recipients: JSON.stringify(['finance@company.com', 'executive@company.com']),
        isActive: true,
        timezone: 'America/New_York',
        nextRun: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // Next month
        createdBy: 'system'
      }
    })
  ])

  console.log(`✅ Created ${schedules.length} report schedules`)

  // Create automated insights
  const insights = await Promise.all([
    prisma.automatedInsight.create({
      data: {
        type: 'trend',
        category: 'sales',
        title: 'Sales Growth Detected',
        description: 'Sales have increased by 15% compared to last week, indicating positive growth momentum.',
        data: JSON.stringify({
          currentWeekSales: 125000,
          previousWeekSales: 108696,
          growthPercentage: 15,
          trend: 'increasing'
        }),
        severity: 'medium',
        confidence: 0.85,
        insightTargets: {
          create: [
            {
              targetType: 'store',
              targetId: '1',
              metadata: JSON.stringify({ storeName: 'Main Headquarters' })
            }
          ]
        }
      }
    }),
    prisma.automatedInsight.create({
      data: {
        type: 'anomaly',
        category: 'inventory',
        title: 'Unusual Inventory Pattern',
        description: 'Coffee product showing abnormal depletion rate - 40% faster than usual.',
        data: JSON.stringify({
          productId: '1',
          productName: 'Coffee',
          normalDepletionRate: 10,
          currentDepletionRate: 14,
          anomalyScore: 0.92
        }),
        severity: 'high',
        confidence: 0.92,
        insightTargets: {
          create: [
            {
              targetType: 'product',
              targetId: '1',
              metadata: JSON.stringify({ productName: 'Coffee', sku: 'COF001' })
            },
            {
              targetType: 'store',
              targetId: '1',
              metadata: JSON.stringify({ storeName: 'Main Headquarters' })
            }
          ]
        }
      }
    }),
    prisma.automatedInsight.create({
      data: {
        type: 'opportunity',
        category: 'customer',
        title: 'High-Value Customer Opportunity',
        description: 'Customer segment with high lifetime value identified for targeted marketing.',
        data: JSON.stringify({
          customerSegment: 'gold_tier',
          averageLifetimeValue: 2500,
          customerCount: 45,
          potentialRevenue: 112500
        }),
        severity: 'low',
        confidence: 0.78,
        insightTargets: {
          create: [
            {
              targetType: 'category',
              targetId: 'customer',
              metadata: JSON.stringify({ segment: 'gold_tier', count: 45 })
            }
          ]
        }
      }
    }),
    prisma.automatedInsight.create({
      data: {
        type: 'warning',
        category: 'employee',
        title: 'Staffing Level Alert',
        description: 'Downtown branch showing below optimal staffing levels during peak hours.',
        data: JSON.stringify({
          storeId: '2',
          storeName: 'Downtown Branch',
          peakHourStaff: 2,
          optimalStaff: 4,
          impactScore: 0.75
        }),
        severity: 'medium',
        confidence: 0.88,
        insightTargets: {
          create: [
            {
              targetType: 'store',
              targetId: '2',
              metadata: JSON.stringify({ storeName: 'Downtown Branch', issue: 'understaffed' })
            }
          ]
        }
      }
    }),
    prisma.automatedInsight.create({
      data: {
        type: 'recommendation',
        category: 'financial',
        title: 'Cost Optimization Opportunity',
        description: 'Identified potential 8% cost reduction through supplier renegotiation.',
        data: JSON.stringify({
          category: 'supplies',
          currentCost: 45000,
          potentialSavings: 3600,
          savingsPercentage: 8,
          confidence: 0.82
        }),
        severity: 'low',
        confidence: 0.82,
        insightTargets: {
          create: [
            {
              targetType: 'category',
              targetId: 'financial',
              metadata: JSON.stringify({ area: 'procurement', potential: 'high' })
            }
          ]
        }
      }
    })
  ])

  console.log(`✅ Created ${insights.length} automated insights`)

  // Create some sample data exports
  const dataExports = await Promise.all([
    prisma.dataExport.create({
      data: {
        name: 'Q1 2024 Sales Data Export',
        type: 'sales',
        format: 'csv',
        filters: JSON.stringify({
          dateRange: {
            start: '2024-01-01',
            end: '2024-03-31'
          }
        }),
        columns: JSON.stringify(['id', 'totalAmount', 'taxAmount', 'status', 'createdAt']),
        dateRange: JSON.stringify({
          start: '2024-01-01',
          end: '2024-03-31'
        }),
        status: 'completed',
        progress: 100,
        fileName: 'q1_2024_sales_data.csv',
        filePath: '/exports/q1_2024_sales_data.csv',
        fileSize: 2048000, // 2MB
        createdBy: 'system'
      }
    }),
    prisma.dataExport.create({
      data: {
        name: 'Current Inventory Status',
        type: 'inventory',
        format: 'excel',
        filters: JSON.stringify({
          lowStockOnly: true
        }),
        columns: JSON.stringify(['productId', 'quantity', 'minStock', 'maxStock', 'location']),
        status: 'completed',
        progress: 100,
        fileName: 'inventory_status.xlsx',
        filePath: '/exports/inventory_status.xlsx',
        fileSize: 1024000, // 1MB
        createdBy: 'system'
      }
    }),
    prisma.dataExport.create({
      data: {
        name: 'Customer Analytics Export',
        type: 'customer',
        format: 'json',
        filters: JSON.stringify({
          loyaltyTier: ['gold', 'platinum']
        }),
        columns: JSON.stringify(['id', 'name', 'email', 'loyaltyPoints', 'totalSpent', 'visitCount']),
        status: 'processing',
        progress: 65,
        createdBy: 'system'
      }
    })
  ])

  console.log(`✅ Created ${dataExports.length} data exports`)

  // Create report exports
  const reportExports = await Promise.all([
    prisma.reportExport.create({
      data: {
        templateId: templates[0].id,
        name: 'March 2024 Sales Report',
        type: 'sales',
        format: 'pdf',
        config: JSON.stringify({
          includeCharts: true,
          includeComparison: true,
          dateRange: {
            start: '2024-03-01',
            end: '2024-03-31'
          }
        }),
        filters: JSON.stringify({
          storeIds: ['1', '2']
        }),
        status: 'completed',
        fileName: 'march_2024_sales_report.pdf',
        filePath: '/reports/march_2024_sales_report.pdf',
        fileSize: 5120000, // 5MB
        createdBy: 'system'
      }
    }),
    prisma.reportExport.create({
      data: {
        templateId: templates[4].id,
        name: 'Q1 2024 Financial Summary',
        type: 'financial',
        format: 'excel',
        config: JSON.stringify({
          includeDetailedAnalysis: true,
          includeCharts: true
        }),
        filters: JSON.stringify({
          dateRange: {
            start: '2024-01-01',
            end: '2024-03-31'
          }
        }),
        status: 'completed',
        fileName: 'q1_2024_financial_summary.xlsx',
        filePath: '/reports/q1_2024_financial_summary.xlsx',
        fileSize: 3072000, // 3MB
        createdBy: 'system'
      }
    })
  ])

  console.log(`✅ Created ${reportExports.length} report exports`)

  console.log('🎉 Advanced reporting data seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding advanced reporting data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })