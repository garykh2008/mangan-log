import React, { useEffect, useState } from 'react'
import { medicationService, type MedicationLog } from '../services/db'
import { Calendar, Trash2, Plus, Loader2, Activity } from 'lucide-react'

export const MedicalTab: React.FC = () => {
  const [logs, setLogs] = useState<MedicationLog[]>([])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await medicationService.addLog({
        injection_date: date,
        dose: parseFloat(dose),
        cycle_number: parseInt(cycle),
      })
      // Reset form but suggest next cycle number
      const nextCycle = parseInt(cycle) < 4 ? String(parseInt(cycle) + 1) : '1'
      setCycle(nextCycle)
      await loadLogs()
    } catch (err: any) {
      console.error(err)
      setError('新增記錄失敗，請重試。')
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
      {/* Input Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
          <Activity className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">記錄針劑施打</h2>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Injection Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">注射日期</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Dose */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">劑量 (ml)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="0.25"
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Cycle Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">週期序號 (第幾週)</label>
            <select
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
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
            className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>儲存中...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>新增施打記錄</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History List Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pl-1">施打歷史紀錄</h3>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            目前尚無施打記錄，請於上方表單登錄。
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl hover:border-slate-800 transition"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-sm">第 {log.cycle_number} 週</span>
                      {log.cycle_number === 3 && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-bold border border-amber-500/20">
                          領藥提醒週
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      施打日期：{log.injection_date} • 劑量：{log.dose} ml
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-2 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 rounded-xl transition cursor-pointer"
                  title="刪除記錄"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
