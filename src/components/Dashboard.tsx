import React, { useEffect, useState } from 'react'
import { medicationService, dietService, workoutService, biometricsService, type MedicationLog, type DietLog, type WorkoutLog, type BiometricsLog } from '../services/db'
import { Activity, ShieldAlert, Award, Coffee, Dumbbell, Weight, Calendar, CheckCircle2 } from 'lucide-react'

interface DashboardProps {
  onTabChange: (tab: string, triggerModal?: boolean) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const [latestMed, setLatestMed] = useState<MedicationLog | null>(null)
  const [todayDiet, setTodayDiet] = useState({ highProtein: false, coffee: false })
  const [todayWorkout, setTodayWorkout] = useState(false)
  
  // Today's specific data
  const [todayWeightLog, setTodayWeightLog] = useState<BiometricsLog | null>(null)
  const [todayMeals, setTodayMeals] = useState<DietLog[]>([])
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutLog[]>([])
  
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

        const todayStr = new Date().toDateString()

        // 2. Load today's biometrics
        const biometrics = await biometricsService.getLogs()
        const tWeight = biometrics.find(b => new Date(b.created_at).toDateString() === todayStr)
        setTodayWeightLog(tWeight || null)

        // 3. Load today's diet
        const diets = await dietService.getLogs()
        const tDiets = diets.filter(d => new Date(d.created_at).toDateString() === todayStr)
        setTodayMeals(tDiets)
        setTodayDiet({
          highProtein: tDiets.some(d => d.is_high_protein),
          coffee: tDiets.some(d => d.has_coffee),
        })

