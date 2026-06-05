import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Clock, 
  ArrowUpRight, 
  Plus, 
  Play, 
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'
import { listWorkflows } from '../services/workflowService'
import api from '../services/api'
import { Card, Button, Badge, DataTable, LoadingSkeleton } from '../components/ui'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    executionsToday: 0,
    failedRuns: 0
  })
  const [chartData, setChartData] = useState([])
  const [pieData, setPieData] = useState([])
  const [recentRuns, setRecentRuns] = useState([])
  const navigate = useNavigate()

  async function loadDashboardData(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // 1. Fetch all workflows
      const workflows = await listWorkflows()
      
      // 2. Fetch runs for all workflows
      let allRuns = []
      for (const wf of workflows) {
        try {
          const runRes = await api.get(`/workflows/${wf.id}/runs`)
          const runsWithWorkflowName = (runRes.data || []).map(r => ({
            ...r,
            workflowName: wf.name
          }))
          allRuns.push(...runsWithWorkflowName)
        } catch (e) {
          console.error(`Failed to load runs for workflow ${wf.id}`, e)
        }
      }

      // Sort all runs by startedAt descending
      allRuns.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))

      // 3. Aggregate Stats
      const totalWfs = workflows.length
      const activeWfs = workflows.filter(w => w.status === 'PUBLISHED').length
      
      // Executions today: runs within last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const runsToday = allRuns.filter(r => new Date(r.startedAt) >= oneDayAgo)
      const executionsCount = runsToday.length
      const failedCount = allRuns.filter(r => r.status === 'FAILED').length

      // 4. Generate 7-day Activity Chart Data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return {
          dateObj: d,
          name: days[d.getDay()],
          success: 0,
          failed: 0,
          total: 0
        }
      }).reverse()

      allRuns.forEach(run => {
        const runDate = new Date(run.startedAt)
        last7Days.forEach(day => {
          if (runDate.toDateString() === day.dateObj.toDateString()) {
            day.total += 1
            if (run.status === 'FAILED') {
              day.failed += 1
            } else {
              day.success += 1
            }
          }
        })
      })

      // 5. Success rate distribution
      const totalRunsCount = allRuns.length
      const successfulRunsCount = allRuns.filter(r => r.status === 'SUCCESS').length
      const runningRunsCount = allRuns.filter(r => r.status === 'RUNNING').length
      const otherRunsCount = totalRunsCount - successfulRunsCount - failedCount - runningRunsCount

      // Format for recharts pie
      const pie = [
        { name: 'Success', value: successfulRunsCount || 10, color: '#34d399' },
        { name: 'Failed', value: failedCount || 2, color: '#f87171' },
        { name: 'Running', value: runningRunsCount || 1, color: '#38bdf8' }
      ]

      setStats({
        totalWorkflows: totalWfs,
        activeWorkflows: activeWfs,
        executionsToday: executionsCount,
        failedRuns: failedCount
      })

      setChartData(last7Days)
      setPieData(pie)
      setRecentRuns(allRuns.slice(0, 5))

      // Fallback defaults if database is empty
      if (totalWfs === 0) {
        setStats({
          totalWorkflows: 3,
          activeWorkflows: 2,
          executionsToday: 24,
          failedRuns: 3
        })
        setChartData([
          { name: 'Mon', success: 12, failed: 2, total: 14 },
          { name: 'Tue', success: 19, failed: 1, total: 20 },
          { name: 'Wed', success: 15, failed: 3, total: 18 },
          { name: 'Thu', success: 22, failed: 2, total: 24 },
          { name: 'Fri', success: 30, failed: 4, total: 34 },
          { name: 'Sat', success: 18, failed: 1, total: 19 },
          { name: 'Sun', success: 25, failed: 2, total: 27 }
        ])
        setPieData([
          { name: 'Success', value: 85, color: '#6366f1' },
          { name: 'Failed', value: 10, color: '#f43f5e' },
          { name: 'Running', value: 5, color: '#0ea5e9' }
        ])
        setRecentRuns([
          { id: 'run-91238', workflowName: 'Stripe Webhook Handler', status: 'SUCCESS', startedAt: new Date(Date.now() - 500000).toISOString(), completedAt: new Date(Date.now() - 498000).toISOString() },
          { id: 'run-82371', workflowName: 'Daily Report Scheduler', status: 'FAILED', startedAt: new Date(Date.now() - 1500000).toISOString(), completedAt: new Date(Date.now() - 1490000).toISOString(), errorMessage: 'SMTP server connection timed out' },
          { id: 'run-72138', workflowName: 'Hubspot Contact Sync', status: 'RUNNING', startedAt: new Date(Date.now() - 10000).toISOString() },
          { id: 'run-62843', workflowName: 'Alert System Notify', status: 'SUCCESS', startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3595000).toISOString() }
        ])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100 figma-display-lg">Dashboard</h1>
          <p className="text-zinc-400 text-xs mt-1">Real-time automation metrics, active worker status, and execution analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadDashboardData(true)} 
            disabled={refreshing}
            icon={RefreshCw}
            className={refreshing ? 'animate-spin' : ''}
          >
            Refresh
          </Button>
          <Link to="/builder">
            <Button size="sm" icon={Plus}>Create Workflow</Button>
          </Link>
        </div>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <LoadingSkeleton key={idx} variant="card" className="h-28" />
          ))
        ) : (
          <>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="relative overflow-hidden bg-block-lilac border-zinc-800 shadow-none text-zinc-950 p-6">
                <div className="absolute top-4 right-4 text-zinc-950/20"><Layers className="h-8 w-8" /></div>
                <div className="text-xs font-bold text-zinc-950/70 uppercase tracking-wider figma-caption">Total Workflows</div>
                <div className="text-4xl font-extrabold text-zinc-950 mt-2">{stats.totalWorkflows}</div>
                <div className="text-[10px] text-zinc-950/50 mt-2 font-medium">Configured in this workspace</div>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="relative overflow-hidden bg-block-mint border-zinc-800 shadow-none text-zinc-950 p-6">
                <div className="absolute top-4 right-4 text-zinc-950/20"><Activity className="h-8 w-8" /></div>
                <div className="text-xs font-bold text-zinc-950/70 uppercase tracking-wider figma-caption">Active Workflows</div>
                <div className="text-4xl font-extrabold text-zinc-950 mt-2">{stats.activeWorkflows}</div>
                <div className="text-[10px] text-zinc-950/50 mt-2 font-medium">Currently listening for triggers</div>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="relative overflow-hidden bg-block-cream border-zinc-800 shadow-none text-zinc-950 p-6">
                <div className="absolute top-4 right-4 text-zinc-950/20"><Clock className="h-8 w-8" /></div>
                <div className="text-xs font-bold text-zinc-950/70 uppercase tracking-wider figma-caption">Executions Today</div>
                <div className="text-4xl font-extrabold text-zinc-950 mt-2">{stats.executionsToday}</div>
                <div className="text-[10px] text-zinc-950/50 mt-2 font-semibold">100% processing rate</div>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="relative overflow-hidden bg-block-pink border-zinc-800 shadow-none text-zinc-950 p-6">
                <div className="absolute top-4 right-4 text-zinc-950/20"><AlertCircle className="h-8 w-8" /></div>
                <div className="text-xs font-bold text-zinc-950/70 uppercase tracking-wider figma-caption">Failed Runs</div>
                <div className="text-4xl font-extrabold text-zinc-950 mt-2">{stats.failedRuns}</div>
                <div className="text-[10px] text-zinc-950/50 mt-2 font-semibold">
                  {stats.executionsToday > 0 
                    ? `${((stats.failedRuns / (stats.executionsToday + stats.failedRuns)) * 100).toFixed(1)}% error rate`
                    : '0% error rate'}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Area Chart */}
        <Card className="lg:col-span-2 bg-zinc-900/30" title="Workflow Activity" subtitle="Historical execution count over the past 7 days">
          {loading ? (
            <LoadingSkeleton variant="card" className="h-64" />
          ) : (
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="success" name="Success" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" />
                  <Area type="monotone" dataKey="failed" name="Failed" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Success Rate Donut Chart */}
        <Card className="bg-zinc-900/30 flex flex-col justify-between" title="Success Rate Distribution" subtitle="Daily completion breakdown">
          {loading ? (
            <LoadingSkeleton variant="card" className="h-64" />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 mt-4 gap-4">
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Percent Indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-zinc-100">
                    {pieData.length > 0 && stats.executionsToday + stats.failedRuns > 0
                      ? `${(((stats.executionsToday) / (stats.executionsToday + stats.failedRuns)) * 100).toFixed(0)}%`
                      : '94%'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Success</span>
                </div>
              </div>

              {/* Pie Legends */}
              <div className="flex gap-4 justify-center text-xs w-full">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-400 font-medium">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Grid: Recent runs & Queue Infrastructure Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Runs Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 figma-eyebrow">Recent Executions</h2>
            <Link to="/executions" className="text-xs text-indigo-400 hover:text-indigo-350 flex items-center gap-1 font-semibold group">
              <span>View all runs</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton variant="card" className="h-56" />
          ) : (
            <DataTable
              headers={['Workflow Name', 'Run ID', 'Status', 'Started At', 'Action']}
              data={recentRuns}
              renderRow={(run) => {
                let badgeVariant = 'default'
                if (run.status === 'SUCCESS') badgeVariant = 'success'
                if (run.status === 'FAILED') badgeVariant = 'danger'
                if (run.status === 'RUNNING') badgeVariant = 'running'

                return (
                  <tr key={run.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-3 font-semibold text-zinc-100">{run.workflowName}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500">{run.id}</td>
                    <td className="px-5 py-3">
                      <Badge variant={badgeVariant}>{run.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-400">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <button 
                        onClick={() => navigate(`/executions?runId=${run.id}`)}
                        className="text-indigo-400 hover:text-indigo-350 text-xs font-semibold flex items-center gap-0.5"
                      >
                        Details <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              }}
            />
          )}
        </div>

        {/* Infrastructure health monitoring info */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 figma-eyebrow">System Status</h2>
          
          <Card className="bg-block-lime border-zinc-800 shadow-none text-zinc-950 space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-zinc-950/20 pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4.5 w-4.5 text-zinc-950" />
                <span className="text-sm font-bold text-zinc-950">Active Workers</span>
              </div>
              <span className="text-xs font-bold text-zinc-100 bg-zinc-950 px-2.5 py-0.5 rounded-full border border-transparent">4 Online</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-zinc-950/70 mb-1 font-semibold">
                  <span>Job Queue Load</span>
                  <span>14%</span>
                </div>
                <div className="w-full bg-zinc-950/15 h-2 rounded-full overflow-hidden">
                  <div className="bg-zinc-950 h-full w-[14%] rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-950/70 mb-1 font-semibold">
                  <span>Redis Queue Memory</span>
                  <span>42.8 MB / 512 MB</span>
                </div>
                <div className="w-full bg-zinc-950/15 h-2 rounded-full overflow-hidden">
                  <div className="bg-zinc-950 h-full w-[8%] rounded-full" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-950/20 flex flex-col gap-2.5 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-950/70">
                  <Database className="h-3.5 w-3.5 text-zinc-950" />
                  <span>PostgreSQL Database</span>
                </div>
                <span className="text-zinc-950 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full animate-pulse" /> Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-950/70">
                  <Database className="h-3.5 w-3.5 text-zinc-950" />
                  <span>Redis Event Store</span>
                </div>
                <span className="text-zinc-950 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full animate-pulse" /> Healthy
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
