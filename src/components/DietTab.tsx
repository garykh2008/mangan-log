import React, { useEffect, useState } from 'react'
import { dietService, uploadImage, type DietLog } from '../services/db'
import { useAuth } from '../contexts/AuthContext'
import { Utensils, Camera, Trash2, Plus, Loader2, Award, Coffee, X } from 'lucide-react'

export const DietTab: React.FC = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DietLog[]>([])
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast')
  const [foodText, setFoodText] = useState('')
  const [isHighProtein, setIsHighProtein] = useState(false)
  const [hasCoffee, setHasCoffee] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLogs = async () => {
    try {
      setFetching(true)
      const data = await dietService.getLogs()
      setLogs(data)
    } catch (err: any) {
      console.error(err)
      setError('無法載入飲食記錄。')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      let uploadedUrl: string | null = null
      if (photoFile) {
        uploadedUrl = await uploadImage('diet', photoFile, user.id)
        if (!uploadedUrl) {
          throw new Error('圖片上傳失敗')
        }
      }

      await dietService.addLog({
        meal_type: mealType,
        food_text: foodText,
        photo_url: uploadedUrl,
        is_high_protein: isHighProtein,
        has_coffee: hasCoffee,
      })

      // Reset
      setFoodText('')
      setIsHighProtein(false)
      setHasCoffee(false)
      setPhotoFile(null)
      setPhotoPreview(null)
      await loadLogs()
    } catch (err: any) {
      console.error(err)
      setError(err.message || '新增記錄失敗，請重試。')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除此筆飲食記錄嗎？')) return
    try {
      await dietService.deleteLog(id)
      await loadLogs()
    } catch (err: any) {
      console.error(err)
      setError('刪除記錄失敗。')
    }
  }

  const mealTypeTranslations = {
    Breakfast: '早餐 🍳',
    Lunch: '午餐 🥗',
    Dinner: '晚餐 🍲',
    Snack: '點心/點心 🍏',
  }

  return (
    <div className="space-y-6">
      {/* Input Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
          <Utensils className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">記錄今日飲食</h2>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meal Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">餐別</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
            >
              <option value="Breakfast">早餐 Breakfast</option>
              <option value="Lunch">午餐 Lunch</option>
              <option value="Dinner">晚餐 Dinner</option>
              <option value="Snack">點心/宵夜 Snack</option>
            </select>
          </div>

          {/* Food Details */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">食物明細</label>
            <textarea
              required
              rows={3}
              value={foodText}
              onChange={(e) => setFoodText(e.target.value)}
              placeholder="您今天吃了什麼？ (e.g. 煎雞胸肉、糙米飯、燙青菜)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-slate-600 resize-none"
            />
          </div>

          {/* Checkboxes Toggle */}
          <div className="grid grid-cols-2 gap-4">
            {/* High Protein */}
            <label className="flex items-center space-x-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isHighProtein}
                onChange={(e) => setIsHighProtein(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-800 bg-slate-950 cursor-pointer"
              />
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold">補高蛋白</span>
              </div>
            </label>

            {/* Coffee */}
            <label className="flex items-center space-x-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCoffee}
                onChange={(e) => setHasCoffee(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-800 bg-slate-950 cursor-pointer"
              />
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold">喝了咖啡</span>
              </div>
            </label>
          </div>

          {/* Photo upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">食物相片</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-3 rounded-xl cursor-pointer transition text-sm font-semibold">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>選擇照片</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-800">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview(null)
                    }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>上傳並儲存中...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>新增飲食紀錄</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pl-1">飲食紀錄歷史</h3>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            目前尚無飲食紀錄。
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-3 hover:border-slate-800 transition relative overflow-hidden"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white text-sm bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded-lg">
                      {mealTypeTranslations[log.meal_type] || log.meal_type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-600 rounded-lg transition cursor-pointer"
                    title="刪除紀錄"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content body (with image if any) */}
                <div className="flex space-x-4">
                  {log.photo_url && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-800 shadow-sm">
                      <img src={log.photo_url} alt="Food" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-slate-200 leading-relaxed font-semibold">
                      {log.food_text}
                    </p>
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {log.is_high_protein && (
                        <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Award className="w-3 h-3" />
                          <span>補高蛋白</span>
                        </span>
                      )}
                      {log.has_coffee && (
                        <span className="inline-flex items-center space-x-1 text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                          <Coffee className="w-3 h-3" />
                          <span>喝咖啡</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
