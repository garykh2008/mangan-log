import React, { useEffect, useState } from 'react'
import { medicationService, type MedicationLog } from '../services/db'
import { Calendar, Trash2, Edit2, Plus, Loader2, Activity, X } from 'lucide-react'

export const MedicalTab: React.FC = () => {
  const [logs, setLogs] = useState<MedicationLog[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<MedicationLog | null>(null)

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dose, setDose] = useState('0.25')
  const [cycle, setCycle] = useState('1')
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLogs = async () => {
    try {
      setFetching(true)
      const data = await medicationService.getLogs()
      setLogs(data)
    } catch (err: any) {
      console.error(err)
      setError('無法載入針劑記錄。')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  // Listen to popstate event to dismiss modal when mobile back button is swiped
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen])

  const handleOpenAdd = () => {
    setEditingLog(null)
    setDate(new Date().toISOString().split('T')[0])
    setDose('0.25')
    setCycle('1')
    setError(null)
    
    // Push virtual history state for back navigation
    window.history.pushState({ modal: 'medical-form' }, '')
    setIsOpen(true)
  }

  const handleOpenEdit = (log: MedicationLog) => {
    setEditingLog(log)
    setDate(log.injection_date)
    setDose(String(log.dose))
    setCycle(String(log.cycle_number))
    setError(null)
    
    // Push virtual history state for back navigation
    window.history.pushState({ modal: 'medical-form' }, '')
    setIsOpen(true)
  }

  const handleCloseForm = () => {
    setIsOpen(false)
    if (window.history.state?.modal === 'medical-form') {
      window.history.back()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editingLog) {
        // Edit Mode
        await medicationService.updateLog(editingLog.id, {
          injection_date: date,
          dose: parseFloat(dose),
          cycle_number: parseInt(cycle),
        })
      } else {
        // Add Mode
        await medicationService.addLog({
          injection_date: date,
          dose: parseFloat(dose),
          cycle_number: parseInt(cycle),
        })
      }
      handleCloseForm()
      await loadLogs()
    } catch (err: any) {
      console.error(err)
      setError(editingLog ? '修改記錄失敗，請重試。' : '新增記錄失敗，請重試。')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除此筆施打記錄嗎？')) return
    try {
      await medicationService.deleteLog(id)
      await loadLogs()
    } catch (err: any) {
      console.error(err)
      setError('刪除記錄失敗。')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-900">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-white">針劑施打管理</h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>新增紀錄</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* History List Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">歷次施打紀錄</h3>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            目前尚無施打記錄，請點擊上方按鈕新增。
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl hover:border-slate-850 transition"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="font-extrabold text-white text-sm">第 {log.cycle_number} 週</span>
                      {log.cycle_number === 3 && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-bold border border-amber-500/20">
                          領藥提醒週
                        </span>
                      )}
                      {log.is_pending && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-bold border border-amber-500/20 animate-pulse">
                          🔄 待同步
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      施打日期：{log.injection_date} • 劑量：{log.dose} ml
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(log)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition cursor-pointer"
                    title="編輯記錄"
                  >
                    <Edit2 className="w-4 h-4 text-purple-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-2 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 rounded-xl transition cursor-pointer"
                    title="刪除記錄"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative animate-scaleUp">
            <button
              onClick={handleCloseForm}
              className="absolute top-4 right-4 p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white rounded-full border border-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <Activity className="w-5 h-5 text-purple-400 animate-pulse" />
              <h2 className="text-base font-bold text-white">
                {editingLog ? '修改施打紀錄' : '記錄針劑施打'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Injection Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">注射日期</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Dose */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">劑量 (ml)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder="0.25"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Cycle Number */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">週期序號 (第幾週)</label>
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="1">第 1 週 (Cycle 1)</option>
                  <option value="2">第 2 週 (Cycle 2)</option>
                  <option value="3">第 3 週 (Cycle 3) ⚠️ 提示預約領藥</option>
                  <option value="4">第 4 週 (Cycle 4)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>儲存中...</span>
                  </>
                ) : (
                  <span>{editingLog ? '保存變更' : '確認新增'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
