import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  HardDrive,
  BarChart2,
  RefreshCw,
  Menu,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getSyncStatus, triggerSync } from '../api/gdrive'
import { formatDistanceToNow } from 'date-fns'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vacancies', label: 'Vacancies', icon: Briefcase },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/gdrive-config', label: 'Google Drive', icon: HardDrive },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
]

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: syncData } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => getSyncStatus().then((r) => r.data),
    refetchInterval: 60_000,
  })

  const syncMutation = useMutation({
    mutationFn: () => triggerSync().then((r) => r.data),
    onSuccess: () => {
      toast.success('Sync completed successfully!')
      queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: () => {
      toast.error('Sync failed. Check Google Drive configuration.')
    },
  })

  const lastSyncText = syncData?.last_sync
    ? formatDistanceToNow(new Date(syncData.last_sync), { addSuffix: true })
    : 'Never'

  const hasErrors = (syncData?.errors_count ?? 0) > 0

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 px-6 py-5 border-b border-primary-800/40"
      >
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow">
          <Sparkles size={18} className="text-primary-600" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">
          Hire<span className="text-primary-300">Genius</span>
        </span>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-primary-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sync Status Footer */}
      <div className="mx-3 mb-4 p-3 rounded-lg bg-white/10 border border-white/10">
        <div className="flex items-center gap-2 mb-1">
          {hasErrors ? (
            <AlertCircle size={14} className="text-yellow-300 shrink-0" />
          ) : (
            <CheckCircle size={14} className="text-green-300 shrink-0" />
          )}
          <span className="text-xs text-primary-200 font-medium">
            Last sync
          </span>
        </div>
        <p className="text-xs text-white font-medium">{lastSyncText}</p>
        {syncData && (
          <p className="text-xs text-primary-300 mt-0.5">
            {syncData.files_processed} files &middot;{' '}
            {hasErrors ? (
              <span className="text-yellow-300">{syncData.errors_count} errors</span>
            ) : (
              'no errors'
            )}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar – desktop (always visible) */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-primary-900 z-20">
        <SidebarContent />
      </aside>

      {/* Sidebar – mobile (drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary-900 transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-primary-300 hover:text-white"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="btn-primary text-xs py-1.5"
              title="Sync Google Drive now"
            >
              <RefreshCw
                size={14}
                className={syncMutation.isPending ? 'animate-spin' : ''}
              />
              {syncMutation.isPending ? 'Syncing…' : 'Sync Now'}
            </button>

            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold">
              HR
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