        // 4. Load today's workouts
        const workouts = await workoutService.getLogs()
        const tWorkouts = workouts.filter(w => new Date(w.created_at).toDateString() === todayStr)
        setTodayWorkouts(tWorkouts)
        setTodayWorkout(tWorkouts.length > 0)

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
        <Activity className="w-8 h-8 text-brand-primary animate-pulse" />
        <span className="text-sm text-slate-400">正在整理今日數據...</span>
      </div>
    )
  }

  const showRefillAlert = latestMed && latestMed.cycle_number === 3

  // Helper to parse food text (if it's formatted whey/coffee)
  const formatMealText = (log: DietLog) => {
    if (log.is_high_protein && log.food_text.startsWith('🥤')) {
      return log.food_text.split('|').slice(1).join(' | ').trim()
    }
    if (log.has_coffee && log.food_text.startsWith('☕')) {
      return log.food_text.split('|').slice(1).join(' | ').trim()
    }
    return log.food_text
  }

  const mealTypeTranslations = {
    Breakfast: '早餐 🍳',
    Lunch: '午餐 🥗',
    Dinner: '晚餐 🍲',
    Snack: '點心/補充 🍏',
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Medication Progress */}
      <div className="bg-bg-card border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary">藥物注射進度</span>
            <h2 className="text-2xl font-black text-white">
              {latestMed ? `第 ${latestMed.cycle_number} / 4 週` : '尚未開始週期'}
            </h2>
            <p className="text-xs text-slate-400">
              {latestMed ? `上次注射時間：${latestMed.injection_date} (${latestMed.dose} ml)` : '點擊底欄醫療紀錄施打'}
            </p>
          </div>
          <div className="p-3 bg-brand-primary/10 text-brand-secondary rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Progress Bar */}
        {latestMed && (
          <div className="mt-5 space-y-2">
            <div className="w-full bg-bg-app rounded-full h-2.5 overflow-hidden border border-slate-800/80">
              <div 
                className="bg-gradient-to-r from-brand-primary to-brand-secondary h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${(latestMed.cycle_number / 4) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-bold">
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
      <div className="bg-bg-card border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">今日健康查檢表</h3>
        
        <div className="space-y-3">
          {/* High Protein */}
          <div className="flex items-center justify-between p-3.5 bg-bg-app/40 rounded-2xl border border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${todayDiet.highProtein ? 'bg-emerald-500/10 text-emerald-400' : 'bg-bg-card text-slate-550 border border-slate-800'}`}>
                <Award className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-200">
                補充足量高蛋白
              </span>
            </div>
            {todayDiet.highProtein ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <button 
                onClick={() => onTabChange('diet-protein', true)}
                className="text-xs bg-bg-card hover:bg-bg-card/70 text-slate-300 py-1.5 px-3 rounded-lg font-bold transition cursor-pointer border border-slate-800 shrink-0"
              >
                去記錄
              </button>
            )}
          </div>

          {/* Coffee */}
          <div className="flex items-center justify-between p-3.5 bg-bg-app/40 rounded-2xl border border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${todayDiet.coffee ? 'bg-amber-500/10 text-amber-400' : 'bg-bg-card text-slate-550 border border-slate-800'}`}>
                <Coffee className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-200">
                今日咖啡時光
              </span>
            </div>
            {todayDiet.coffee ? (
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <button 
                onClick={() => onTabChange('diet-coffee', true)}
                className="text-xs bg-bg-card hover:bg-bg-card/70 text-slate-300 py-1.5 px-3 rounded-lg font-bold transition cursor-pointer border border-slate-800 shrink-0"
              >
                去記錄
              </button>
            )}
          </div>

          {/* Workout */}
          <div className="flex items-center justify-between p-3.5 bg-bg-app/40 rounded-2xl border border-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${todayWorkout ? 'bg-indigo-500/10 text-indigo-400' : 'bg-bg-card text-slate-550 border border-slate-800'}`}>
                <Dumbbell className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-200">
                今日健身運動
              </span>
            </div>
            {todayWorkout ? (
              <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
            ) : (
              <button 
                onClick={() => onTabChange('workout', true)}
                className="text-xs bg-bg-card hover:bg-bg-card/70 text-slate-300 py-1.5 px-3 rounded-lg font-bold transition cursor-pointer border border-slate-800 shrink-0"
              >
                去記錄
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Today's Summary Data List */}
      <div className="bg-bg-card border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">今日健康紀錄快覽</h3>

        {/* 1. Today's Weight */}
        <div className="p-4 bg-bg-app/40 border border-slate-800/50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Weight className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">今日體重紀錄</span>
              <span className="text-sm font-extrabold text-white">
                {todayWeightLog ? `${todayWeightLog.weight} kg` : '今天尚未量體重'}
              </span>
              {todayWeightLog?.body_fat !== undefined && todayWeightLog?.body_fat !== null && (
                <span className="text-xs text-slate-300 ml-2 font-bold">
                  (體脂: {todayWeightLog.body_fat}%)
                </span>
              )}
            </div>
          </div>
          {!todayWeightLog && (
            <button 
              onClick={() => onTabChange('biometrics', true)}
              className="text-xs bg-bg-card hover:bg-bg-card/70 text-slate-300 py-1.5 px-3 rounded-lg font-bold transition cursor-pointer border border-slate-800 shrink-0"
            >
              量體重
            </button>
          )}
        </div>

        {/* 2. Today's Meals */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase block pl-1">今日餐食清單</span>
          {todayMeals.length === 0 ? (
            <div className="text-center py-4 bg-bg-app/20 border border-slate-850 rounded-2xl text-xs text-slate-650 font-medium">
              今天還沒有吃東西的紀錄。
            </div>
          ) : (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {todayMeals.map(meal => (
                <div key={meal.id} className="flex items-center justify-between p-2.5 bg-bg-app/30 border border-slate-850 rounded-xl text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-slate-400 font-bold shrink-0">
                      {mealTypeTranslations[meal.meal_type as keyof typeof mealTypeTranslations]?.split(' ')[0] || '🍽️'}
                    </span>
                    <span className="text-slate-200 font-semibold truncate">
                      {formatMealText(meal)}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-600 font-bold shrink-0">
                    {new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Today's Workouts */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase block pl-1">今日運動項目</span>
          {todayWorkouts.length === 0 ? (
            <div className="text-center py-4 bg-bg-app/20 border border-slate-850 rounded-2xl text-xs text-slate-650 font-medium">
              今天還沒有安排運動。
            </div>
          ) : (
            <div className="space-y-2">
              {todayWorkouts.map(workout => (
                <div key={workout.id} className="flex items-center justify-between p-2.5 bg-bg-app/30 border border-slate-850 rounded-xl text-xs">
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-200 font-semibold">
                      {workout.workout_type === 'Weight' && '重量訓練 💪'}
                      {workout.workout_type === 'Cardio' && '有氧慢跑 🏃‍♂️'}
                      {workout.workout_type === 'Stretch' && '伸展瑜珈 🧘'}
                      {workout.workout_type === 'Walk' && '健康散步 🚶'}
                      {workout.workout_type === 'Other' && '其他運動 ⚙️'}
                      {` (${workout.duration_mins} mins)`}
                    </span>
                  </div>
                  <div className="flex space-x-0.5 shrink-0">
                    {Array.from({ length: workout.intensity }).map((_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple internal icon component for star rating
const StarIcon = () => (
  <svg className="w-3 h-3 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)
