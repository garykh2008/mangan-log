import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Mail, Lock, Activity, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage({
          type: 'success',
          text: '註冊成功！請檢查您的電子信箱以驗證帳號（若已在 Supabase 關閉信箱驗證，可以直接嘗試登入）。',
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (err: any) {
      console.error('Auth error detailed:', err)
      let errorText = '發生錯誤，請稍後再試。'
      if (err instanceof Error) {
        errorText = err.message
      } else if (typeof err === 'object' && err !== null) {
        errorText = err.message || err.error_description || JSON.stringify(err)
      } else if (typeof err === 'string') {
        errorText = err
      }
      setMessage({
        type: 'error',
        text: errorText,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full backdrop-blur-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="p-3.5 bg-gradient-to-tr from-purple-500 to-indigo-500 text-white rounded-2xl shadow-lg shadow-purple-500/20">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Manganle
          </h1>
          <p className="text-sm text-slate-400">專屬於您的健康追蹤助手</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false)
              setMessage(null)
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition duration-200 cursor-pointer ${
              !isSignUp ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            登入帳號
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true)
              setMessage(null)
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition duration-200 cursor-pointer ${
              isSignUp ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            註冊新帳號
          </button>
        </div>

        {/* Status Messages */}
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block pl-1">
              電子信箱 (Email)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 rounded-xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 transition duration-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block pl-1">
              密碼 (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 rounded-xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500 transition duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>處理中...</span>
              </>
            ) : (
              <span>{isSignUp ? '立即註冊' : '登入系統'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
