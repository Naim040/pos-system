"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { 
  ShoppingCart, 
  Package, 
  Box, 
  TrendingUp, 
  Building, 
  Gift, 
  Brain, 
  Printer, 
  Store, 
  FileText, 
  Users, 
  User, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calculator,
  FolderOpen,
  DollarSign,
  Key,
  Network,
  Wrench,
  BarChart3,
  Archive,
  CreditCard,
  Database,
  Shield,
  Truck,
  RefreshCw,
  Globe
} from 'lucide-react'

interface SidebarNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  cartCount: number
  cartTotal: number
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface NavigationItem {
  id: string
  label: string
  icon: any
  show: boolean
  children?: NavigationItem[]
}

interface NavigationGroup {
  id: string
  label: string
  icon: any
  show: boolean
  children: NavigationItem[]
}

export default function SidebarNavigation({ 
  activeTab, 
  onTabChange, 
  cartCount, 
  cartTotal, 
  isCollapsed, 
  onToggleCollapse 
}: SidebarNavigationProps) {
  const { user, logout, hasRole } = useAuth()
  const { toast } = useToast()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const handleLogout = async () => {
    await logout()
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const navigationGroups: NavigationGroup[] = [
    {
      id: 'pos',
      label: 'Point of Sale',
      icon: ShoppingCart,
      show: true,
      children: [
        { id: 'pos', label: 'POS Terminal', icon: ShoppingCart, show: true }
      ]
    },
    {
      id: 'catalog',
      label: 'Catalog',
      icon: Package,
      show: true,
      children: [
        { id: 'products', label: 'Products', icon: Package, show: true },
        { id: 'categories', label: 'Categories', icon: FolderOpen, show: true },
        { id: 'attributes', label: 'Attributes', icon: Archive, show: true },
        { id: 'variations', label: 'Variations', icon: Package, show: true }
      ]
    },
    {
      id: 'ecommerce',
      label: 'E-commerce',
      icon: Globe,
      show: true,
      children: [
        { id: 'ecommerce', label: 'E-commerce Integration', icon: Globe, show: true }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Box,
      show: true,
      children: [
        { id: 'inventory', label: 'Stock Management', icon: Box, show: true },
        { id: 'printer', label: 'Printer Service', icon: Printer, show: true }
      ]
    },
    {
      id: 'sales',
      label: 'Sales & Customers',
      icon: TrendingUp,
      show: true,
      children: [
        { id: 'sales', label: 'Sales History', icon: TrendingUp, show: true },
        { id: 'returns', label: 'Returns & Refunds', icon: RefreshCw, show: true },
        { id: 'customers', label: 'Customers', icon: Building, show: true },
        { id: 'delivery', label: 'Delivery Management', icon: Truck, show: true },
        { id: 'receive-due', label: 'Receive Due', icon: DollarSign, show: true },
        { id: 'loyalty', label: 'Loyalty Program', icon: Gift, show: true },
        { id: 'invoices', label: 'Invoices', icon: FileText, show: true }
      ]
    },
    {
      id: 'financial',
      label: 'Financial',
      icon: Calculator,
      show: true,
      children: [
        { id: 'accounts', label: 'Accounts', icon: Calculator, show: true },
        { id: 'analytics', label: 'Analytics', icon: Brain, show: true }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      show: hasRole('admin') || hasRole('manager'),
      children: [
        { id: 'reporting', label: 'Business Reports', icon: BarChart3, show: hasRole('admin') || hasRole('manager') },
        { id: 'analytics', label: 'Advanced Analytics', icon: Brain, show: hasRole('admin') || hasRole('manager') }
      ]
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: Settings,
      show: hasRole('admin') || hasRole('manager'),
      children: [
        { id: 'settings', label: 'System Settings', icon: Settings, show: hasRole('admin') || hasRole('manager') },
        { id: 'users', label: 'User Management', icon: User, show: hasRole('admin') || hasRole('manager') },
        { id: 'employees', label: 'Employees', icon: Users, show: hasRole('admin') || hasRole('manager') },
        { id: 'printer-management', label: 'Printer Management', icon: Wrench, show: hasRole('admin') || hasRole('manager') }
      ]
    },
    {
      id: 'enterprise',
      label: 'Enterprise',
      icon: Network,
      show: hasRole('admin'),
      children: [
        { id: 'license-management', label: 'License Management', icon: Key, show: hasRole('admin') },
        { id: 'franchise-management', label: 'Franchise Management', icon: Network, show: hasRole('admin') },
        { id: 'multistore', label: 'Multi-Store', icon: Store, show: hasRole('admin') || hasRole('manager') }
      ]
    }
  ].filter(group => group.show)

  const NavButton = ({ item, isChild = false }: { item: NavigationItem, isChild?: boolean }) => (
    <Button
      variant={activeTab === item.id ? "default" : "ghost"}
      className={`w-full justify-start ${isCollapsed ? 'px-2' : isChild ? 'pl-8 pr-4' : 'px-4'} ${
        activeTab === item.id 
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      onClick={() => onTabChange(item.id)}
    >
      <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </Button>
  )

  const NavGroup = ({ group }: { group: NavigationGroup }) => {
    const isExpanded = expandedGroups.includes(group.id)
    const hasActiveChild = group.children.some(child => child.id === activeTab)
    
    return (
      <div className="space-y-1">
        <Button
          variant="ghost"
          className={`w-full justify-between ${isCollapsed ? 'px-2' : 'px-4'} ${
            hasActiveChild 
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => !isCollapsed && toggleGroup(group.id)}
        >
          <div className="flex items-center">
            <group.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="font-medium">{group.label}</span>}
          </div>
          {!isCollapsed && (
            <div className="flex items-center">
              {group.children.length > 1 && (
                isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )
              )}
            </div>
          )}
        </Button>
        
        {!isCollapsed && isExpanded && (
          <div className="space-y-1">
            {group.children
              .filter(child => child.show)
              .map(child => (
                <NavButton key={child.id} item={child} isChild={true} />
              ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-lg font-semibold text-gray-900">POS System</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-1 h-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-2">
        {navigationGroups.map(group => (
          <NavGroup key={group.id} group={group} />
        ))}
      </nav>

      {/* Cart Summary */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {!isCollapsed && (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="flex items-center">
                <ShoppingCart className="h-3 w-3 mr-1" />
                {cartCount} items
              </Badge>
              <Badge variant="outline" className="text-xs">
                Total: ৳{cartTotal.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Badge>
            </div>
          </>
        )}
        {isCollapsed && (
          <div className="flex flex-col items-center space-y-2">
            <Badge variant="secondary" className="flex items-center text-xs">
              <ShoppingCart className="h-3 w-3 mr-1" />
              {cartCount}
            </Badge>
            <Badge variant="outline" className="text-xs">
              ৳{cartTotal.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Badge>
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </span>
                <span className="text-xs text-gray-500">
                  {user?.role === 'franchise' ? `Franchise: ${user?.franchiseName}` : user?.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-500 hover:text-red-700 p-1 h-auto"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-700">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 p-1 h-auto"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}