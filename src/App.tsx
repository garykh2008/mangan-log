import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Auth } from './components/Auth'
import { Dashboard } from './components/Dashboard'
import { MedicalTab } from './components/MedicalTab'
import { BiometricsTab } from './components/BiometricsTab'
import { DietTab } from './components/DietTab'
import { WorkoutTab } from './components/WorkoutTab'
import { syncService } from './services/db'
import { LogOut, Activity, User, LayoutDashboard, HeartPulse, Weight, Utensils, Dumbbell, AlertTriangle, RefreshCw } from 'lucide-react'

function AppContent() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [openModalTab, setOpenModalTab] = useState<string | null>(null)

  // Offline / Sync Status states
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const handleTabChange = (tab: string, triggerModal = false) => {
    const mainTab = tab.split('-')[0]
    setActiveTab(mainTab)
    if (triggerModal) {
      setOpenModalTab(tab)
    } else {
      setOpenModalTab(null)
    }
  }

  const handleModalOpened = () => {
    setOpenModalTab(null)
  }

  // Monitor network status & sync pending data
  useEffect(() => {
    const updatePendingCount = () => {
      setPendingCount(syncService.getPendingCount())
    }

    // Interval to check for pending count changes
    const timer = setInterval(updatePendingCount, 2000)

    const handleOnline = async () => {
      setIsOnline(true)
      const count = syncService.getPendingCount()
      if (count > 0) {
        try {
          setIsSyncing(true)
          await syncService.syncPendingLogs()
          // Refresh page after sync is done to reload all components
          window.location.reload()
        } catch (err) {
          console.error('Failed to sync offline logs:', err)
        } finally {
          setIsSyncing(false)
        }
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check on load
    updatePendingCount()
    if (navigator.onLine && syncService.getPendingCount() > 0) {
      handleOnline()
    }

    return () => {
      clearInterval(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center space-y-4">
        <Activity className="w-10 h-10 text-brand-primary animate-pulse" />
        <span className="text-sm text-slate-400 font-medium">載入中，請稍候...</span>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-bg-app text-slate-100 flex flex-col pb-24">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bg-app/80 border-b border-slate-900/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-brand-primary/10 text-brand-secondary rounded-lg">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-black tracking-tight text-white text-lg">Manganle</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 bg-bg-card px-3 py-1.5 rounded-lg border border-slate-850">
            <User className="w-3.5 h-3.5 text-brand-secondary" />
            <span className="max-w-[150px] truncate font-semibold">{user.email}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-bg-card hover:bg-bg-card/85 text-xs font-bold text-rose-400 hover:text-rose-300 rounded-lg border border-slate-850 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出</span>
          </button>
        </div>
      </header>

      {/* Offline / Sync Banner Bar */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center text-xs text-amber-300 font-bold flex items-center justify-center space-x-1.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <span>⚠️ 離線模式：您所記錄的數據將暫存於手機本地。</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-500/20 rounded-full text-[10px]">
              {pendingCount} 筆待同步
            </span>
          )}
        </div>
      )}
      {isOnline && isSyncing && (
        <div className="bg-brand-primary/10 border-b border-brand-primary/20 px-4 py-2.5 text-center text-xs text-brand-secondary font-bold flex items-center justify-center space-x-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-brand-secondary animate-spin shrink-0" />
          <span>🔄 網路已恢復，正在背景自動同步離線數據中...</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard onTabChange={handleTabChange} />}
        {activeTab === 'medical' && <MedicalTab />}
        {activeTab === 'biometrics' && (
          <BiometricsTab 
            autoOpen={openModalTab === 'biometrics'} 
            onModalOpened={handleModalOpened} 
          />
        )}
        {activeTab === 'diet' && (
          <DietTab 
            autoOpen={openModalTab} 
            onModalOpened={handleModalOpened} 
          />
        )}
        {activeTab === 'workout' && (
          <WorkoutTab 
            autoOpen={openModalTab === 'workout'} 
            onModalOpened={handleModalOpened} 
          />
        )}
      </main>

      {/* Responsive Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-card/90 backdrop-blur-md border-t border-slate-800 py-2 shadow-2xl flex justify-around">
        <div className="max-w-md w-full flex justify-around px-2">
          {/* Dashboard Tab */}
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'dashboard' ? 'text-brand-secondary font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] tracking-tight">儀表板</span>
          </button>

          {/* Medical Tab */}
          <button
            onClick={() => handleTabChange('medical')}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'medical' ? 'text-brand-secondary font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <HeartPulse className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] tracking-tight">醫療</span>
          </button>

          {/* Biometrics Tab */}
          <button
            onClick={() => handleTabChange('biometrics')}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'biometrics' ? 'text-brand-secondary font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Weight className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] tracking-tight">數據</span>
          </button>

          {/* Diet Tab */}
          <button
            onClick={() => handleTabChange('diet')}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'diet' ? 'text-brand-secondary font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Utensils className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] tracking-tight">飲食</span>
          </button>

          {/* Workout Tab */}
          <button
            onClick={() => handleTabChange('workout')}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'workout' ? 'text-brand-secondary font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Dumbbell className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] tracking-tight">運動</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
