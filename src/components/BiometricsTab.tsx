import React, { useEffect, useState } from 'react'
import { biometricsService, uploadImage, type BiometricsLog } from '../services/db'
import { useAuth } from '../contexts/AuthContext'
import { Weight, Camera, Trash2, Plus, Loader2, Image as ImageIcon, Eye, X } from 'lucide-react'

export const BiometricsTab: React.FC = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<BiometricsLog[]>([])
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Lightbox active photo
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  const loadLogs = async () => {
    try {
      setFetching(true)
      const data = await biometricsService.getLogs()
      setLogs(data)
    } catch (err: any) {
      console.error(err)
      setError('無法載入身體指標記錄。')
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
        uploadedUrl = await uploadImage('biometrics', photoFile, user.id)
        if (!uploadedUrl) {
          throw new Error('圖片上傳失敗')
        }
      }

      await biometricsService.addLog({
        weight: parseFloat(weight),
        body_fat: bodyFat ? parseFloat(bodyFat) : null,
        photo_url: uploadedUrl,
      })

      // Reset
      setWeight('')
      setBodyFat('')
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
    if (!window.confirm('確定要刪除此筆身體數據嗎？')) return
    try {
      await biometricsService.deleteLog(id)
      await loadLogs()
    } catch (err: any) {
      console.error(err)
      setError('刪除記錄失敗。')
    }
  }

  // Filter logs that have photos for gallery
  const photoLogs = logs.filter(log => log.photo_url)

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
          <Weight className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">記錄身體數據</h2>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Weight */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">體重 (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Body Fat */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">體脂率 (%)</label>
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="選填"
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">上傳進度照片</label>
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
                <span>新增身體指標</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Progress Photo Gallery */}
      {photoLogs.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pl-1">體態進度相簿</h3>
          <div className="grid grid-cols-3 gap-3">
            {photoLogs.map((log) => (
              <div 
                key={log.id} 
                className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 group cursor-pointer shadow"
                onClick={() => setActivePhoto(log.photo_url)}
              >
                <img src={log.photo_url!} alt="Progress" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white p-2 text-center">
                  <Eye className="w-5 h-5 mb-1 text-purple-400" />
                  <span className="text-[10px] font-bold">{new Date(log.created_at).toLocaleDateString()}</span>
                  <span className="text-[10px] font-bold text-slate-300">{log.weight} kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Table/List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pl-1">身體指標歷史紀錄</h3>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            目前尚無身體指標紀錄。
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl hover:border-slate-800 transition"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl shrink-0">
                    <Weight className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-sm">{log.weight} kg</span>
                      {log.body_fat !== null && (
                        <span className="text-xs text-slate-300 font-semibold">
                          體脂: {log.body_fat}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      紀錄日期：{new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {log.photo_url && (
                    <button
                      onClick={() => setActivePhoto(log.photo_url)}
                      className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                      title="查看照片"
                    >
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                    </button>
                  )}
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

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-800 text-white rounded-full transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activePhoto}
            alt="Body progress detail"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
