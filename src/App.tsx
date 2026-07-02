import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Auth } from './components/Auth'
import { LogOut, Activity, User, ShieldAlert } from 'lucide-react'

function AppContent() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Activity className="w-10 h-10 text-purple-500 animate-pulse" />
        <span className="text-sm text-slate-400 font-medium">載入中，請稍候...</span>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-extrabold tracking-tight text-white">Manganle</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400">
            <User className="w-3.5 h-3.5" />
            <span className="max-w-[150px] truncate">{user.email}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-lg border border-slate-800 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出</span>
          </button>
        </div>
      </header>

      {/* Main Content (Placeholder for Step 4 Dashboard) */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">您好，{user.email?.split('@')[0]}！</h2>
            <p className="text-xs text-slate-400">歡迎回到您的健康儀表板。目前您已順利連接 Supabase 客戶端並建立認證狀態層。</p>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-200">⚠️ 這是第 3 次施打，請記得預約下一次領藥！</p>
              <p className="text-slate-400 mt-1">此為測試警告元件，在接下來的 Step 4 我們將實作完整的數據記錄與警告邏輯。</p>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
            狀態層初始化成功！我們將在 Step 4 實作資料錄入與視覺化。
          </div>
        </div>
      </main>
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
