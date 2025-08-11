'use client';

import React from 'react';

export default function ThemeTest() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Theme Test Components</h1>
      
      {/* Test Buttons */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <button className="theme-button">Primary Button</button>
          <button className="theme-secondary px-4 py-2 rounded-lg font-medium">Secondary Button</button>
          <button className="theme-accent px-4 py-2 rounded-lg font-medium">Accent Button</button>
        </div>
      </div>

      {/* Test Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="theme-card">
            <h3 className="text-lg font-semibold mb-2">Product Card</h3>
            <p className="text-sm opacity-75">This is a sample product card</p>
            <div className="mt-3 text-lg font-bold">$24.99</div>
          </div>
          <div className="theme-card">
            <h3 className="text-lg font-semibold mb-2">Order Card</h3>
            <p className="text-sm opacity-75">This is a sample order card</p>
            <div className="mt-3 text-lg font-bold">#12345</div>
          </div>
          <div className="theme-card">
            <h3 className="text-lg font-semibold mb-2">Customer Card</h3>
            <p className="text-sm opacity-75">This is a sample customer card</p>
            <div className="mt-3 text-lg font-bold">John Doe</div>
          </div>
        </div>
      </div>

      {/* Test Inputs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Input Fields</h2>
        <div className="space-y-3 max-w-md">
          <input
            type="text"
            placeholder="Enter your text..."
            className="theme-input w-full"
          />
          <input
            type="email"
            placeholder="Enter your email..."
            className="theme-input w-full"
          />
        </div>
      </div>

      {/* Test Alerts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Alert Messages</h2>
        <div className="space-y-3 max-w-2xl">
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

      {/* Test Navigation */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Navigation</h2>
        <div className="theme-navbar">
          <h3 className="text-white text-lg font-semibold">Sample Navigation Bar</h3>
        </div>
        <div className="theme-sidebar">
          <h3 className="text-white text-lg font-semibold">Sample Sidebar</h3>
        </div>
      </div>
    </div>
  );
}