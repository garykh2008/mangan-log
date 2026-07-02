import React, { useEffect, useState } from 'react'
import { workoutService, type WorkoutLog } from '../services/db'
import { Dumbbell, Star, Trash2, Plus, Loader2, Clock, MessageSquare } from 'lucide-react'

export const WorkoutTab: React.FC = () => {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [workoutType, setWorkoutType] = useState('Weight')
  const [duration, setDuration] = useState('30')
  const [intensity, setIntensity] = useState(3)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLogs = async () => {
    try {
      setFetching(true)
      const data = await workoutService.getLogs()
      setLogs(data)
    } catch (err: any) {
      console.error(err)
      setError('無法載入運動記錄。')
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
      await workoutService.addLog({
        workout_type: workoutType,
        duration_mins: parseInt(duration),
        intensity: intensity,
        notes: notes || null,
      })

      // Reset
      setNotes('')
      setDuration('30')
      setIntensity(3)
      await loadLogs()
    } catch (err: any) {
      console.error(err)
      setError('新增記錄失敗，請重試。')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除此筆運動記錄嗎？')) return
    try {
      await workoutService.deleteLog(id)
      await loadLogs()
    } catch (err: any) {
      console.error(err)
      setError('刪除記錄失敗。')
    }
  }

  const workoutOptions = [
    { value: 'Weight', label: '重訓 Weight 💪' },
    { value: 'Cardio', label: '有氧 Cardio 🏃‍♂️' },
    { value: 'Stretch', label: '拉伸 Stretch 🧘' },
    { value: 'Walk', label: '散步 Walk 🚶' },
    { value: 'Other', label: '其他 Other ⚙️' },
  ]

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
          <Dumbbell className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">記錄健身運動</h2>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Workout Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">運動類型</label>
              <select
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                {workoutOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">時間 (分鐘)</label>
              <input
                type="number"
                required
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Intensity Star Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase block">運動強度 (1 ~ 5 星級)</label>
            <div className="flex space-x-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setIntensity(star)}
                  className="focus:outline-none transition transform active:scale-95 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= intensity
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-700 hover:text-slate-500'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold pl-0.5">
              {intensity === 1 && '🟢 輕鬆（無感/低心率）'}
              {intensity === 2 && '🔵 溫和（稍微流汗）'}
              {intensity === 3 && '🟡 中度（呼吸稍微急促）'}
              {intensity === 4 && '🟠 挑戰（心率加快/肌肉酸痛）'}
              {intensity === 5 && '🔴 極限（非常吃力/精疲力竭）'}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">運動備忘錄</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="有什麼想紀錄的？ (e.g. 胸推 50kg 5組, 慢跑配速 6:00)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-slate-600 resize-none"
            />
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
                <span>新增運動紀錄</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Card List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pl-1">運動歷史紀錄</h3>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            目前尚無運動紀錄。
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl hover:border-slate-800 transition flex flex-col space-y-3 relative"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">
                        {workoutOptions.find(opt => opt.value === log.workout_type)?.label || log.workout_type}
                      </h4>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs text-slate-400 font-semibold">
                          {log.duration_mins} 分鐘
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Intensity Stars in history */}
                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= log.intensity ? 'fill-amber-400 text-amber-400' : 'text-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-600 rounded-lg transition cursor-pointer"
                      title="刪除紀錄"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes row if exists */}
                {log.notes && (
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-start space-x-2 text-xs text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed whitespace-pre-line font-medium">
                      {log.notes}
                    </p>
                  </div>
                )}

                <span className="absolute bottom-2 right-4 text-[9px] text-slate-600 font-bold">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
