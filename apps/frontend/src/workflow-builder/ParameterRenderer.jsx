import React, { useState, useEffect } from 'react'
import { AlertCircle, HelpCircle, Code, Plus, Trash2, Check, ExternalLink } from 'lucide-react'
import useCredentialStore from '../store/credentialStore'
import useVariableStore from '../store/variableStore'

export default function ParameterRenderer({ properties, values, onChange, nodeData = {}, previousNodes = [] }) {
  const { credentials, fetchCredentials } = useCredentialStore()
  const { variables, fetchVariables } = useVariableStore()
  const [expressionModes, setExpressionModes] = useState({}) // { [propName]: boolean }

  useEffect(() => {
    fetchCredentials()
    fetchVariables()
  }, [])

  const handleFieldChange = (name, val) => {
    onChange(name, val)
  }

  const toggleExpressionMode = (name) => {
    setExpressionModes(prev => {
      const active = !prev[name]
      // Initialize with {{ }} if switching to expression
      if (active && (!values[name] || typeof values[name] !== 'string' || !values[name].startsWith('{{'))) {
        onChange(name, `{{ $json.field }}`)
      }
      return { ...prev, [name]: active }
    })
  }

  // Check display options visibility rules
  const shouldShow = (prop) => {
    if (!prop.displayOptions || !prop.displayOptions.show) return true
    for (const [key, allowed] of Object.entries(prop.displayOptions.show)) {
      const val = values[key]
      if (Array.isArray(allowed)) {
        if (!allowed.includes(val)) return false
      } else {
        if (val !== allowed) return false
      }
    }
    return true
  }

  return (
    <div className="space-y-6">
      {properties.map((prop) => {
        if (!shouldShow(prop)) return null

        const isExpr = expressionModes[prop.name] || (typeof values[prop.name] === 'string' && values[prop.name].includes('{{'))
        
        return (
          <div key={prop.name} className="space-y-1.5 border-b border-zinc-800/40 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-400 tracking-wide uppercase flex items-center gap-1.5">
                {prop.displayName}
                {prop.required && <span className="text-indigo-400 font-bold">*</span>}
                {prop.description && (
                  <div className="group relative">
                    <HelpCircle className="h-3 w-3 text-zinc-500 cursor-pointer" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-48 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 p-2 rounded shadow-xl pointer-events-none z-50">
                      {prop.description}
                    </div>
                  </div>
                )}
              </label>

              {/* Expression Mode Toggle */}
              {['string', 'number', 'json', 'code'].includes(prop.type) && (
                <button
                  type="button"
                  onClick={() => toggleExpressionMode(prop.name)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all border ${isExpr ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700/60 hover:text-zinc-350'}`}
                >
                  <Code className="h-2.5 w-2.5" />
                  <span>EXPR</span>
                </button>
              )}
            </div>

            {/* Render inputs based on type */}
            {isExpr ? (
              // Expression Editor Field
              <div className="space-y-1">
                <textarea
                  rows={2}
                  value={values[prop.name] !== undefined ? String(values[prop.name]) : ''}
                  onChange={(e) => handleFieldChange(prop.name, e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500 rounded px-3 py-2 text-xs font-mono text-zinc-150 focus:outline-none placeholder-zinc-600 focus:ring-1 focus:ring-indigo-500/20"
                  placeholder="e.g. {{ $json.myField }}"
                />
                <div className="flex flex-wrap gap-1 items-center bg-zinc-900/30 border border-zinc-850 p-1.5 rounded text-[10px] text-zinc-400">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mr-1">Insert:</span>
                  <button
                    type="button"
                    onClick={() => handleFieldChange(prop.name, (values[prop.name] || '') + '{{ $json. }}')}
                    className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded font-mono text-[9px]"
                  >
                    $json
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange(prop.name, (values[prop.name] || '') + '{{ $vars. }}')}
                    className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded font-mono text-[9px]"
                  >
                    $vars
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange(prop.name, (values[prop.name] || '') + '{{ $now }}')}
                    className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded font-mono text-[9px]"
                  >
                    $now
                  </button>
                </div>
              </div>
            ) : (
              // Static Editors
              <div>
                {prop.type === 'options' && (
                  <select
                    value={values[prop.name] !== undefined ? values[prop.name] : prop.default || ''}
                    onChange={(e) => handleFieldChange(prop.name, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  >
                    {prop.options?.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-200">
                        {opt.name}
                      </option>
                    ))}
                  </select>
                )}

                {prop.type === 'boolean' && (
                  <label className="relative inline-flex items-center cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={!!values[prop.name]}
                      onChange={(e) => handleFieldChange(prop.name, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-zinc-100 border border-zinc-750" />
                    <span className="ml-3 text-xs font-semibold text-zinc-400">
                      {values[prop.name] ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                )}

                {prop.type === 'string' && (
                  <input
                    type={prop.typeOptions?.password ? 'password' : 'text'}
                    value={values[prop.name] !== undefined ? values[prop.name] : prop.default || ''}
                    onChange={(e) => handleFieldChange(prop.name, e.target.value)}
                    placeholder={prop.placeholder}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none placeholder-zinc-600 focus:ring-1 focus:ring-indigo-500/20"
                  />
                )}

                {prop.type === 'number' && (
                  <input
                    type="number"
                    value={values[prop.name] !== undefined ? values[prop.name] : prop.default || ''}
                    onChange={(e) => handleFieldChange(prop.name, Number(e.target.value))}
                    placeholder={prop.placeholder}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                )}

                {prop.type === 'json' && (
                  <textarea
                    rows={prop.typeOptions?.rows || 4}
                    value={values[prop.name] !== undefined ? (typeof values[prop.name] === 'object' ? JSON.stringify(values[prop.name], null, 2) : values[prop.name]) : ''}
                    onChange={(e) => {
                      let val = e.target.value
                      try { val = JSON.parse(e.target.value) } catch {}
                      handleFieldChange(prop.name, val)
                    }}
                    placeholder={prop.placeholder || '{\n  "key": "value"\n}'}
                    className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                )}

                {prop.type === 'code' && (
                  <textarea
                    rows={prop.typeOptions?.rows || 8}
                    value={values[prop.name] !== undefined ? values[prop.name] : prop.default || ''}
                    onChange={(e) => handleFieldChange(prop.name, e.target.value)}
                    placeholder={prop.placeholder || '// Write javascript code here\nreturn $input.all();'}
                    className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                )}

                {prop.type === 'fixedCollection' && (
                  <div className="space-y-2 border border-zinc-800/60 rounded-lg p-3 bg-zinc-950/20">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">{prop.displayName} List</span>
                      <button
                        type="button"
                        onClick={() => {
                          const list = Array.isArray(values[prop.name]) ? [...values[prop.name]] : []
                          // Add empty entry with properties
                          const schema = prop.options?.[0]?.values || []
                          const newItem = {}
                          schema.forEach(s => { newItem[s.name] = s.default || '' })
                          list.push(newItem)
                          handleFieldChange(prop.name, list)
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Field</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {Array.isArray(values[prop.name]) && values[prop.name].map((item, index) => (
                        <div key={index} className="flex gap-2 items-center bg-zinc-900/20 p-2 rounded border border-zinc-850">
                          {prop.options?.[0]?.values?.map((col) => (
                            <div key={col.name} className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={item[col.name] || ''}
                                onChange={(e) => {
                                  const list = [...values[prop.name]]
                                  list[index] = { ...item, [col.name]: e.target.value }
                                  handleFieldChange(prop.name, list)
                                }}
                                placeholder={col.displayName}
                                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const list = values[prop.name].filter((_, idx) => idx !== index)
                              handleFieldChange(prop.name, list)
                            }}
                            className="text-zinc-500 hover:text-rose-450 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {(!values[prop.name] || values[prop.name].length === 0) && (
                        <div className="text-[10px] text-zinc-500 text-center py-2 italic">No custom fields added yet.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
