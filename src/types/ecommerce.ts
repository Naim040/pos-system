// E-commerce Integration Types and Interfaces

export interface EcommercePlatform {
  id: string
  name: string
  description: string
  website?: string
  apiVersion: string
  isActive: boolean
  configTemplate: EcommerceConfigTemplate[]
  createdAt: Date
  updatedAt: Date
}

export interface EcommerceConfigTemplate {
  key: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'password'
  required: boolean
  description?: string
  placeholder?: string
  options?: string[]
  defaultValue?: any
}

export interface EcommerceStore {
  id: string
  name: string
  platformId: string
  platformName: string
  storeUrl: string
  apiKey: string
  apiSecret?: string
  config: Record<string, any>
  isActive: boolean
  lastSyncAt?: Date
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  syncError?: string
  autoSync: boolean
  syncInterval: number // in minutes
  createdAt: Date
  updatedAt: Date
  
  // Relations
  platform?: EcommercePlatform
  products?: EcommerceProduct[]
  orders?: EcommerceOrder[]
}

export interface EcommerceProduct {
  id: string
  storeId: string
  productId: string // Reference to POS product
  ecommerceProductId: string // Platform-specific product ID
  sku: string
  name: string
  description?: string
  price: number
  comparePrice?: number
  cost?: number
  quantity: number
  images: string[]
  categories: string[]
  tags: string[]
  variants: EcommerceProductVariant[]
  status: 'active' | 'draft' | 'archived'
  visibility: 'visible' | 'hidden'
  seoTitle?: string
  seoDescription?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  lastSyncedAt: Date
  createdAt: Date
  updatedAt: Date
  
  // Relations
  store?: EcommerceStore
  product?: Product // POS product
}

export interface EcommerceProductVariant {
  id: string
  ecommerceProductId: string
  variantId: string
  sku: string
  name: string
  price: number
  comparePrice?: number
  quantity: number
  options: Record<string, string>
  image?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface EcommerceOrder {
  id: string
  storeId: string
  orderId: string // Platform-specific order ID
  orderNumber: string
  customerEmail: string
  customerPhone?: string
  customerName: string
  shippingAddress: Address
  billingAddress: Address
  items: EcommerceOrderItem[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: string
  trackingNumber?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  
  // Relations
  store?: EcommerceStore
  sale?: Sale // POS sale record if imported
}

export interface EcommerceOrderItem {
  id: string
  orderId: string
  productId: string
  variantId?: string
  sku: string
  name: string
  quantity: number
  price: number
  total: number
  tax?: number
  discount?: number
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
}

export interface EcommerceSyncLog {
  id: string
  storeId: string
  type: 'product' | 'order' | 'inventory' | 'full'
  status: 'pending' | 'running' | 'success' | 'error'
  startTime: Date
  endTime?: Date
  itemsProcessed: number
  itemsSuccess: number
  itemsError: number
  errorMessage?: string
  details?: string
  createdAt: Date
}

export interface EcommerceWebhook {
  id: string
  storeId: string
  topic: string
  endpoint: string
  secret?: string
  isActive: boolean
  lastTriggeredAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Predefined E-commerce Platforms
export const PREDEFINED_PLATFORMS: EcommercePlatform[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Leading e-commerce platform for businesses of all sizes',
    website: 'https://www.shopify.com',
    apiVersion: '2024-01',
    isActive: true,
    configTemplate: [
      {
        key: 'storeUrl',
        label: 'Store URL',
        type: 'text',
        required: true,
        description: 'Your Shopify store URL (e.g., your-store.myshopify.com)',
        placeholder: 'your-store.myshopify.com'
      },
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
        description: 'Shopify API key for authentication'
      },
      {
        key: 'apiSecret',
        label: 'API Secret',
        type: 'password',
        required: true,
        description: 'Shopify API secret for authentication'
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
        description: 'Shopify access token for API calls'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Open-source e-commerce plugin for WordPress',
    website: 'https://woocommerce.com',
    apiVersion: 'v3',
    isActive: true,
    configTemplate: [
      {
        key: 'storeUrl',
        label: 'Store URL',
        type: 'text',
        required: true,
        description: 'Your WooCommerce store URL',
        placeholder: 'https://your-store.com'
      },
      {
        key: 'consumerKey',
        label: 'Consumer Key',
        type: 'text',
        required: true,
        description: 'WooCommerce REST API consumer key'
      },
      {
        key: 'consumerSecret',
        label: 'Consumer Secret',
        type: 'password',
        required: true,
        description: 'WooCommerce REST API consumer secret'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'magento',
    name: 'Magento',
    description: 'Powerful open-source e-commerce platform',
    website: 'https://magento.com',
    apiVersion: 'v1',
    isActive: true,
    configTemplate: [
      {
        key: 'storeUrl',
        label: 'Store URL',
        type: 'text',
        required: true,
        description: 'Your Magento store URL',
        placeholder: 'https://your-store.com'
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
        description: 'Magento API access token'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    description: 'All-in-one e-commerce platform',
    website: 'https://www.bigcommerce.com',
    apiVersion: 'v3',
    isActive: true,
    configTemplate: [
      {
        key: 'storeUrl',
        label: 'Store URL',
        type: 'text',
        required: true,
        description: 'Your BigCommerce store URL',
        placeholder: 'https://your-store.com'
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        required: true,
        description: 'BigCommerce API access token'
      },
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'BigCommerce API client ID'
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        description: 'BigCommerce API client secret'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Sync Configuration Types
export interface SyncConfiguration {
  autoSyncProducts: boolean
  autoSyncInventory: boolean
  autoSyncOrders: boolean
  productFields: string[]
  inventoryFields: string[]
  orderFields: string[]
  syncInterval: number
  webhookEnabled: boolean
  webhookSecret?: string
}

export interface ProductSyncRule {
  id: string
  name: string
  conditions: SyncCondition[]
  actions: SyncAction[]
  isActive: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
}

export interface SyncCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than'
  value: any
}

export interface SyncAction {
  type: 'set_field' | 'skip_sync' | 'transform_value' | 'send_notification'
  field?: string
  value?: any
  message?: string
}

// E-commerce Analytics Types
export interface EcommerceAnalytics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  conversionRate: number
  topProducts: EcommerceProductAnalytics[]
  salesByChannel: EcommerceChannelAnalytics[]
  customerAcquisition: EcommerceCustomerAnalytics[]
  period: 'day' | 'week' | 'month' | 'year'
}

export interface EcommerceProductAnalytics {
  productId: string
  productName: string
  revenue: number
  quantity: number
  orders: number
  conversionRate: number
}

export interface EcommerceChannelAnalytics {
  channel: string
  revenue: number
  orders: number
  averageOrderValue: number
  growth: number
}

export interface EcommerceCustomerAnalytics {
  channel: string
  newCustomers: number
  returningCustomers: number
  averageLifetimeValue: number
  retentionRate: number
}