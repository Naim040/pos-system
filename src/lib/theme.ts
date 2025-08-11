import { createTheme } from 'next-themes'

export const theme = createTheme({
  themes: {
    light: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      background: '#FFFFFF',
      foreground: '#1F2937',
      muted: '#F3F4F6',
      accentForeground: '#FFFFFF',
      border: '#E5E7EB',
      ring: '#3B82F6',
    },
    dark: {
      primary: '#60A5FA',
      secondary: '#34D399',
      accent: '#FBBF24',
      background: '#111827',
      foreground: '#F9FAFB',
      muted: '#1F2937',
      accentForeground: '#111827',
      border: '#374151',
      ring: '#60A5FA',
    },
    colorful: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: '#0F0F23',
      foreground: '#FFFFFF',
      muted: '#1A1A2E',
      accentForeground: '#0F0F23',
      border: '#2A2A3E',
      ring: '#8B5CF6',
    },
    ocean: {
      primary: '#06B6D4',
      secondary: '#3B82F6',
      accent: '#10B981',
      background: '#082F49',
      foreground: '#F0F9FF',
      muted: '#164E63',
      accentForeground: '#082F49',
      border: '#0E7490',
      ring: '#06B6D4',
    },
    sunset: {
      primary: '#F97316',
      secondary: '#EF4444',
      accent: '#F59E0B',
      background: '#7C2D12',
      foreground: '#FEF3C7',
      muted: '#9A3412',
      accentForeground: '#7C2D12',
      border: '#C2410C',
      ring: '#F97316',
    }
  }
})

// CSS Custom Properties for dynamic theming
export const generateThemeCSS = (themeName: string) => {
  const themes = {
    light: {
      '--primary': '#3B82F6',
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#10B981',
      '--secondary-foreground': '#FFFFFF',
      '--accent': '#F59E0B',
      '--accent-foreground': '#FFFFFF',
      '--background': '#FFFFFF',
      '--foreground': '#1F2937',
      '--muted': '#F3F4F6',
      '--muted-foreground': '#6B7280',
      '--border': '#E5E7EB',
      '--ring': '#3B82F6',
      '--success': '#22C55E',
      '--warning': '#F59E0B',
      '--error': '#EF4444',
    },
    dark: {
      '--primary': '#60A5FA',
      '--primary-foreground': '#1E293B',
      '--secondary': '#34D399',
      '--secondary-foreground': '#1E293B',
      '--accent': '#FBBF24',
      '--accent-foreground': '#1E293B',
      '--background': '#111827',
      '--foreground': '#F9FAFB',
      '--muted': '#1F2937',
      '--muted-foreground': '#9CA3AF',
      '--border': '#374151',
      '--ring': '#60A5FA',
      '--success': '#4ADE80',
      '--warning': '#FBBF24',
      '--error': '#F87171',
    },
    colorful: {
      '--primary': '#8B5CF6',
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#EC4899',
      '--secondary-foreground': '#FFFFFF',
      '--accent': '#F59E0B',
      '--accent-foreground': '#FFFFFF',
      '--background': '#0F0F23',
      '--foreground': '#FFFFFF',
      '--muted': '#1A1A2E',
      '--muted-foreground': '#A1A1AA',
      '--border': '#2A2A3E',
      '--ring': '#8B5CF6',
      '--success': '#22C55E',
      '--warning': '#F59E0B',
      '--error': '#EF4444',
    },
    ocean: {
      '--primary': '#06B6D4',
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#3B82F6',
      '--secondary-foreground': '#FFFFFF',
      '--accent': '#10B981',
      '--accent-foreground': '#FFFFFF',
      '--background': '#082F49',
      '--foreground': '#F0F9FF',
      '--muted': '#164E63',
      '--muted-foreground': '#BAE6FD',
      '--border': '#0E7490',
      '--ring': '#06B6D4',
      '--success': '#34D399',
      '--warning': '#F59E0B',
      '--error': '#F87171',
    },
    sunset: {
      '--primary': '#F97316',
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#EF4444',
      '--secondary-foreground': '#FFFFFF',
      '--accent': '#F59E0B',
      '--accent-foreground': '#FFFFFF',
      '--background': '#7C2D12',
      '--foreground': '#FEF3C7',
      '--muted': '#9A3412',
      '--muted-foreground': '#FED7AA',
      '--border': '#C2410C',
      '--ring': '#F97316',
      '--success': '#22C55E',
      '--warning': '#FBBF24',
      '--error': '#F87171',
    }
  }

  return themes[themeName as keyof typeof themes] || themes.light
}

// Gradient definitions
export const gradients = {
  primary: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
  secondary: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  accent: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  success: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  error: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
  sunset: 'linear-gradient(135deg, #F97316 0%, #DC2626 100%)',
  ocean: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
  forest: 'linear-gradient(135deg, #22C55E 0%, #059669 100%)',
  purple: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  pink: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
}

// Animation presets
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 }
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5 }
  },
  slideDown: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5 }
  },
  slideLeft: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5 }
  },
  slideRight: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5 }
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.5 }
  },
  bounce: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  }
}

// Utility functions
export const getThemeColor = (colorName: string, themeName: string) => {
  const themeColors = generateThemeCSS(themeName)
  return themeColors[`--${colorName}` as keyof typeof themeColors] || '#000000'
}

export const getRandomColor = (themeName: string) => {
  const colors = ['primary', 'secondary', 'accent', 'success', 'warning', 'error']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  return getThemeColor(randomColor, themeName)
}

export const getColorPalette = (themeName: string) => {
  const themeColors = generateThemeCSS(themeName)
  return {
    primary: themeColors['--primary'],
    secondary: themeColors['--secondary'],
    accent: themeColors['--accent'],
    success: themeColors['--success'],
    warning: themeColors['--warning'],
    error: themeColors['--error'],
  }
}