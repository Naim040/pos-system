import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default invoice settings
const DEFAULT_INVOICE_SETTINGS = {
  businessInfo: {
    name: "Your Business Name",
    address: "123 Business Street, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "info@yourbusiness.com",
    website: "www.yourbusiness.com",
    taxId: "TAX123456789"
  },
  receiptSettings: {
    header: "OFFICIAL RECEIPT",
    footer: "Thank you for your purchase!",
    thankYouMessage: "Thank you for shopping with us!",
    returnPolicy: "Returns accepted within 7 days with original receipt",
    customNotes: "Powered by Halalzi POS"
  },
  labels: {
    taxLabel: "Tax",
    discountLabel: "Discount",
    subtotalLabel: "Subtotal",
    totalLabel: "TOTAL",
    quantityLabel: "Qty",
    priceLabel: "Price"
  },
  printSettings: {
    paperSize: '80mm',
    fontSize: 'medium',
    autoPrint: false,
    printLogo: false,
    printBarcode: true,
    charactersPerLine: 48
  },
  displaySettings: {
    showTaxBreakdown: true,
    showDiscountBreakdown: true,
    showLoyaltyPoints: true,
    showItemSku: true,
    showItemBarcode: false
  }
}

export async function GET(request: NextRequest) {
  try {
    // For now, skip authentication to test the functionality
    // In production, you should uncomment the authentication check
    
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Try to get invoice settings from database
    let invoiceSettings = await db.invoiceSettings.findFirst({
      where: { storeId: null }, // Global settings (not store-specific)
      orderBy: { createdAt: 'desc' }
    })

    // If no settings found, create default settings
    if (!invoiceSettings) {
      invoiceSettings = await db.invoiceSettings.create({
        data: {
          storeId: null, // Global settings
          businessInfo: JSON.stringify(DEFAULT_INVOICE_SETTINGS.businessInfo),
          receiptSettings: JSON.stringify(DEFAULT_INVOICE_SETTINGS.receiptSettings),
          labels: JSON.stringify(DEFAULT_INVOICE_SETTINGS.labels),
          printSettings: JSON.stringify(DEFAULT_INVOICE_SETTINGS.printSettings),
          displaySettings: JSON.stringify(DEFAULT_INVOICE_SETTINGS.displaySettings),
          isActive: true
        }
      })
    }

    // Parse the JSON fields and return the complete settings object
    const response = {
      businessInfo: JSON.parse(invoiceSettings.businessInfo),
      receiptSettings: JSON.parse(invoiceSettings.receiptSettings),
      labels: JSON.parse(invoiceSettings.labels),
      printSettings: JSON.parse(invoiceSettings.printSettings),
      displaySettings: JSON.parse(invoiceSettings.displaySettings)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error loading invoice settings:', error)
    return NextResponse.json(
      { error: 'Failed to load invoice settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // For now, skip authentication to test the functionality
    // In production, you should uncomment the authentication check
    
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    
    // Validate the input
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    console.log('Saving invoice settings:', body) // Debug log

    // Merge the new settings with existing ones, providing defaults
    const mergedSettings = {
      businessInfo: {
        ...DEFAULT_INVOICE_SETTINGS.businessInfo,
        ...body.businessInfo
      },
      receiptSettings: {
        ...DEFAULT_INVOICE_SETTINGS.receiptSettings,
        ...body.receiptSettings
      },
      labels: {
        ...DEFAULT_INVOICE_SETTINGS.labels,
        ...body.labels
      },
      printSettings: {
        ...DEFAULT_INVOICE_SETTINGS.printSettings,
        ...body.printSettings
      },
      displaySettings: {
        ...DEFAULT_INVOICE_SETTINGS.displaySettings,
        ...body.displaySettings
      }
    }

    // Try to find existing settings
    const existingSettings = await db.invoiceSettings.findFirst({
      where: { storeId: null }, // Global settings
      orderBy: { createdAt: 'desc' }
    })

    let savedSettings

    if (existingSettings) {
      // Update existing settings
      savedSettings = await db.invoiceSettings.update({
        where: { id: existingSettings.id },
        data: {
          businessInfo: JSON.stringify(mergedSettings.businessInfo),
          receiptSettings: JSON.stringify(mergedSettings.receiptSettings),
          labels: JSON.stringify(mergedSettings.labels),
          printSettings: JSON.stringify(mergedSettings.printSettings),
          displaySettings: JSON.stringify(mergedSettings.displaySettings),
          updatedAt: new Date()
        }
      })
    } else {
      // Create new settings
      savedSettings = await db.invoiceSettings.create({
        data: {
          storeId: null, // Global settings
          businessInfo: JSON.stringify(mergedSettings.businessInfo),
          receiptSettings: JSON.stringify(mergedSettings.receiptSettings),
          labels: JSON.stringify(mergedSettings.labels),
          printSettings: JSON.stringify(mergedSettings.printSettings),
          displaySettings: JSON.stringify(mergedSettings.displaySettings),
          isActive: true
        }
      })
    }

    console.log('Saved invoice settings to database:', savedSettings) // Debug log

    // Return the complete settings object
    const response = {
      businessInfo: JSON.parse(savedSettings.businessInfo),
      receiptSettings: JSON.parse(savedSettings.receiptSettings),
      labels: JSON.parse(savedSettings.labels),
      printSettings: JSON.parse(savedSettings.printSettings),
      displaySettings: JSON.parse(savedSettings.displaySettings)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error saving invoice settings:', error)
    return NextResponse.json(
      { error: 'Failed to save invoice settings' },
      { status: 500 }
    )
  }
}