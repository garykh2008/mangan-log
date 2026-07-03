import React, { useEffect, useState } from 'react'
import { biometricsService, uploadImage, type BiometricsLog } from '../services/db'
import { useAuth } from '../contexts/AuthContext'
import { Weight, Camera, Trash2, Edit2, Plus, Loader2, Image as ImageIcon, Eye, X, TrendingDown, TrendingUp, BarChart2 } from 'lucide-react'

interface BiometricsTabProps {
  autoOpen?: boolean
  onModalOpened?: () => void
}

// Custom Weight and Body Fat Chart Component using pure SVG
const WeightFatChart: React.FC<{ logs: BiometricsLog[] }> = ({ logs }) => {
  const [chartRange, setChartRange] = useState<'7logs' | '30days' | 'all'>('7logs')

  // Get filtered logs based on chosen time range
  const getFilteredLogs = () => {
    if (chartRange === '7logs') {
      return [...logs].slice(0, 7).reverse()
    }
    if (chartRange === '30days') {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return [...logs].filter(l => new Date(l.created_at) >= thirtyDaysAgo).reverse()
    }
    // 'all'
    return [...logs].reverse()
  }

  const chartLogs = getFilteredLogs()

  const ranges: { value: '7logs' | '30days' | 'all'; label: string }[] = [
    { value: '7logs', label: '最近 7 次' },
    { value: '30days', label: '最近 30 天' },
    { value: 'all', label: '全部' }
  ]

  const renderRangeButtons = () => (
    <div className="flex p-0.5 bg-slate-950/60 rounded-lg border border-slate-850/80 w-fit ml-auto">
      {ranges.map(r => (
        <button
          key={r.value}
          onClick={() => setChartRange(r.value)}
          className={`px-2.5 py-1 text-[9px] font-black rounded-md transition cursor-pointer ${
            chartRange === r.value ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )

  if (chartLogs.length < 2) {
    return (
      <div className="space-y-4">
        {/* Render Toggle buttons even if there are not enough data in the specific range */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-850">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">身體指標趨勢</span>
          {renderRangeButtons()}
        </div>
        <div className="flex flex-col items-center justify-center py-10 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-center p-4">
          <BarChart2 className="w-8 h-8 text-slate-600 mb-2" />
          <span className="text-xs text-slate-500 font-medium">此時間區間內需要至少 2 筆紀錄來產生趨勢圖</span>
        </div>
      </div>
    )
  }

  // Calculate Weight scales
  const weights = chartLogs.map(l => l.weight)
  const maxWeight = Math.max(...weights)
  const minWeight = Math.min(...weights)
  const wRange = maxWeight === minWeight ? 2 : maxWeight - minWeight
  const wMin = minWeight - wRange * 0.15
  const wMax = maxWeight + wRange * 0.15

  // Calculate Body Fat scales (only from logs that have body fat values)
  const fatLogs = chartLogs.filter(l => l.body_fat !== null)
  const fats = fatLogs.map(l => l.body_fat as number)
  const hasFatData = fats.length >= 2
  
  let fMin = 0
  let fMax = 100
  if (hasFatData) {
    const maxFat = Math.max(...fats)
    const minFat = Math.min(...fats)
    const fRange = maxFat === minFat ? 2 : maxFat - minFat
    fMin = minFat - fRange * 0.15
    fMax = maxFat + fRange * 0.15
  }

  // SVG parameters
  const width = 500
  const height = 220
  const paddingX = 45
  const paddingY = 35

  // Helper to map weight value to SVG coordinate
  const getWeightY = (w: number) => {
    return height - paddingY - ((w - wMin) / (wMax - wMin)) * (height - 2 * paddingY)
  }

  // Helper to map body fat value to SVG coordinate
  const getFatY = (f: number) => {
    return height - paddingY - ((f - fMin) / (fMax - fMin)) * (height - 2 * paddingY)
  }

  const getX = (index: number) => {
    if (chartLogs.length === 1) return width / 2
    return paddingX + (index * (width - 2 * paddingX)) / (chartLogs.length - 1)
  }

  // Generate Weight path points
  const weightPoints = chartLogs.map((log, i) => ({
    x: getX(i),
    y: getWeightY(log.weight),
    val: log.weight,
    date: new Date(log.created_at).toLocaleDateString([], { month: 'numeric', day: 'numeric' })
  }))

  const weightLineD = weightPoints.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
  )

  const weightAreaD = weightPoints.length > 0 
    ? `${weightLineD} L ${weightPoints[weightPoints.length - 1].x} ${height - paddingY} L ${weightPoints[0].x} ${height - paddingY} Z`
    : ''

  // Generate Body Fat path points (only for entries with body fat)
  const fatPoints = chartLogs
    .map((log, i) => ({
      x: getX(i),
      y: log.body_fat !== null ? getFatY(log.body_fat) : null,
      val: log.body_fat,
    }))
    .filter(p => p.y !== null) as { x: number; y: number; val: number }[]

  const fatLineD = fatPoints.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
  )

  // Smart calculations for header relative to the current selected range
  const latestWeight = chartLogs[chartLogs.length - 1].weight
  const oldestWeight = chartLogs[0].weight
  const weightDiff = latestWeight - oldestWeight

  const latestFat = fatLogs.length > 0 ? fatLogs[fatLogs.length - 1].body_fat : null
  const oldestFat = fatLogs.length > 0 ? fatLogs[0].body_fat : null
  const fatDiff = (latestFat !== null && oldestFat !== null) ? latestFat - oldestFat : null

  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
  const avgFat = fats.length > 0 ? fats.reduce((a, b) => a + b, 0) / fats.length : null

  // Adaptive label display: Hide numbers and dots when chart has > 10 data points
  const showDetails = chartLogs.length <= 10

  return (
    <div className="space-y-4">
      {/* Header View Options */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-850">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">身體指標趨勢</span>
        {renderRangeButtons()}
      </div>

      {/* Header Info Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Weight Insight */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">區間體重變化</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-black text-white">{latestWeight}</span>
              <span className="text-xs text-slate-400 font-bold">kg</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] font-bold">
            {weightDiff < 0 ? (
              <span className="text-emerald-400 flex items-center space-x-0.5">
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                <span>減重 {Math.abs(weightDiff).toFixed(1)} kg</span>
              </span>
            ) : weightDiff > 0 ? (
              <span className="text-amber-400 flex items-center space-x-0.5">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>增加 {weightDiff.toFixed(1)} kg</span>
              </span>
            ) : (
              <span className="text-slate-400">體重無起伏</span>
            )}
            <span className="text-[9px] text-slate-500 font-bold">
              (均: {avgWeight.toFixed(1)})
            </span>
          </div>
        </div>

        {/* Body Fat Insight */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">區間體脂變化</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-black text-white">
                {latestFat !== null ? `${latestFat}` : '--'}
              </span>
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] font-bold">
            {fatDiff !== null ? (
              fatDiff < 0 ? (
                <span className="text-emerald-400 flex items-center space-x-0.5">
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                  <span>體脂減少 {Math.abs(fatDiff).toFixed(1)}%</span>
                </span>
              ) : fatDiff > 0 ? (
                <span className="text-amber-400 flex items-center space-x-0.5">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>體脂增加 {fatDiff.toFixed(1)}%</span>
                </span>
              ) : (
                <span className="text-slate-400">體脂無起伏</span>
              )
            ) : (
              <span className="text-slate-500">暫無足夠紀錄</span>
            )}
            {avgFat !== null && (
              <span className="text-[9px] text-slate-500 font-bold">
                (均: {avgFat.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SVG Canvas Card */}
      <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-4 relative overflow-hidden">
        {/* Legend labels */}
        <div className="flex justify-end items-center space-x-4 text-[9px] font-extrabold pb-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-slate-300">體重 (kg)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 bg-purple-500 border border-purple-500 border-dashed rounded-full" />
            <span className="text-slate-300">體脂 (%)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[320px]">
            <defs>
              {/* Blue Gradient Area for Weight Line */}
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Line (Horizontal baseline) */}
            <line 
              x1={paddingX} 
              y1={height - paddingY} 
              x2={width - paddingX} 
              y2={height - paddingY} 
              className="stroke-slate-850 stroke-1"
            />

            {/* Weight Area Fill */}
            {weightAreaD && (
              <path d={weightAreaD} fill="url(#weightGrad)" />
            )}

            {/* Weight Line */}
            {weightLineD && (
              <path 
                d={weightLineD} 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Body Fat Line (Dashed) */}
            {hasFatData && fatLineD && (
              <path 
                d={fatLineD} 
                fill="none" 
                stroke="#d946ef" 
                strokeWidth="2" 
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 4"
              />
            )}

            {/* Dots and Labels for Weight */}
            {weightPoints.map((p, i) => {
              const isFirstOrLast = i === 0 || i === weightPoints.length - 1
              return (
                <g key={`w-dot-${i}`}>
                  {/* Draw circles & weight numbers only when showDetails is active */}
                  {showDetails && (
                    <>
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="4.5" 
                        fill="#1e293b" 
                        stroke="#3b82f6" 
                        strokeWidth="2.5" 
                      />
                      <text 
                        x={p.x} 
                        y={p.y - 12} 
                        textAnchor="middle" 
                        className="fill-blue-400 text-[10px] font-black"
                      >
                        {p.val}
                      </text>
                    </>
                  )}
                  {/* Date labels: Draw all when showDetails is true; draw only start & end when false */}
                  {(showDetails || isFirstOrLast) && (
                    <text 
                      x={p.x} 
                      y={height - 12} 
                      textAnchor="middle" 
                      className="fill-slate-500 text-[9px] font-bold"
                    >
                      {p.date}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Dots and Labels for Body Fat */}
            {hasFatData && fatPoints.map((p, i) => {
              return (
                <g key={`f-dot-${i}`}>
                  {showDetails && (
                    <>
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="4" 
                        fill="#1e293b" 
                        stroke="#d946ef" 
                        strokeWidth="2" 
                      />
                      <text 
                        x={p.x} 
                        y={p.y + 16} 
                        textAnchor="middle" 
                        className="fill-purple-400 text-[9px] font-extrabold"
                      >
                        {p.val}%
                      </text>
                    </>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}

export const BiometricsTab: React.FC<BiometricsTabProps> = ({ autoOpen, onModalOpened }) => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<BiometricsLog[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<BiometricsLog | null>(null)

  // Form states
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  
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

  useEffect(() => {
    if (autoOpen) {
      handleOpenAdd()
      onModalOpened?.()
    }
  }, [autoOpen])

  const handleOpenAdd = () => {
    setEditingLog(null)
    setWeight('')
    setBodyFat('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setError(null)
    setIsOpen(true)
  }

  const handleOpenEdit = (log: BiometricsLog) => {
    setEditingLog(log)
    setWeight(String(log.weight))
    setBodyFat(log.body_fat !== null ? String(log.body_fat) : '')
    setPhotoFile(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(log.photo_url)
    setError(null)
    setIsOpen(true)
  }

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
      let finalPhotoUrl = existingPhotoUrl

      // If user selected a new file, upload it
      if (photoFile) {
        const uploadedUrl = await uploadImage('biometrics', photoFile, user.id)
        if (!uploadedUrl) {
          throw new Error('圖片上傳失敗')
        }
        finalPhotoUrl = uploadedUrl
      }

      if (editingLog) {
        // Edit Mode
        await biometricsService.updateLog(editingLog.id, {
          weight: parseFloat(weight),
          body_fat: bodyFat ? parseFloat(bodyFat) : null,
          photo_url: finalPhotoUrl,
        })
      } else {
        // Add Mode
        await biometricsService.addLog({
          weight: parseFloat(weight),
          body_fat: bodyFat ? parseFloat(bodyFat) : null,
          photo_url: finalPhotoUrl,
        })
      }

      setIsOpen(false)
      await loadLogs()
    } catch (err: any) {
      console.error(err)
      setError(err.message || '儲存記錄失敗，請重試。')
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

  const photoLogs = logs.filter(log => log.photo_url)

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-900">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
            <Weight className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-white">身體數據管理</h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>新增數據</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Weight & Body Fat Trend Chart Card */}
      {!fetching && logs.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <WeightFatChart logs={logs} />
        </div>
      )}

      {/* Progress Photo Gallery */}
      {photoLogs.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">體態進度相簿</h3>
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">身體數據歷史紀錄</h3>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            目前尚無身體數據紀錄，請點擊上方按鈕新增。
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl hover:border-slate-850 transition"
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

                <div className="flex items-center space-x-1">
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
                    onClick={() => handleOpenEdit(log)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                    title="編輯記錄"
                  >
                    <Edit2 className="w-4 h-4 text-blue-400" />
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
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white rounded-full border border-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <Weight className="w-5 h-5 text-blue-400 animate-pulse" />
              <h2 className="text-base font-bold text-white">
                {editingLog ? '修改身體數據' : '記錄身體數據'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Weight */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">體重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Body Fat */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">體脂率 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    placeholder="選填"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">上傳進度照片</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-2 rounded-xl cursor-pointer transition text-xs font-semibold">
                    <Camera className="w-3.5 h-3.5 text-purple-400" />
                    <span>選擇照片</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  
                  {/* Photo Preview / Existing Photo */}
                  {(photoPreview || existingPhotoUrl) && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-800">
                      <img 
                        src={photoPreview || existingPhotoUrl!} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null)
                          setPhotoPreview(null)
                          setExistingPhotoUrl(null) // Allows clearing the photo
                        }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition cursor-pointer"
                        title="清除相片"
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
                className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>處理中...</span>
                  </>
                ) : (
                  <span>{editingLog ? '保存變更' : '確認新增'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-850 text-white rounded-full transition cursor-pointer"
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
