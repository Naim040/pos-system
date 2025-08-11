'use client';

import React, { useState, useEffect } from 'react';
import { themes, defaultTheme, ThemeConfig } from '@/themes/theme-config';

interface ThemeSwitcherProps {
  className?: string;
}

export default function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const [currentTheme, setCurrentTheme] = useState<string>(defaultTheme);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log('ThemeSwitcher mounted');
    const savedTheme = localStorage.getItem('pos-theme');
    console.log('Initial theme check. Saved theme:', savedTheme);
    console.log('Available themes:', Object.keys(themes));
    
    // Check if CSS is loaded
    const styleSheet = Array.from(document.styleSheets).find(sheet => 
      sheet.href?.includes('theme-styles.css')
    );
    console.log('Theme stylesheet loaded:', !!styleSheet);
    
    if (savedTheme && themes[savedTheme]) {
      console.log('Applying saved theme:', savedTheme);
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      console.log('Applying default theme:', defaultTheme);
      setCurrentTheme(defaultTheme);
      applyTheme(defaultTheme);
    }
  }, []);

  const applyTheme = (themeName: string) => {
    const theme = themes[themeName];
    if (!theme) {
      console.error('Theme not found:', themeName);
      return;
    }

    console.log('Applying theme:', themeName, theme);
    
    // Remove existing theme attribute
    document.documentElement.removeAttribute('data-theme');
    
    // Set new theme attribute
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Force a reflow to ensure the theme is applied
    void document.documentElement.offsetHeight;
    
    // Save to localStorage
    localStorage.setItem('pos-theme', themeName);
    
    // Add transition class for smooth theme changes
    document.body.classList.add('theme-transition');
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 300);
    
    // Log the applied CSS variables for debugging
    setTimeout(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      console.log('CSS variables after theme change:', {
        primary: rootStyles.getPropertyValue('--color-primary'),
        background: rootStyles.getPropertyValue('--color-background'),
        text: rootStyles.getPropertyValue('--color-text'),
        themeAttribute: document.documentElement.getAttribute('data-theme')
      });
      
      // Check body styles
      const bodyStyles = getComputedStyle(document.body);
      console.log('Body styles:', {
        backgroundColor: bodyStyles.backgroundColor,
        color: bodyStyles.color
      });
    }, 100);
  };

  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName);
    applyTheme(themeName);
    setIsOpen(false);
  };

  const currentThemeConfig = themes[currentTheme];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-button flex items-center gap-2 px-4 py-2 text-sm font-medium"
        style={{
          background: currentThemeConfig.gradients.primary,
          color: 'white'
        }}
      >
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentThemeConfig.colors.primary }} />
        <span>{currentThemeConfig.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 theme-surface rounded-lg shadow-lg z-50 theme-animate-fadeIn">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3" style={{ color: currentThemeConfig.colors.text }}>
              Choose Theme
            </h3>
            <div className="space-y-2">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    currentTheme === key ? 'ring-2 ring-offset-2' : ''
                  }`}
                  style={{
                    backgroundColor: currentTheme === key ? `${theme.colors.primary}20` : 'transparent',
                    border: currentTheme === key ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                    color: theme.colors.text
                  }}
                >
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{theme.name}</div>
                    <div className="text-xs opacity-70">
                      {theme.colors.primary}, {theme.colors.secondary}, {theme.colors.accent}
                    </div>
                  </div>
                  {currentTheme === key && (
                    <svg className="w-5 h-5" style={{ color: theme.colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}