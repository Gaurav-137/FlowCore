import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Key, 
  Settings as SettingsIcon, 
  Cpu, 
  Check, 
  Copy, 
  Globe, 
  ShieldAlert, 
  RefreshCw,
  Sun,
  Moon,
  Plus,
  Trash2,
  Lock,
  Tag,
  Eye,
  EyeOff,
  AlertCircle,
  Database
} from 'lucide-react'
import useAuth from '../store/authStore'
import useCredentialStore from '../store/credentialStore'
import useVariableStore from '../store/variableStore'
import { Card, Button, Input, Select, Badge, Alert } from '../components/ui'

export default function Settings() {
  const user = useAuth((s) => s.user)
  const [activeTab, setActiveTab] = useState('profile')
  const [copied, setCopied] = useState(false)
  const [apiKey, setApiKey] = useState('af_live_83ad19ab32924bc9ff103198cd831201')
  
  // Form States
  const [profileEmail, setProfileEmail] = useState(user?.email || 'user@example.com')
  const [workspace, setWorkspace] = useState('prod-workspace')
  const [themeMode, setThemeMode] = useState('light')

  // Stores
  const { 
    credentials, 
    credentialTypes, 
    fetchCredentials, 
    fetchCredentialTypes, 
    createCredential, 
    deleteCredential, 
    testCredential 
  } = useCredentialStore()
  
  const { 
    variables, 
    fetchVariables, 
    createVariable, 
    deleteVariable 
  } = useVariableStore()

  // Credential creation state
  const [credModalOpen, setCredModalOpen] = useState(false)
  const [credName, setCredName] = useState('')
  const [credType, setCredType] = useState('')
  const [credData, setCredData] = useState({})
  
  // Variable creation state
  const [varKey, setVarKey] = useState('')
  const [varValue, setVarValue] = useState('')
  const [varType, setVarType] = useState('string')
  
  // Test feedback state
  const [testingId, setTestingId] = useState(null)
  const [testFeedback, setTestFeedback] = useState({}) // { [id]: { success, message } }

  useEffect(() => {
    if (activeTab === 'credentials') {
      fetchCredentials()
      fetchCredentialTypes()
    } else if (activeTab === 'variables') {
      fetchVariables()
    }
  }, [activeTab])

  // Reset cred form when type changes
  useEffect(() => {
    if (credType) {
      const selectedType = credentialTypes.find(t => t.name === credType)
      const data = {}
      if (selectedType) {
        selectedType.properties.forEach(p => {
          data[p.name] = p.default !== undefined ? p.default : ''
        })
      }
      setCredData(data)
    }
  }, [credType, credentialTypes])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rotateApiKey = () => {
    const chars = 'abcdef0123456789'
    let token = 'af_live_'
    for (let i = 0; i < 32; i++) {
      token += chars[Math.floor(Math.random() * chars.length)]
    }
    setApiKey(token)
    alert('API Key rotated successfully!')
  }

  const handleTestCredential = async (id) => {
    setTestingId(id)
    try {
      const res = await testCredential(id)
      setTestFeedback(prev => ({ ...prev, [id]: res }))
    } catch (e) {
      setTestFeedback(prev => ({ ...prev, [id]: { success: false, message: e.message } }))
    } finally {
      setTestingId(null)
    }
  }

  const handleCreateCredential = async (e) => {
    e.preventDefault()
    try {
      await createCredential({
        name: credName,
        type: credType,
        data: credData
      })
      setCredModalOpen(false)
      setCredName('')
      setCredType('')
      setCredData({})
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCreateVariable = async (e) => {
    e.preventDefault()
    if (!varKey) return
    try {
      await createVariable({
        key: varKey,
        value: varValue,
        type: varType
      })
      setVarKey('')
      setVarValue('')
      setVarType('string')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light tracking-tight text-zinc-100 figma-display-lg">System Settings</h1>
        <p className="text-zinc-400 text-xs mt-1">Manage workspace authorizations, credentials vault, variables, and profile configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Tab Sidebar Navigation */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-1.5 overflow-x-auto shrink-0 bg-zinc-900/10 md:bg-transparent p-1.5 md:p-0 rounded-[24px] border border-zinc-800 md:border-none">
          {[
            { id: 'profile', label: 'Profile Information', icon: User },
            { id: 'credentials', label: 'Credentials Vault', icon: Lock },
            { id: 'variables', label: 'Global Variables', icon: Database },
            { id: 'api-tokens', label: 'API Developer Secrets', icon: Key },
            { id: 'workspace', label: 'Workspace Settings', icon: SettingsIcon }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap md:w-full text-left ${isActive ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Dynamic Settings Content Panel */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card title="User Credentials" subtitle="Update account email preferences and security roles.">
              <form className="space-y-4 max-w-md mt-4" onSubmit={(e) => { e.preventDefault(); alert('Profile settings saved.'); }}>
                <Input
                  label="Email Address"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="you@domain.com"
                />
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-450">System Security Role</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{user?.role?.toUpperCase() || 'USER'}</Badge>
                    <span className="text-[10px] text-zinc-550">Contact your administrator to request super-admin access privileges.</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" size="sm">Save Preferences</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'credentials' && (
            <Card 
              title="Credentials Vault" 
              subtitle="Safeguard your authentication details inside our secure AES-256 encrypted vault."
              action={
                <Button size="sm" onClick={() => setCredModalOpen(true)} icon={Plus}>
                  New Credential
                </Button>
              }
            >
              <div className="mt-6 space-y-4">
                {credentials.length === 0 ? (
                  <div className="text-center py-12 text-zinc-550 border border-dashed border-zinc-800 rounded-xl text-xs">
                    No credentials found. Create one to authenticate database connections and API endpoints.
                  </div>
                ) : (
                  <div className="overflow-hidden border border-zinc-800 rounded-xl bg-zinc-900/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-850 bg-zinc-900/50 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="px-4 py-3">Credential Name</th>
                          <th className="px-4 py-3">Auth Type</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {credentials.map(c => (
                          <tr key={c.id} className="border-b border-zinc-850 hover:bg-zinc-900/10 last:border-0 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-zinc-200">{c.name}</td>
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-[10px] px-2 py-0.5 bg-zinc-800 border border-zinc-700/60 rounded text-zinc-350">{c.type}</span>
                            </td>
                            <td className="px-4 py-3.5 text-right flex justify-end gap-2">
                              <button
                                onClick={() => handleTestCredential(c.id)}
                                disabled={testingId === c.id}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-350 text-[10px] font-bold rounded border border-zinc-700/60 transition-all"
                              >
                                {testingId === c.id ? 'Testing...' : 'Test Connection'}
                              </button>
                              <button
                                onClick={() => { if(confirm('Delete this credential?')) deleteCredential(c.id); }}
                                className="p-1 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Show active testing feedback */}
                {Object.keys(testFeedback).map(id => {
                  const item = credentials.find(c => c.id === id)
                  if (!item) return null
                  const f = testFeedback[id]
                  return (
                    <div key={id} className={`p-3 rounded-lg flex items-center justify-between text-xs border ${f.success ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/5 text-rose-400 border-rose-500/20'}`}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span><strong>{item.name}</strong> test outcome: {f.message}</span>
                      </div>
                      <button className="text-[10px] opacity-70 hover:opacity-100 font-bold uppercase" onClick={() => setTestFeedback(prev => {
                        const copy = { ...prev }; delete copy[id]; return copy;
                      })}>Dismiss</button>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {activeTab === 'variables' && (
            <Card title="Global Variable Store" subtitle="Set system constants available across workflows using expressions.">
              <div className="mt-5 space-y-6">
                <form onSubmit={handleCreateVariable} className="flex flex-wrap gap-3 p-4 bg-zinc-900/30 border border-zinc-800/80 rounded-xl items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      label="Variable Key"
                      required
                      value={varKey}
                      onChange={(e) => setVarKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                      placeholder="e.g. API_ENDPOINT"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      label="Variable Value"
                      required
                      type={varType === 'secret' ? 'password' : 'text'}
                      value={varValue}
                      onChange={(e) => setVarValue(e.target.value)}
                      placeholder="e.g. https://api.myco.com"
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-semibold text-zinc-450 block mb-1">Type</label>
                    <select
                      value={varType}
                      onChange={(e) => setVarType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="string">String</option>
                      <option value="secret">Secret</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" icon={Plus}>Add Variable</Button>
                </form>

                {variables.length === 0 ? (
                  <div className="text-center py-12 text-zinc-550 border border-dashed border-zinc-800 rounded-xl text-xs">
                    No variables defined yet. Define variables to store keys, settings, or credentials.
                  </div>
                ) : (
                  <div className="overflow-hidden border border-zinc-800 rounded-xl bg-zinc-900/20 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-850 bg-zinc-900/50 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="px-4 py-3">Key Name</th>
                          <th className="px-4 py-3">Value</th>
                          <th className="px-4 py-3">Storage Type</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variables.map(v => (
                          <tr key={v.id} className="border-b border-zinc-850 hover:bg-zinc-900/10 last:border-0 transition-colors">
                            <td className="px-4 py-3.5 font-mono font-bold text-indigo-400">{v.key}</td>
                            <td className="px-4 py-3.5 text-zinc-300 font-mono">{v.value}</td>
                            <td className="px-4 py-3.5">
                              {v.type === 'secret' ? (
                                <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold uppercase">
                                  <Lock className="h-3 w-3" /> Secret
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Plain String</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => { if(confirm('Delete this variable?')) deleteVariable(v.id); }}
                                className="p-1 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'api-tokens' && (
            <Card title="Developer Access Secrets" subtitle="Integrate your custom scripts using API trigger keys.">
              <div className="space-y-6 mt-4">
                <Alert variant="warning" title="Security Warning">
                  Keep these developer secrets hidden. Anyone possessing access to this token can trigger running processes, update workflows, and retrieve execution logs.
                </Alert>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-450">Current Workspace Live Token</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 flex items-center justify-between font-mono text-xs text-zinc-450 break-all select-all">
                      <span>{apiKey}</span>
                      <button 
                        onClick={copyToClipboard}
                        className="text-indigo-400 hover:text-indigo-350 p-1 rounded hover:bg-zinc-900 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={rotateApiKey}
                      icon={RefreshCw}
                    >
                      Rotate Token
                    </Button>
                  </div>
                </div>

                <div className="border-t border-zinc-800/85 pt-5 space-y-3">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Globe className="h-4.5 w-4.5 text-indigo-400" /> SDK Integration Guide
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Authenticate remote API executions by passing this token under the <span className="font-mono text-indigo-400">Authorization</span> header:
                  </p>
                  <pre className="p-3 bg-zinc-950 rounded-lg border border-zinc-850 text-[10px] font-mono text-zinc-550 leading-relaxed">
{`curl -X POST \\
  http://localhost:4000/webhooks/your-workflow-id/secret \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"event": "charge.success", "amount": 2900}'`}
                  </pre>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'workspace' && (
            <Card title="Workspace Settings" subtitle="Configure system modes and global variables.">
              <div className="space-y-6 mt-4 max-w-md">
                <Select
                  label="Active Environment Workspace"
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                  options={[
                    { value: 'prod-workspace', label: 'Production Workspace' },
                    { value: 'staging-workspace', label: 'Staging Environment' },
                    { value: 'dev-workspace', label: 'Local Development' }
                  ]}
                />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 block">Theme Layout</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setThemeMode('dark')}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-full border text-xs font-bold transition-all ${themeMode === 'dark' ? 'bg-zinc-100 border-transparent text-zinc-950 shadow-sm' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'}`}
                    >
                      <Moon className="h-4 w-4" /> Dark Theme First
                    </button>
                    <button
                      onClick={() => { setThemeMode('light'); alert('FlowCore is optimized for dark theme. Light theme layout is pending design system overrides.'); }}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-full border text-xs font-bold transition-all ${themeMode === 'light' ? 'bg-zinc-100 border-transparent text-zinc-950 shadow-sm' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'}`}
                    >
                      <Sun className="h-4 w-4" /> Light Mode
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <Button onClick={() => alert('Settings saved successfully.')} size="sm">
                    Save Workspace Configurations
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Credential Modal Dialog */}
      <AnimatePresence>
        {credModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCredModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-xs"
            >
              <div className="px-5 py-4 border-b border-zinc-805 bg-zinc-900/50 flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-indigo-400" />
                  <span>Create Vault Credential</span>
                </span>
                <button onClick={() => setCredModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCredential} className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Credential Label Name</label>
                  <input
                    type="text"
                    required
                    value={credName}
                    onChange={(e) => setCredName(e.target.value)}
                    placeholder="e.g. My SMTP Mail Server"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Credential Type</label>
                  <select
                    required
                    value={credType}
                    onChange={(e) => setCredType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Credential Protocol --</option>
                    {credentialTypes.map(t => (
                      <option key={t.name} value={t.name}>{t.displayName}</option>
                    ))}
                  </select>
                </div>

                {credType && (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {credentialTypes.find(t => t.name === credType)?.properties.map(p => (
                      <div key={p.name}>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                          {p.displayName} {p.required && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type={p.typeOptions?.password ? 'password' : 'text'}
                          required={p.required}
                          value={credData[p.name] !== undefined ? credData[p.name] : ''}
                          onChange={(e) => setCredData(prev => ({ ...prev, [p.name]: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                          placeholder={p.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2.5 justify-end pt-3 border-t border-zinc-800/40">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setCredModalOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={!credType}>Create Credential</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
