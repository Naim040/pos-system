import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the store details
    const store = await db.ecommerceStore.findUnique({
      where: { id: params.id },
      include: {
        platform: true
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    // Parse store configuration
    const config = JSON.parse(store.config)
    
    // Test connection based on platform
    let isConnected = false
    let message = ''

    switch (store.platform.id) {
      case 'shopify':
        isConnected = await testShopifyConnection(store, config)
        message = isConnected ? 'Successfully connected to Shopify store' : 'Failed to connect to Shopify store'
        break
      case 'woocommerce':
        isConnected = await testWooCommerceConnection(store, config)
        message = isConnected ? 'Successfully connected to WooCommerce store' : 'Failed to connect to WooCommerce store'
        break
      case 'magento':
        isConnected = await testMagentoConnection(store, config)
        message = isConnected ? 'Successfully connected to Magento store' : 'Failed to connect to Magento store'
        break
      case 'bigcommerce':
        isConnected = await testBigCommerceConnection(store, config)
        message = isConnected ? 'Successfully connected to BigCommerce store' : 'Failed to connect to BigCommerce store'
        break
      default:
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        )
    }

    // Update store sync status
    await db.ecommerceStore.update({
      where: { id: params.id },
      data: {
        syncStatus: isConnected ? 'success' : 'error',
        syncError: isConnected ? null : message,
        lastSyncAt: new Date()
      }
    })

    return NextResponse.json({
      success: isConnected,
      message
    })
  } catch (error) {
    console.error('Error testing e-commerce store connection:', error)
    
    // Update store sync status to error
    await db.ecommerceStore.update({
      where: { id: params.id },
      data: {
        syncStatus: 'error',
        syncError: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    })

    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    )
  }
}

// Platform-specific connection test functions
async function testShopifyConnection(store: any, config: any): Promise<boolean> {
  try {
    const response = await fetch(`https://${config.storeUrl}/admin/api/${store.platform.apiVersion}/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json'
      }
    })

    return response.ok
  } catch (error) {
    console.error('Shopify connection test failed:', error)
    return false
  }
}

async function testWooCommerceConnection(store: any, config: any): Promise<boolean> {
  try {
    const response = await fetch(`${store.storeUrl}/wp-json/wc/v3/system_status`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    })

    return response.ok
  } catch (error) {
    console.error('WooCommerce connection test failed:', error)
    return false
  }
}

async function testMagentoConnection(store: any, config: any): Promise<boolean> {
  try {
    const response = await fetch(`${store.storeUrl}/rest/${store.platform.apiVersion}/store/storeConfigs`, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    return response.ok
  } catch (error) {
    console.error('Magento connection test failed:', error)
    return false
  }
}

async function testBigCommerceConnection(store: any, config: any): Promise<boolean> {
  try {
    const response = await fetch(`${store.storeUrl}/stores/v2/store`, {
      headers: {
        'X-Auth-Token': config.accessToken,
        'X-Auth-Client': config.clientId,
        'Content-Type': 'application/json'
      }
    })

    return response.ok
  } catch (error) {
    console.error('BigCommerce connection test failed:', error)
    return false
  }
}