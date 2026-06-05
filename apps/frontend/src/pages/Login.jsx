import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, CheckCircle2, Cpu, Zap, Shield, ArrowRight } from 'lucide-react'
import api from '../services/api'
import useAuth from '../store/authStore'
import { Button, Input } from '../components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setTokens = useAuth((s) => s.setTokens)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      return setError('Please fill in all fields')
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      setTokens(res.data.tokens, res.data.user)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row bg-zinc-950 overflow-y-auto">
      {/* LEFT SIDE: SaaS Value Proposition & branding */}
      <div className="relative flex-1 hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-950/60 via-zinc-950 to-zinc-950 border-r border-zinc-900 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        
        {/* Branding header */}
        <div className="flex items-center gap-3 z-10">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">FlowCore</span>
              <span className="text-[10px] block text-zinc-500 font-semibold tracking-widest uppercase">WORKFLOW SaaS</span>
            </div>
          </div>

          <div className="my-auto max-w-md z-10 space-y-8">
            <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Orchestrate your apps <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">visually in real-time.</span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Connect webhooks, schedules, actions, and custom code blocks in seconds. Build complex automations with our robust canvas builder.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-zinc-300">Fast low-latency executions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-zinc-300">Visual monitoring & stack-trace logs</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-zinc-300">Enterprise grade security keys</span>
            </div>
          </div>
        </div>


      </div>

      {/* RIGHT SIDE: Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-zinc-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile branding */}
          <div className="flex items-center gap-2.5 md:hidden justify-center mb-8">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">FlowCore</span>
          </div>

          <div className="glass-card shadow-2xl p-8 border-zinc-800/80 bg-zinc-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />

            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
              <p className="text-xs text-zinc-400 mt-1.5">Sign in to your FlowCore dashboard to manage automations.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <Input
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                required
                icon={Mail}
              />

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-zinc-400">Password</label>
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-350 transition-colors font-medium">Forgot password?</a>
                </div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  required
                  icon={Lock}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-indigo-500/30 focus:ring-offset-zinc-950" 
                  />
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors select-none">Remember this device</span>
                </label>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full mt-2 font-semibold"
                icon={ArrowRight}
              >
                Sign in to Console
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-350 transition-colors font-semibold">
                Create an account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
