import React, { useEffect, useState } from 'react'
import { dietService, uploadImage, type DietLog } from '../services/db'
import { useAuth } from '../contexts/AuthContext'
import { Utensils, Camera, Trash2, Edit2, Plus, Loader2, Award, Coffee, X } from 'lucide-react'

export const DietTab: React.FC = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DietLog[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<DietLog | null>(null)
  
  // Sub tab in modal: 'general' | 'protein' | 'coffee'
  const [subTab, setSubTab] = useState<'general' | 'protein' | 'coffee'>('general')

  // Form states - General
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast')
  const [foodText, setFoodText] = useState('')
  const [isHighProtein, setIsHighProtein] = useState(false)
  const [hasCoffee, setHasCoffee] = useState(false)
  
  // Form states - Protein Quick Log
  const [protein, setProtein] = useState('25')
  const [proteinVolume, setProteinVolume] = useState('300')
  const [proteinFlavor, setProteinFlavor] = useState('')

  // Form states - Coffee Quick Log
  const [coffeeBean, setCoffeeBean] = useState('')
  const [coffeeVolume, setCoffeeVolume] = useState('350')

  // Common Form States
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)

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

  const handleOpenAdd = () => {
    setEditingLog(null)
    setSubTab('general')
    setMealType('Breakfast')
    setFoodText('')
    setIsHighProtein(false)
    setHasCoffee(false)
    
    // Protein reset
    setProtein('25')
    setProteinVolume('300')
    setProteinFlavor('')
    
    // Coffee reset
    setCoffeeBean('')
    setCoffeeVolume('350')
    
    setPhotoFile(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setError(null)
    setIsOpen(true)
  }

  const handleOpenEdit = (log: DietLog) => {
    setEditingLog(log)
    setError(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(log.photo_url)

    // Check if it is a formatted protein log
    if (log.is_high_protein && log.food_text.startsWith('🥤')) {
      setSubTab('protein')
      const parts = log.food_text.split('|').map(p => p.trim())
      const pMatch = parts.find(p => p.startsWith('蛋白質:'))
      const vMatch = parts.find(p => p.startsWith('容量:'))
      const fMatch = parts.find(p => p.startsWith('口味/品牌:'))

      setProtein(pMatch ? pMatch.replace('蛋白質:', '').replace('g', '').trim() : '25')
      setProteinVolume(vMatch ? vMatch.replace('容量:', '').replace('ml', '').trim() : '300')
      setProteinFlavor(fMatch ? fMatch.replace('口味/品牌:', '').trim() : '')
    } 
    // Check if it is a formatted coffee log
    else if (log.has_coffee && log.food_text.startsWith('☕')) {
      setSubTab('coffee')
      const parts = log.food_text.split('|').map(p => p.trim())
      const bMatch = parts.find(p => p.startsWith('品項:'))
      const vMatch = parts.find(p => p.startsWith('容量:'))

      setCoffeeBean(bMatch ? bMatch.replace('品項:', '').trim() : '')
      setCoffeeVolume(vMatch ? vMatch.replace('容量:', '').replace('ml', '').trim() : '350')
    } 
    // Standard meal log
    else {
      setSubTab('general')
      setMealType(log.meal_type)
      setFoodText(log.food_text)
      setIsHighProtein(log.is_high_protein)
      setHasCoffee(log.has_coffee)
    }

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

      if (photoFile) {
        const uploadedUrl = await uploadImage('diet', photoFile, user.id)
        if (!uploadedUrl) {
          throw new Error('圖片上傳失敗')
        }
        finalPhotoUrl = uploadedUrl
      }

      let finalFoodText = foodText
      let finalMealType = mealType
      let finalIsHighProtein = isHighProtein
      let finalHasCoffee = hasCoffee

      if (subTab === 'protein') {
        finalFoodText = `🥤 高蛋白補充 | 蛋白質: ${protein}g | 容量: ${proteinVolume}ml | 口味/品牌: ${proteinFlavor || '原味'}`
        finalMealType = 'Snack'
        finalIsHighProtein = true
        finalHasCoffee = false
      } else if (subTab === 'coffee') {
        finalFoodText = `☕ 咖啡時間 | 品項: ${coffeeBean || '美式咖啡'} | 容量: ${coffeeVolume}ml`
        finalMealType = 'Snack'
        finalIsHighProtein = false
        finalHasCoffee = true
      }

      if (editingLog) {
        // Edit Mode
        await dietService.updateLog(editingLog.id, {
          meal_type: finalMealType,
          food_text: finalFoodText,
          photo_url: finalPhotoUrl,
          is_high_protein: finalIsHighProtein,
          has_coffee: finalHasCoffee,
        })
      } else {
        // Add Mode
        await dietService.addLog({
          meal_type: finalMealType,
          food_text: finalFoodText,
          photo_url: finalPhotoUrl,
          is_high_protein: finalIsHighProtein,
          has_coffee: finalHasCoffee,
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
    Snack: '點心/補充 🍏',
  }

  // Helper to render customized text styling in history cards
  const renderLogContent = (log: DietLog) => {
    // Protein Log Formatting
    if (log.is_high_protein && log.food_text.startsWith('🥤')) {
      const parts = log.food_text.split('|').map(p => p.trim())
      const pMatch = parts.find(p => p.startsWith('蛋白質:'))?.replace('蛋白質:', '')
      const vMatch = parts.find(p => p.startsWith('容量:'))?.replace('容量:', '')
      const fMatch = parts.find(p => p.startsWith('口味/品牌:'))?.replace('口味/品牌:', '')
      
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
            <span>🥤 高蛋白補充</span>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-300">
              {pMatch || '25g'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
            容量：{vMatch || '300ml'} • 口味：{fMatch || '原味'}
          </p>
        </div>
      )
    }

    // Coffee Log Formatting
    if (log.has_coffee && log.food_text.startsWith('☕')) {
      const parts = log.food_text.split('|').map(p => p.trim())
      const bMatch = parts.find(p => p.startsWith('品項:'))?.replace('品項:', '')
      const vMatch = parts.find(p => p.startsWith('容量:'))?.replace('容量:', '')

      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
            <span>☕ 咖啡時間</span>
            <span className="text-xs px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-300">
              {vMatch || '350ml'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
            品項/豆子：{bMatch || '美式咖啡'}
          </p>
        </div>
      )
    }

    // Standard Food Log
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-200 leading-relaxed font-semibold">
          {log.food_text}
        </p>
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-900">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Utensils className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-white">飲食記錄管理</h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>記錄飲食</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* History Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">今日與歷次飲食</h3>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 font-medium">
            目前尚無飲食紀錄，請點擊上方按鈕記錄。
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-3 hover:border-slate-850 transition relative overflow-hidden"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white text-xs bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded-lg">
                      {mealTypeTranslations[log.meal_type as keyof typeof mealTypeTranslations] || log.meal_type}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(log)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      title="編輯紀錄"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-600 rounded-lg transition cursor-pointer"
                      title="刪除紀錄"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content body (with image if any) */}
                <div className="flex space-x-4">
                  {log.photo_url && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-800 shadow-sm">
                      <img src={log.photo_url} alt="Food" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    {renderLogContent(log)}
                  </div>
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

            {/* Sub-tabs Selection inside Modal */}
            {!editingLog ? (
              <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setSubTab('general')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${
                    subTab === 'general' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  一般飲食
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('protein')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${
                    subTab === 'protein' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  🥤 高蛋白
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('coffee')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${
                    subTab === 'coffee' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ☕ 咖啡
                </button>
              </div>
            ) : (
              <div className="text-center pb-2 border-b border-slate-850">
                <span className="text-xs font-extrabold text-slate-400">
                  {subTab === 'protein' && '🥤 編輯高蛋白紀錄'}
                  {subTab === 'coffee' && '☕ 編輯咖啡紀錄'}
                  {subTab === 'general' && '🍳 編輯一般飲食紀錄'}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* SUB TAB 1: General Diet Form */}
              {subTab === 'general' && (
                <div className="space-y-4">
                  {/* Meal Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">餐別</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="Breakfast">早餐 Breakfast</option>
                      <option value="Lunch">午餐 Lunch</option>
                      <option value="Dinner">晚餐 Dinner</option>
                      <option value="Snack">點心/宵夜 Snack</option>
                    </select>
                  </div>

                  {/* Food Details */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">食物明細</label>
                    <textarea
                      required
                      rows={3}
                      value={foodText}
                      onChange={(e) => setFoodText(e.target.value)}
                      placeholder="您今天吃了什麼？"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-slate-600 resize-none"
                    />
                  </div>

                  {/* Checkboxes Toggle */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* High Protein */}
                    <label className="flex items-center space-x-2.5 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isHighProtein}
                        onChange={(e) => setIsHighProtein(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-800 bg-slate-950 cursor-pointer"
                      />
                      <div className="flex items-center space-x-1 text-slate-300">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold">補高蛋白</span>
                      </div>
                    </label>

                    {/* Coffee */}
                    <label className="flex items-center space-x-2.5 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasCoffee}
                        onChange={(e) => setHasCoffee(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-800 bg-slate-950 cursor-pointer"
                      />
                      <div className="flex items-center space-x-1 text-slate-300">
                        <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-semibold">喝了咖啡</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* SUB TAB 2: Protein Form */}
              {subTab === 'protein' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Protein Content */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">蛋白質含量 (g)</label>
                      <input
                        type="number"
                        required
                        value={protein}
                        onChange={(e) => setProtein(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {/* Water Volume */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">沖泡水量 (ml)</label>
                      <input
                        type="number"
                        required
                        value={proteinVolume}
                        onChange={(e) => setProteinVolume(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Flavor / Brand */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">口味 / 品牌 / 備註</label>
                    <input
                      type="text"
                      value={proteinFlavor}
                      onChange={(e) => setProteinFlavor(e.target.value)}
                      placeholder="e.g. 戰神雙倍巧克力、Myprotein抹茶"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* SUB TAB 3: Coffee Form */}
              {subTab === 'coffee' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Coffee bean/type */}
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">品項 / 豆種 / 備註</label>
                      <input
                        type="text"
                        required
                        value={coffeeBean}
                        onChange={(e) => setCoffeeBean(e.target.value)}
                        placeholder="e.g. 星巴克大冰美、手沖耶加雪菲日曬"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-slate-600"
                      />
                    </div>

                    {/* Volume */}
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">飲用容量 (ml)</label>
                      <input
                        type="number"
                        required
                        value={coffeeVolume}
                        onChange={(e) => setCoffeeVolume(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Common: Photo upload (Only relevant for general diet tab or existing edits) */}
              {subTab === 'general' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">食物相片</label>
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
                            setExistingPhotoUrl(null)
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
              )}

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
