import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cpu, 
  Layers, 
  Activity, 
  List, 
  Settings as SettingsIcon, 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Bell, 
  Search, 
  Sun, 
  Moon,
  ChevronDown,
  User
} from 'lucide-react'
import useAuth from './store/authStore'

// Import Redesigned Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Workflows from './pages/Workflows'
import WorkflowBuilder from './pages/WorkflowBuilder'
import Executions from './pages/Executions'
import Monitoring from './pages/Monitoring'
import Templates from './pages/Templates'
import Settings from './pages/Settings'

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const user = useAuth((s) => s.user)
  const hasLocalAuth = !!localStorage.getItem('auth')
  if (!user && !hasLocalAuth) return <Navigate to="/login" replace />
  return children
}

// Animated Page Wrapper for transitions
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}

function MainAppShell() {
  const user = useAuth((s) => s.user)
  const clearAuth = useAuth((s) => s.clear)
  const location = useLocation()
  const navigate = useNavigate()

  // Layout states
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeWorkspace, setActiveWorkspace] = useState('Production')
  const [themeDark, setThemeDark] = useState(false)
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Stripe Webhook Handler executed successfully.', time: '2m ago', read: false },
    { id: 2, text: 'Backup scheduler ran database save.', time: '1h ago', read: true },
    { id: 3, text: 'New workflow contact lead generated.', time: '2h ago', read: true }
  ])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Workflows', path: '/workflows', icon: Layers },
    { name: 'Workflow Builder', path: '/builder', icon: Cpu },
    { name: 'Executions Log', path: '/executions', icon: List },
    { name: 'System Monitor', path: '/monitor', icon: Activity },
    { name: 'Templates', path: '/templates', icon: BookOpen },
    { name: 'Settings', path: '/settings', icon: SettingsIcon }
  ]

  // Check if current path matches item path
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // Sidebar content component (reused in desktop and mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-300 select-none">
      {/* Brand Header */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-zinc-800 shrink-0">
        <div className="h-8.5 w-8.5 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Cpu className="h-4.5 w-4.5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold tracking-tight text-zinc-100 block">FlowCore</span>
            <span className="text-[9px] text-zinc-500 font-bold block figma-caption -mt-0.5">CONSOLE</span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-bold tracking-wide transition-all group relative ${active ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-905'}`}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
              
              {!collapsed && <span>{item.name}</span>}
              
              {/* Tooltip on collapsed state */}
              {collapsed && (
                <div className="absolute left-14 bg-zinc-900 text-white text-[10px] rounded px-2 py-1 border border-zinc-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-semibold z-50 whitespace-nowrap shadow-xl">
                  {item.name}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sidebar footer controls */}
      <div className="p-3 border-t border-zinc-900 space-y-1 bg-zinc-900/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center gap-3 w-full py-2 px-3 rounded-lg text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/30 transition-all text-xs font-semibold"
        >
          {collapsed ? <ChevronRight className="h-4.5 w-4.5" /> : (
            <>
              <ChevronLeft className="h-4.5 w-4.5" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>

        <button
          onClick={clearAuth}
          className="flex items-center gap-3 w-full py-2 px-3 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all text-xs font-semibold group relative"
        >
          <LogOut className="h-4.5 w-4.5 text-current" />
          {!collapsed && <span>Logout Session</span>}
          {collapsed && (
            <div className="absolute left-14 bg-zinc-905 text-white text-[10px] rounded px-2 py-1 border border-zinc-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-semibold z-50 whitespace-nowrap">
              Logout Session
            </div>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen flex transition-colors duration-250 ${themeDark ? 'bg-zinc-950 text-zinc-100 dark-theme' : 'bg-slate-50 text-slate-800 light-theme'}`}>
      {/* 1. DESKTOP SIDEBAR PANEL */}
      <aside className={`hidden md:block border-r border-zinc-800 bg-zinc-900 transition-all duration-300 z-20 shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* 2. MOBILE MENU DRAWER OVERLAY */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Sidebar Slide-in */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.25 }}
              className="relative w-64 h-full bg-zinc-900 shadow-2xl z-10"
            >
              <SidebarContent />
              {/* Close Button float */}
              <button 
                onClick={() => setMobileOpen(false)} 
                className="absolute top-4 right-4 p-1 rounded-md text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. RIGHT MAIN PANE */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Topbar Header */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0">
          
          {/* Hamburger (Mobile) / Workspace Selector (Desktop) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 transition-colors mr-1"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Workspace Switcher */}
            <div className="relative">
              <button 
                onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-bold tracking-wide transition-all select-none"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>{activeWorkspace} Workspace</span>
                <ChevronDown className="h-3 w-3 text-zinc-500" />
              </button>
              
              <AnimatePresence>
                {workspaceDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setWorkspaceDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 mt-1.5 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 text-xs"
                    >
                      {['Production', 'Staging', 'Development'].map(ws => (
                        <button
                          key={ws}
                          onClick={() => { setActiveWorkspace(ws); setWorkspaceDropdownOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 font-medium transition-colors ${activeWorkspace === ws ? 'bg-zinc-950/10 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-905'}`}
                        >
                          {ws} Workspace
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Action Icons & Profile Info */}
          <div className="flex items-center gap-3">
            {/* Search Input Bar (mock) */}
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-2.5 text-zinc-400 h-3.5 w-3.5" />
              <input
                placeholder="Search console... (⌘K)"
                className="bg-zinc-900/40 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-400 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-zinc-900/60 w-44 focus:w-56 transition-all duration-300"
              />
            </div>

            {/* Notifications Glow Bell Icon */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-250 hover:bg-zinc-900/40 transition-colors relative"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                )}
              </button>
              
              <AnimatePresence>
                {notificationsDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNotificationsDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-1.5 w-72 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-2 z-20 text-xs"
                    >
                      <div className="px-3.5 py-1.5 font-bold text-zinc-350 border-b border-zinc-850 pb-2 mb-1">
                        Notifications
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))
                            }}
                            className={`px-3.5 py-2.5 hover:bg-zinc-905 cursor-pointer transition-colors border-b border-zinc-850/50 last:border-0 ${!n.read ? 'bg-zinc-950/5 text-zinc-150 font-bold' : 'text-zinc-450'}`}
                          >
                            <div className="font-medium">{n.text}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{n.time}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle (aesthetic switch only) */}
            <button 
              onClick={() => setThemeDark(!themeDark)}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-250 hover:bg-zinc-900/40 transition-colors"
            >
              {themeDark ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>

            <div className="h-5 w-px bg-zinc-800/60" />

            {/* User Profile display */}
            <div className="relative">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-900/30 transition-all select-none"
              >
                <div className="h-7 w-7 rounded-full bg-zinc-850 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-zinc-450 hidden lg:inline max-w-[120px] truncate">{user?.email}</span>
                <ChevronDown className="h-3 w-3 text-zinc-500 hidden lg:inline" />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-1.5 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-20 text-xs"
                    >
                      <div className="px-3.5 py-2 border-b border-zinc-850 mb-1">
                        <div className="font-bold text-zinc-100 truncate">{user?.email}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 capitalize">Role: {user?.role || 'user'}</div>
                      </div>
                      
                      <button
                        onClick={() => { navigate('/settings'); setUserDropdownOpen(false); }}
                        className="w-full text-left px-3.5 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 transition-colors font-medium"
                      >
                        Account Settings
                      </button>

                      <button
                        onClick={() => { clearAuth(); setUserDropdownOpen(false); }}
                        className="w-full text-left px-3.5 py-2 text-rose-450 hover:bg-rose-500/5 transition-colors font-semibold border-t border-zinc-850 mt-1"
                      >
                        Logout Session
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Content View Container */}
        <main className={`flex-1 ${location.pathname.startsWith('/builder') ? 'p-0 overflow-hidden relative' : 'overflow-y-auto p-6 md:p-8'}`}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
            <Route path="/workflows" element={<ProtectedRoute><PageWrapper><Workflows /></PageWrapper></ProtectedRoute>} />
            <Route path="/builder" element={<ProtectedRoute><PageWrapper><WorkflowBuilder /></PageWrapper></ProtectedRoute>} />
            <Route path="/executions" element={<ProtectedRoute><PageWrapper><Executions /></PageWrapper></ProtectedRoute>} />
            <Route path="/monitor" element={<ProtectedRoute><PageWrapper><Monitoring /></PageWrapper></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><PageWrapper><Templates /></PageWrapper></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><PageWrapper><Settings /></PageWrapper></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

      </div>
    </div>
  )
}

export default function App() {
  const restore = useAuth((s) => s.restore)
  const user = useAuth((s) => s.user)

  useEffect(() => {
    restore()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes without shell */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* App Shell routing */}
        <Route path="/*" element={<ProtectedRoute><MainAppShell /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
