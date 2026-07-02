import React, { useEffect, useState } from 'react'
import { medicationService, dietService, workoutService, type MedicationLog } from '../services/db'
import { Activity, ShieldAlert, Award, Coffee, Dumbbell, Weight, Calendar, CheckCircle2, ChevronRight } from 'lucide-react'

interface DashboardProps {
  onTabChange: (tab: string) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const [latestMed, setLatestMed] = useState<MedicationLog | null>(null)
  const [todayDiet, setTodayDiet] = useState({ highProtein: false, coffee: false })
  const [todayWorkout, setTodayWorkout] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        // 1. Get latest medication log
        const meds = await medicationService.getLogs()
        if (meds.length > 0) {
          setLatestMed(meds[0])
        }

        // 2. Check today's diet and workouts
        const todayStr = new Date().toDateString()
        
        const diets = await dietService.getLogs()
        const todayDiets = diets.filter(d => new Date(d.created_at).toDateString() === todayStr)
        setTodayDiet({
          highProtein: todayDiets.some(d => d.is_high_protein),
          coffee: todayDiets.some(d => d.has_coffee),
        })

        const workouts = await workoutService.getLogs()
        const hasWorkoutToday = workouts.some(w => new Date(w.created_at).toDateString() === todayStr)
        setTodayWorkout(hasWorkoutToday)

      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Activity className="w-8 h-8 text-purple-500 animate-pulse" />
        <span className="text-sm text-slate-400">正在整理今日數據...</span>
      </div>
    )
  }

  // Determine if refill alert is active (cycle_number === 3)
  const showRefillAlert = latestMed && latestMed.cycle_number === 3

  return (
    <div className="space-y-6">
      {/* Top Banner: Medication Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">藥物注射進度</span>
            <h2 className="text-2xl font-black text-white">
              {latestMed ? `第 ${latestMed.cycle_number} / 4 週` : '尚未開始週期'}
            </h2>
            <p className="text-xs text-slate-400">
              {latestMed ? `上次注射時間：${latestMed.injection_date} (${latestMed.dose} ml)` : '點擊下方 Medical 記錄施打針劑'}
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Progress Bar */}
        {latestMed && (
          <div className="mt-5 space-y-2">
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800/80">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${(latestMed.cycle_number / 4) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-bold">
              <span>WEEK 1</span>
              <span>WEEK 2</span>
              <span>WEEK 3</span>
              <span>WEEK 4</span>
            </div>
          </div>
        )}
      </div>

      {/* Prominent Refill Alert */}
      {showRefillAlert && (
        <div className="bg-amber-500/10 border-2 border-amber-500/20 text-amber-300 rounded-3xl p-5 shadow-lg shadow-amber-500/5 animate-pulse">
          <div className="flex space-x-3.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-amber-200 text-base">領藥預約提醒</h4>
              <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                ⚠️ 這是第 3 次施打，請記得預約下一次領藥！
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 pl-1">今日健康查檢表</h3>
        
        <div className="space-y-3">
          {/* High Protein */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${todayDiet.highProtein ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                <Award className="w-5 h-5" />
              </div>
              <span className={`text-sm font-semibold ${todayDiet.highProtein ? 'text-slate-200' : 'text-slate-500'}`}>
                補充足量高蛋白
              </span>
            </div>
            {todayDiet.highProtein ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <button 
                onClick={() => onTabChange('diet')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded-lg font-bold transition cursor-pointer"
              >
                去記錄
              </button>
            )}
          </div>

          {/* Coffee */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${todayDiet.coffee ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                <Coffee className="w-5 h-5" />
              </div>
              <span className={`text-sm font-semibold ${todayDiet.coffee ? 'text-slate-200' : 'text-slate-500'}`}>
                今日咖啡時光
              </span>
            </div>
            {todayDiet.coffee ? (
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
            ) : (
              <button 
                onClick={() => onTabChange('diet')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded-lg font-bold transition cursor-pointer"
              >
                去記錄
              </button>
            )}
          </div>

          {/* Workout */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${todayWorkout ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                <Dumbbell className="w-5 h-5" />
              </div>
              <span className={`text-sm font-semibold ${todayWorkout ? 'text-slate-200' : 'text-slate-500'}`}>
                今日健身運動
              </span>
            </div>
            {todayWorkout ? (
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            ) : (
              <button 
                onClick={() => onTabChange('workout')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded-lg font-bold transition cursor-pointer"
              >
                去記錄
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onTabChange('biometrics')}
          className="flex flex-col items-start p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl text-left transition duration-200 shadow-lg cursor-pointer group"
        >
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform animate-none">
            <Weight className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-base flex items-center w-full justify-between">
            記錄身體數據
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
          </span>
          <span className="text-xs text-slate-400 mt-1">體重、體脂與照片</span>
        </button>

        <button
          onClick={() => onTabChange('medical')}
          className="flex flex-col items-start p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl text-left transition duration-200 shadow-lg cursor-pointer group"
        >
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl mb-4 group-hover:scale-110 transition-transform animate-none">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-base flex items-center w-full justify-between">
            記錄針劑施打
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
          </span>
          <span className="text-xs text-slate-400 mt-1">管理四週注射週期</span>
        </button>
      </div>
    </div>
  )
}
