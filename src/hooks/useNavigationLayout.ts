"use client"

import { useState, useEffect } from 'react'

export type NavigationLayout = 'horizontal' | 'vertical'

interface NavigationLayoutHook {
  layout: NavigationLayout
  isSidebarCollapsed: boolean
  setLayout: (layout: NavigationLayout) => void
  toggleSidebarCollapse: () => void
  saveLayoutPreference: (layout: NavigationLayout, saveToDatabase?: boolean) => Promise<void>
}

export function useNavigationLayout(): NavigationLayoutHook {
  const [layout, setLayoutState] = useState<NavigationLayout>('vertical')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Load layout preference from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('pos-navigation-layout') as NavigationLayout
    const savedCollapsed = localStorage.getItem('pos-sidebar-collapsed') === 'true'
    
    // If no saved preference, use vertical as default (changed from horizontal)
    if (savedLayout) {
      setLayoutState(savedLayout)
    } else {
      // Explicitly set to vertical if no preference exists
      setLayoutState('vertical')
      localStorage.setItem('pos-navigation-layout', 'vertical')
    }
    setIsSidebarCollapsed(savedCollapsed)
  }, [])

  const setLayout = (newLayout: NavigationLayout) => {
    setLayoutState(newLayout)
    localStorage.setItem('pos-navigation-layout', newLayout)
  }

  const toggleSidebarCollapse = () => {
    const newCollapsed = !isSidebarCollapsed
    setIsSidebarCollapsed(newCollapsed)
    localStorage.setItem('pos-sidebar-collapsed', newCollapsed.toString())
  }

  const saveLayoutPreference = async (newLayout: NavigationLayout, saveToDatabase: boolean = false) => {
    // Always save to localStorage
    setLayout(newLayout)
    
    if (saveToDatabase) {
      try {
        // Save to database for user-specific preference
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appearance: {
              navigationLayout: newLayout
            }
          }),
        })

        if (!response.ok) {
          console.warn('Failed to save layout preference to database')
        }
      } catch (error) {
        console.warn('Error saving layout preference to database:', error)
      }
    }
  }

  return {
    layout,
    isSidebarCollapsed,
    setLayout,
    toggleSidebarCollapse,
    saveLayoutPreference
  }
}