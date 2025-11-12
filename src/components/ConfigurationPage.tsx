'use client'

import { useState } from 'react'

interface ConfigurationSettings {
  app: {
    name: string
    version: string
    environment: 'development' | 'staging' | 'production'
    baseUrl: string
  }
  database: {
    host: string
    port: number
    name: string
    ssl: boolean
  }
  auth: {
    provider: 'local' | 'oauth' | 'ldap'
    tokenExpiry: number
    enableRegistration: boolean
  }
  features: {
    enableDepartmentManagement: boolean
    enableStudentAllocation: boolean
    enableFacultyAssignment: boolean
    enableReports: boolean
  }
  ui: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    itemsPerPage: number
  }
}

export default function ConfigurationPage() {
  const [activeSection, setActiveSection] = useState('app')
  const [config, setConfig] = useState<ConfigurationSettings>({
    app: {
      name: 'LearnAIA',
      version: '1.0.0',
      environment: 'development',
      baseUrl: 'http://localhost:3000'
    },
    database: {
      host: 'localhost',
      port: 3306,
      name: 'learnaia_db',
      ssl: false
    },
    auth: {
      provider: 'local',
      tokenExpiry: 24,
      enableRegistration: true
    },
    features: {
      enableDepartmentManagement: true,
      enableStudentAllocation: true,
      enableFacultyAssignment: true,
      enableReports: true
    },
    ui: {
      theme: 'light',
      language: 'en',
      itemsPerPage: 20
    }
  })

  const [showSuccess, setShowSuccess] = useState(false)

  const handleSaveConfig = () => {
    // Here you would typically save to a backend API or local storage
    console.log('Saving configuration:', config)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      setConfig({
        app: {
          name: 'LearnAIA',
          version: '1.0.0',
          environment: 'development',
          baseUrl: 'http://localhost:3000'
        },
        database: {
          host: 'localhost',
          port: 3306,
          name: 'learnaia_db',
          ssl: false
        },
        auth: {
          provider: 'local',
          tokenExpiry: 24,
          enableRegistration: true
        },
        features: {
          enableDepartmentManagement: true,
          enableStudentAllocation: true,
          enableFacultyAssignment: true,
          enableReports: true
        },
        ui: {
          theme: 'light',
          language: 'en',
          itemsPerPage: 20
        }
      })
    }
  }

  const renderAppSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
          <input
            type="text"
            value={config.app.name}
            onChange={(e) => setConfig({
              ...config,
              app: { ...config.app, name: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
          <input
            type="text"
            value={config.app.version}
            onChange={(e) => setConfig({
              ...config,
              app: { ...config.app, version: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
          <select
            value={config.app.environment}
            onChange={(e) => setConfig({
              ...config,
              app: { ...config.app, environment: e.target.value as 'development' | 'staging' | 'production' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
          <input
            type="url"
            value={config.app.baseUrl}
            onChange={(e) => setConfig({
              ...config,
              app: { ...config.app, baseUrl: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://your-domain.com"
          />
        </div>
      </div>
    </div>
  )

  const renderDatabaseSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Database Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Database Host</label>
          <input
            type="text"
            value={config.database.host}
            onChange={(e) => setConfig({
              ...config,
              database: { ...config.database, host: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
          <input
            type="number"
            value={config.database.port}
            onChange={(e) => setConfig({
              ...config,
              database: { ...config.database, port: parseInt(e.target.value) || 3306 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
          <input
            type="text"
            value={config.database.name}
            onChange={(e) => setConfig({
              ...config,
              database: { ...config.database, name: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="ssl"
            checked={config.database.ssl}
            onChange={(e) => setConfig({
              ...config,
              database: { ...config.database, ssl: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="ssl" className="ml-2 block text-sm text-gray-700">
            Enable SSL Connection
          </label>
        </div>
      </div>
    </div>
  )

  const renderAuthSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Authentication Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Authentication Provider</label>
          <select
            value={config.auth.provider}
            onChange={(e) => setConfig({
              ...config,
              auth: { ...config.auth, provider: e.target.value as 'local' | 'oauth' | 'ldap' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="local">Local Authentication</option>
            <option value="oauth">OAuth 2.0</option>
            <option value="ldap">LDAP</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Expiry (hours)</label>
          <input
            type="number"
            value={config.auth.tokenExpiry}
            onChange={(e) => setConfig({
              ...config,
              auth: { ...config.auth, tokenExpiry: parseInt(e.target.value) || 24 }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max="168"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableRegistration"
            checked={config.auth.enableRegistration}
            onChange={(e) => setConfig({
              ...config,
              auth: { ...config.auth, enableRegistration: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enableRegistration" className="ml-2 block text-sm text-gray-700">
            Enable User Registration
          </label>
        </div>
      </div>
    </div>
  )

  const renderFeatureSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Feature Toggles</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableDepartmentManagement"
            checked={config.features.enableDepartmentManagement}
            onChange={(e) => setConfig({
              ...config,
              features: { ...config.features, enableDepartmentManagement: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enableDepartmentManagement" className="ml-2 block text-sm text-gray-700">
            Department Management
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableStudentAllocation"
            checked={config.features.enableStudentAllocation}
            onChange={(e) => setConfig({
              ...config,
              features: { ...config.features, enableStudentAllocation: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enableStudentAllocation" className="ml-2 block text-sm text-gray-700">
            Student Allocation
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableFacultyAssignment"
            checked={config.features.enableFacultyAssignment}
            onChange={(e) => setConfig({
              ...config,
              features: { ...config.features, enableFacultyAssignment: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enableFacultyAssignment" className="ml-2 block text-sm text-gray-700">
            Faculty Assignment
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableReports"
            checked={config.features.enableReports}
            onChange={(e) => setConfig({
              ...config,
              features: { ...config.features, enableReports: e.target.checked }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enableReports" className="ml-2 block text-sm text-gray-700">
            Reports & Analytics
          </label>
        </div>
      </div>
    </div>
  )

  const renderUISettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">User Interface Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
          <select
            value={config.ui.theme}
            onChange={(e) => setConfig({
              ...config,
              ui: { ...config.ui, theme: e.target.value as 'light' | 'dark' | 'auto' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="light">Light Theme</option>
            <option value="dark">Dark Theme</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            value={config.ui.language}
            onChange={(e) => setConfig({
              ...config,
              ui: { ...config.ui, language: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
          <select
            value={config.ui.itemsPerPage}
            onChange={(e) => setConfig({
              ...config,
              ui: { ...config.ui, itemsPerPage: parseInt(e.target.value) }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Configuration Settings</h1>
              <p className="text-gray-600 mt-1">Manage application settings and preferences</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetToDefaults}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
          
          {showSuccess && (
            <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✓ Configuration saved successfully!</p>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap border-b border-gray-200">
            {[
              { id: 'app', label: 'Application', icon: '⚙️' },
              { id: 'database', label: 'Database', icon: '🗄️' },
              { id: 'auth', label: 'Authentication', icon: '🔐' },
              { id: 'features', label: 'Features', icon: '🚀' },
              { id: 'ui', label: 'Interface', icon: '🎨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeSection === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeSection === 'app' && renderAppSettings()}
          {activeSection === 'database' && renderDatabaseSettings()}
          {activeSection === 'auth' && renderAuthSettings()}
          {activeSection === 'features' && renderFeatureSettings()}
          {activeSection === 'ui' && renderUISettings()}
        </div>

        {/* Configuration Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuration Preview</h3>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-700">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
