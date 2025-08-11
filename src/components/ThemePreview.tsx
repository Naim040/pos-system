'use client';

import React, { useState } from 'react';
import { themes, ThemeConfig } from '@/themes/theme-config';

interface ThemePreviewProps {
  className?: string;
}

export default function ThemePreview({ className = '' }: ThemePreviewProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('vibrant');

  const handleThemeSelect = (themeName: string) => {
    setSelectedTheme(themeName);
  };

  return (
    <div className={`theme-card ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: themes[selectedTheme].colors.text }}>
        Theme Preview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.entries(themes).map(([key, theme]) => (
          <div
            key={key}
            onClick={() => handleThemeSelect(key)}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedTheme === key ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: selectedTheme === key ? `${theme.colors.primary}20` : theme.colors.surface,
              border: selectedTheme === key ? `2px solid ${theme.colors.primary}` : `2px solid ${theme.colors.background}`,
              boxShadow: selectedTheme === key ? '0 8px 25px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
              </div>
              <span className="font-semibold" style={{ color: theme.colors.text }}>
                {theme.name}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.colors.textSecondary }}>Primary:</span>
                <span style={{ color: theme.colors.primary }}>{theme.colors.primary}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.colors.textSecondary }}>Secondary:</span>
                <span style={{ color: theme.colors.secondary }}>{theme.colors.secondary}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.colors.textSecondary }}>Accent:</span>
                <span style={{ color: theme.colors.accent }}>{theme.colors.accent}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-semibold" style={{ color: themes[selectedTheme].colors.text }}>
          Live Preview - {themes[selectedTheme].name} Theme
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium" style={{ color: themes[selectedTheme].colors.textSecondary }}>
              Buttons
            </h4>
            <div className="flex flex-wrap gap-3">
              <button
                className="theme-button"
                style={{
                  background: themes[selectedTheme].gradients.primary,
                  color: 'white'
                }}
              >
                Primary Button
              </button>
              <button
                className="theme-button"
                style={{
                  background: themes[selectedTheme].gradients.secondary,
                  color: 'white'
                }}
              >
                Secondary Button
              </button>
              <button
                className="theme-button"
                style={{
                  background: themes[selectedTheme].gradients.accent,
                  color: themes[selectedTheme].colors.text
                }}
              >
                Accent Button
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium" style={{ color: themes[selectedTheme].colors.textSecondary }}>
              Input Fields
            </h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter your text..."
                className="theme-input w-full"
                style={{
                  backgroundColor: themes[selectedTheme].colors.surface,
                  color: themes[selectedTheme].colors.text,
                  borderColor: 'transparent'
                }}
              />
              <input
                type="email"
                placeholder="Enter your email..."
                className="theme-input w-full"
                style={{
                  backgroundColor: themes[selectedTheme].colors.surface,
                  color: themes[selectedTheme].colors.text,
                  borderColor: 'transparent'
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium" style={{ color: themes[selectedTheme].colors.textSecondary }}>
            Alert Messages
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="theme-alert theme-alert-success">
              <div className="font-medium">Success!</div>
              <div className="text-sm">This is a success message.</div>
            </div>
            <div className="theme-alert theme-alert-warning">
              <div className="font-medium">Warning!</div>
              <div className="text-sm">This is a warning message.</div>
            </div>
            <div className="theme-alert theme-alert-error">
              <div className="font-medium">Error!</div>
              <div className="text-sm">This is an error message.</div>
            </div>
            <div className="theme-alert theme-alert-info">
              <div className="font-medium">Info!</div>
              <div className="text-sm">This is an info message.</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium" style={{ color: themes[selectedTheme].colors.textSecondary }}>
            Cards
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="theme-card">
              <h5 className="font-semibold mb-2" style={{ color: themes[selectedTheme].colors.text }}>
                Product Card
              </h5>
              <p className="text-sm" style={{ color: themes[selectedTheme].colors.textSecondary }}>
                This is a sample product card with the selected theme.
              </p>
              <div className="mt-3 text-lg font-bold" style={{ color: themes[selectedTheme].colors.primary }}>
                $24.99
              </div>
            </div>
            <div className="theme-card">
              <h5 className="font-semibold mb-2" style={{ color: themes[selectedTheme].colors.text }}>
                Order Card
              </h5>
              <p className="text-sm" style={{ color: themes[selectedTheme].colors.textSecondary }}>
                This is a sample order card with the selected theme.
              </p>
              <div className="mt-3 text-lg font-bold" style={{ color: themes[selectedTheme].colors.secondary }}>
                #12345
              </div>
            </div>
            <div className="theme-card">
              <h5 className="font-semibold mb-2" style={{ color: themes[selectedTheme].colors.text }}>
                Customer Card
              </h5>
              <p className="text-sm" style={{ color: themes[selectedTheme].colors.textSecondary }}>
                This is a sample customer card with the selected theme.
              </p>
              <div className="mt-3 text-lg font-bold" style={{ color: themes[selectedTheme].colors.accent }}>
                John Doe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}