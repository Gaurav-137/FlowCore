import React, { useState, useEffect } from 'react'
import { Plus, Check, Loader2, Key, ShieldCheck, AlertCircle } from 'lucide-react'
import useCredentialStore from '../store/credentialStore'

export default function CredentialSelector({ credTypeNeeded, value, onChange }) {
  const { credentials, credentialTypes, fetchCredentials, fetchCredentialTypes, createCredential, testCredential } = useCredentialStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [newCredName, setNewCredName] = useState('')
  const [newCredData, setNewCredData] = useState({})
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCredentials()
    fetchCredentialTypes()
  }, [])

  const credTypeInfo = credentialTypes.find(t => t.name === credTypeNeeded)
  const filteredCredentials = credentials.filter(c => c.type === credTypeNeeded)

  // Initialize new credential data fields
  useEffect(() => {
    if (credTypeInfo && modalOpen) {
      setNewCredName(`${credTypeInfo.displayName} Credential`)
      const initialData = {}
      credTypeInfo.properties.forEach(p => {
        initialData[p.name] = p.default !== undefined ? p.default : ''
      })
      setNewCredData(initialData)
      setTestResult(null)
    }
  }, [credTypeInfo, modalOpen])

  const handleTest = async () => {
    if (!value) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await testCredential(value)
      setTestResult(res)
    } catch (e) {
      setTestResult({ success: false, message: e.message })
    } finally {
      setTesting(false)
    }
  };

  const handleCreateCredential = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await createCredential({
        name: newCredName,
        type: credTypeNeeded,
        data: newCredData
      })
      onChange(created.id)
      setModalOpen(false)
    } catch (err) {
      alert('Failed to save credential: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!credTypeInfo) return null

  return (
    <div className="space-y-2.5 bg-zinc-950/20 border border-zinc-800/40 rounded-lg p-3.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
          <Key className="h-3.5 w-3.5" />
          <span>Credentials: {credTypeInfo.displayName}</span>
        </label>
        
        {value && (
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="text-[9px] font-bold tracking-wide uppercase px-2 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-350 border border-zinc-750/80 rounded transition-all flex items-center gap-1"
          >
            {testing ? (
              <>
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
        >
          <option value="">-- Select {credTypeInfo.displayName} --</option>
          {filteredCredentials.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      {testResult && (
        <div className={`flex items-start gap-2 p-2 rounded-lg text-[10px] ${testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {testResult.success ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
          <div>
            <div className="font-bold">{testResult.success ? 'Connection Success' : 'Connection Failed'}</div>
            <div className="opacity-90 mt-0.5">{testResult.message}</div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
              <span className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-400" />
                <span>Create {credTypeInfo.displayName}</span>
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-350 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Credential Name</label>
                <input
                  type="text"
                  required
                  value={newCredName}
                  onChange={(e) => setNewCredName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {credTypeInfo.properties.map((p) => (
                  <div key={p.name}>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      {p.displayName} {p.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type={p.typeOptions?.password ? 'password' : 'text'}
                      required={p.required}
                      value={newCredData[p.name] !== undefined ? newCredData[p.name] : ''}
                      onChange={(e) => setNewCredData(prev => ({ ...prev, [p.name]: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                      placeholder={p.placeholder}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-zinc-800/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Credential</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
