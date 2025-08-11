'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { ColorfulCard } from '@/components/ui/colorful-card'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Palette, Save, RotateCcw, Download, Upload, Eye, Sparkles } from 'lucide-react'
import { generateThemeCSS } from '@/lib/theme'

interface ThemeSettings {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  background: string
  foreground: string
  borderRadius: string
  fontFamily: string
  animationSpeed: number
  shadowIntensity: number
}

const defaultThemes = {
  light: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    foreground: '#1F2937',
    borderRadius: '0.5rem',
    fontFamily: 'Inter',
    animationSpeed: 300,
    shadowIntensity: 1
  },
  dark: {
    primary: '#60A5FA',
    secondary: '#34D399',
    accent: '#FBBF24',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    background: '#111827',
    foreground: '#F9FAFB',
    borderRadius: '0.5rem',
    fontFamily: 'Inter',
    animationSpeed: 300,
    shadowIntensity: 1
  },
  colorful: {
    primary: '#8B5CF6',
    secondary: '#EC4899',
    accent: '#F59E0B',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#0F0F23',
    foreground: '#FFFFFF',
    borderRadius: '0.75rem',
    fontFamily: 'Inter',
    animationSpeed: 250,
    shadowIntensity: 1.2
  },
  ocean: {
    primary: '#06B6D4',
    secondary: '#3B82F6',
    accent: '#10B981',
    success: '#34D399',
    warning: '#F59E0B',
    error: '#F87171',
    background: '#082F49',
    foreground: '#F0F9FF',
    borderRadius: '0.5rem',
    fontFamily: 'Inter',
    animationSpeed: 350,
    shadowIntensity: 0.8
  },
  sunset: {
    primary: '#F97316',
    secondary: '#EF4444',
    accent: '#F59E0B',
    success: '#22C55E',
    warning: '#FBBF24',
    error: '#F87171',
    background: '#7C2D12',
    foreground: '#FEF3C7',
    borderRadius: '1rem',
    fontFamily: 'Inter',
    animationSpeed: 400,
    shadowIntensity: 1.5
  }
}

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' }
]

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<ThemeSettings>(defaultThemes[theme as keyof typeof defaultThemes] || defaultThemes.light)
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'effects' | 'presets'>('colors')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleColorChange = (colorKey: keyof ThemeSettings, value: string) => {
    setSettings(prev => ({ ...prev, [colorKey]: value }))
  }

  const handleSettingChange = (settingKey: keyof ThemeSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [settingKey]: value }))
  }

  const applyTheme = () => {
    // Apply custom theme to CSS variables
    const root = document.documentElement
    Object.entries(settings).forEach(([key, value]) => {
      if (key !== 'animationSpeed' && key !== 'shadowIntensity' && key !== 'fontFamily') {
        root.style.setProperty(`--${key}`, value)
      }
    })
    
    // Apply font family
    root.style.setProperty('--font-family', settings.fontFamily)
    
    // Apply animation speed
    root.style.setProperty('--animation-speed', `${settings.animationSpeed}ms`)
    
    // Apply shadow intensity
    root.style.setProperty('--shadow-intensity', settings.shadowIntensity.toString())
    
    // Show success message
    alert('Theme applied successfully!')
  }

  const resetToDefault = () => {
    const defaultTheme = defaultThemes[theme as keyof typeof defaultThemes] || defaultThemes.light
    setSettings(defaultTheme)
  }

  const exportTheme = () => {
    const themeData = {
      name: `Custom ${theme}`,
      settings,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `custom-theme-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const themeData = JSON.parse(e.target?.result as string)
          setSettings(themeData.settings)
          alert('Theme imported successfully!')
        } catch (error) {
          alert('Invalid theme file!')
        }
      }
      reader.readAsText(file)
    }
  }

  const loadPreset = (presetName: keyof typeof defaultThemes) => {
    setSettings(defaultThemes[presetName])
    setTheme(presetName)
  }

  const ColorPicker = ({ color, onChange, label }: { color: string; onChange: (color: string) => void; label: string }) => (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 w-24">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-24"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Theme Customizer</h1>
                <p className="text-gray-600">Create your perfect POS theme</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <AnimatedButton
                variant="outline"
                size="md"
                icon={<Eye className="w-4 h-4" />}
                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              >
                Preview
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                size="md"
                icon={<Save className="w-4 h-4" />}
                onClick={applyTheme}
              >
                Apply Theme
              </AnimatedButton>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
            {[
              { key: 'colors', label: 'Colors', icon: <Palette className="w-4 h-4" /> },
              { key: 'typography', label: 'Typography', icon: <span className="text-lg">Aa</span> },
              { key: 'effects', label: 'Effects', icon: <Sparkles className="w-4 h-4" /> },
              { key: 'presets', label: 'Presets', icon: <RotateCcw className="w-4 h-4" /> }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-2">
            <ColorfulCard color="primary" variant="solid" hoverEffect="lift">
              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">Color Settings</h2>
                  
                  <div className="space-y-4">
                    <ColorPicker
                      color={settings.primary}
                      onChange={(color) => handleColorChange('primary', color)}
                      label="Primary"
                    />
                    <ColorPicker
                      color={settings.secondary}
                      onChange={(color) => handleColorChange('secondary', color)}
                      label="Secondary"
                    />
                    <ColorPicker
                      color={settings.accent}
                      onChange={(color) => handleColorChange('accent', color)}
                      label="Accent"
                    />
                    <ColorPicker
                      color={settings.success}
                      onChange={(color) => handleColorChange('success', color)}
                      label="Success"
                    />
                    <ColorPicker
                      color={settings.warning}
                      onChange={(color) => handleColorChange('warning', color)}
                      label="Warning"
                    />
                    <ColorPicker
                      color={settings.error}
                      onChange={(color) => handleColorChange('error', color)}
                      label="Error"
                    />
                    <ColorPicker
                      color={settings.background}
                      onChange={(color) => handleColorChange('background', color)}
                      label="Background"
                    />
                    <ColorPicker
                      color={settings.foreground}
                      onChange={(color) => handleColorChange('foreground', color)}
                      label="Foreground"
                    />
                  </div>
                </motion.div>
              )}

              {/* Typography Tab */}
              {activeTab === 'typography' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">Typography Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Font Family</label>
                      <select
                        value={settings.fontFamily}
                        onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        {fontOptions.map((font) => (
                          <option key={font.value} value={font.value} className="text-gray-800">
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Border Radius</label>
                      <select
                        value={settings.borderRadius}
                        onChange={(e) => handleSettingChange('borderRadius', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        <option value="0.25rem" className="text-gray-800">Small</option>
                        <option value="0.5rem" className="text-gray-800">Medium</option>
                        <option value="0.75rem" className="text-gray-800">Large</option>
                        <option value="1rem" className="text-gray-800">Extra Large</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Effects Tab */}
              {activeTab === 'effects' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">Effects Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Animation Speed: {settings.animationSpeed}ms
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="1000"
                        step="50"
                        value={settings.animationSpeed}
                        onChange={(e) => handleSettingChange('animationSpeed', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Shadow Intensity: {settings.shadowIntensity}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={settings.shadowIntensity}
                        onChange={(e) => handleSettingChange('shadowIntensity', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Presets Tab */}
              {activeTab === 'presets' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">Theme Presets</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(defaultThemes).map(([key, themeData]) => (
                      <motion.div
                        key={key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ColorfulCard
                          color="primary"
                          variant="outline"
                          hoverEffect="lift"
                          className="cursor-pointer"
                          onClick={() => loadPreset(key as keyof typeof defaultThemes)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: themeData.primary }}
                              />
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: themeData.secondary }}
                              />
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: themeData.accent }}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white capitalize">{key}</h3>
                              <p className="text-white/70 text-sm">
                                {themeData.primary}, {themeData.secondary}, {themeData.accent}
                              </p>
                            </div>
                          </div>
                        </ColorfulCard>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-white/20">
                <AnimatedButton
                  variant="secondary"
                  size="md"
                  icon={<RotateCcw className="w-4 h-4" />}
                  onClick={resetToDefault}
                >
                  Reset
                </AnimatedButton>
                
                <AnimatedButton
                  variant="accent"
                  size="md"
                  icon={<Download className="w-4 h-4" />}
                  onClick={exportTheme}
                >
                  Export
                </AnimatedButton>
                
                <label className="flex-1">
                  <AnimatedButton
                    variant="warning"
                    size="md"
                    icon={<Upload className="w-4 h-4" />}
                    className="w-full"
                    as="div"
                  >
                    Import Theme
                  </AnimatedButton>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importTheme}
                    className="hidden"
                  />
                </label>
              </div>
            </ColorfulCard>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <ColorfulCard color="secondary" variant="solid" hoverEffect="lift">
              <h2 className="text-xl font-semibold text-white mb-4">Live Preview</h2>
              
              <div className="space-y-4">
                {/* Preview Cards */}
                <div className="p-4 rounded-lg bg-white/10">
                  <h3 className="font-semibold text-white mb-2">Sample Card</h3>
                  <p className="text-white/70 text-sm mb-3">
                    This is a preview of how your theme will look with the current settings.
                  </p>
                  <AnimatedButton
                    variant="primary"
                    size="sm"
                  >
                    Sample Button
                  </AnimatedButton>
                </div>

                {/* Color Palette */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Color Palette</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(settings).filter(([key]) => 
                      ['primary', 'secondary', 'accent', 'success', 'warning', 'error'].includes(key)
                    ).map(([key, color]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-white/70 text-xs capitalize">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings Summary */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Settings Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>Font Family:</span>
                      <span className="text-white">{settings.fontFamily}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Border Radius:</span>
                      <span className="text-white">{settings.borderRadius}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Animation Speed:</span>
                      <span className="text-white">{settings.animationSpeed}ms</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Shadow Intensity:</span>
                      <span className="text-white">{settings.shadowIntensity}</span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <AnimatedButton
                  variant="success"
                  size="md"
                  icon={<Save className="w-4 h-4" />}
                  className="w-full"
                  onClick={applyTheme}
                >
                  Apply Theme
                </AnimatedButton>
              </div>
            </ColorfulCard>
          </div>
        </div>
      </div>
    </div>
  )
}