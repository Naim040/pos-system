'use client';

import { useState, useEffect } from 'react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import ThemePreview from '@/components/ThemePreview';
import ThemeTest from '@/components/ThemeTest';

export default function ThemeTestPage() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>
      
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Theme System Test</h1>
          
          <div className="mb-6">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="theme-button mb-4"
            >
              {showPreview ? 'Hide Theme Preview' : 'Show Theme Preview'}
            </button>
            
            {showPreview && (
              <div className="mb-8">
                <ThemePreview />
              </div>
            )}
          </div>
          
          <div className="border-t pt-6">
            <ThemeTest />
          </div>
        </div>
      </div>
    </div>
  );
}