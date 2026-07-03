import { supabase } from '../lib/supabaseClient'

// Define interfaces for tables
export interface MedicationLog {
  id: string
  created_at: string
  injection_date: string
  dose: number
  cycle_number: number
  user_id: string
  is_pending?: boolean
}

export interface BiometricsLog {
  id: string
  created_at: string
  weight: number
  body_fat: number | null
  photo_url: string | null
  user_id: string
  is_pending?: boolean
}

export interface DietLog {
  id: string
  created_at: string
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  food_text: string
  photo_url: string | null
  is_high_protein: boolean
  has_coffee: boolean
  user_id: string
  is_pending?: boolean
}

export interface WorkoutLog {
  id: string
  created_at: string
  workout_type: string
  duration_mins: number
  intensity: number
  notes: string | null
  user_id: string
  is_pending?: boolean
}

// LocalStorage Keys
const CACHE_KEYS = {
  medication: 'mangan_cache_medication',
  biometrics: 'mangan_cache_biometrics',
  diet: 'mangan_cache_diet',
  workout: 'mangan_cache_workout',
}

const PENDING_KEYS = {
  medication: 'mangan_pending_medication',
  biometrics: 'mangan_pending_biometrics',
  diet: 'mangan_pending_diet',
  workout: 'mangan_pending_workout',
}

// Helpers
const getCache = (key: string) => {
  const cached = localStorage.getItem(key)
  return cached ? JSON.parse(cached) : []
}
const setCache = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data))
}
const getPending = (key: string) => {
  const pending = localStorage.getItem(key)
  return pending ? JSON.parse(pending) : []
}
const setPending = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data))
}
const generateTempId = () => 'temp_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()

// Check if error is network related
const isNetworkError = (err: any): boolean => {
  if (!navigator.onLine) return true
  const msg = String(err?.message || '').toLowerCase()
  return msg.includes('fetch') || msg.includes('network') || msg.includes('load failed') || msg.includes('connection')
}

// Helper: Upload Image to storage bucket
export async function uploadImage(
  bucket: 'biometrics' | 'diet',
  file: File,
  userId: string
): Promise<string | null> {
  // If offline, uploading image will fail immediately
  if (!navigator.onLine) {
    console.warn('Offline mode: Image upload skipped')
    return null
  }
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  } catch (err) {
    console.error(`Error uploading image to ${bucket}:`, err)
    return null
  }
}

// Medication API
export const medicationService = {
  async getLogs(): Promise<MedicationLog[]> {
    const pending = getPending(PENDING_KEYS.medication)
    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .order('injection_date', { ascending: false })
      if (error) throw error
      
      const remoteData = data || []
      setCache(CACHE_KEYS.medication, remoteData)
      
      // Combine remote data with local pending inserts
      return [...pending, ...remoteData]
    } catch (err) {
      if (isNetworkError(err)) {
        console.warn('Network issue, loading medication logs from local cache.')
        const cached = getCache(CACHE_KEYS.medication)
        return [...pending, ...cached]
      }
      throw err
    }
  },

  async addLogDirect(log: any): Promise<MedicationLog> {
    const { data, error } = await supabase
      .from('medication_logs')
      .insert([log])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async addLog(log: Omit<MedicationLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }): Promise<MedicationLog> {
    const isOffline = !navigator.onLine
    if (isOffline) {
      const tempLog: MedicationLog = {
        id: generateTempId(),
        created_at: log.created_at || new Date().toISOString(),
        injection_date: log.injection_date,
        dose: log.dose,
        cycle_number: log.cycle_number,
        user_id: 'pending_user',
        is_pending: true,
      }
      const pending = getPending(PENDING_KEYS.medication)
      setPending(PENDING_KEYS.medication, [tempLog, ...pending])
      return tempLog
    }

    try {
      return await this.addLogDirect(log)
    } catch (err) {
      if (isNetworkError(err)) {
        const tempLog: MedicationLog = {
          id: generateTempId(),
          created_at: log.created_at || new Date().toISOString(),
          injection_date: log.injection_date,
          dose: log.dose,
          cycle_number: log.cycle_number,
          user_id: 'pending_user',
          is_pending: true,
        }
        const pending = getPending(PENDING_KEYS.medication)
        setPending(PENDING_KEYS.medication, [tempLog, ...pending])
        return tempLog
      }
      throw err
    }
  },

  async updateLog(id: string, log: Partial<Omit<MedicationLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }>): Promise<MedicationLog> {
    // If it's a pending log in localstorage
    if (id.startsWith('temp_')) {
      const pending = getPending(PENDING_KEYS.medication)
      const index = pending.findIndex((item: any) => item.id === id)
      if (index !== -1) {
        const updated = { ...pending[index], ...log }
        pending[index] = updated
        setPending(PENDING_KEYS.medication, pending)
        return updated
      }
    }

    const { data, error } = await supabase
      .from('medication_logs')
      .update(log)
      .match({ id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteLog(id: string): Promise<void> {
    if (id.startsWith('temp_')) {
      const pending = getPending(PENDING_KEYS.medication)
      const filtered = pending.filter((item: any) => item.id !== id)
      setPending(PENDING_KEYS.medication, filtered)
      return
    }

    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .match({ id })
    if (error) throw error
  },
}

// Biometrics API
export const biometricsService = {
  async getLogs(): Promise<BiometricsLog[]> {
    const pending = getPending(PENDING_KEYS.biometrics)
    try {
      const { data, error } = await supabase
        .from('biometrics_logs')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      
      const remoteData = data || []
      setCache(CACHE_KEYS.biometrics, remoteData)
      
      return [...pending, ...remoteData]
    } catch (err) {
      if (isNetworkError(err)) {
        console.warn('Network issue, loading biometrics logs from cache.')
        const cached = getCache(CACHE_KEYS.biometrics)
        return [...pending, ...cached]
      }
      throw err
    }
  },

  async addLogDirect(log: any): Promise<BiometricsLog> {
    const { data, error } = await supabase
      .from('biometrics_logs')
      .insert([log])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async addLog(log: Omit<BiometricsLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }): Promise<BiometricsLog> {
    const isOffline = !navigator.onLine
    if (isOffline) {
      const tempLog: BiometricsLog = {
        id: generateTempId(),
        created_at: log.created_at || new Date().toISOString(),
        weight: log.weight,
        body_fat: log.body_fat,
        photo_url: log.photo_url,
        user_id: 'pending_user',
        is_pending: true,
      }
      const pending = getPending(PENDING_KEYS.biometrics)
      setPending(PENDING_KEYS.biometrics, [tempLog, ...pending])
      return tempLog
    }

    try {
      return await this.addLogDirect(log)
    } catch (err) {
      if (isNetworkError(err)) {
        const tempLog: BiometricsLog = {
          id: generateTempId(),
          created_at: log.created_at || new Date().toISOString(),
          weight: log.weight,
          body_fat: log.body_fat,
          photo_url: log.photo_url,
          user_id: 'pending_user',
          is_pending: true,
        }
        const pending = getPending(PENDING_KEYS.biometrics)
        setPending(PENDING_KEYS.biometrics, [tempLog, ...pending])
        return tempLog
      }
      throw err
    }
  },

  async updateLog(id: string, log: Partial<Omit<BiometricsLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }>): Promise<BiometricsLog> {
    if (id.startsWith('temp_')) {
      const pending = getPending(PENDING_KEYS.biometrics)
      const index = pending.findIndex((item: any) => item.id === id)
      if (index !== -1) {
        const updated = { ...pending[index], ...log }
        pending[index] = updated
        setPending(PENDING_KEYS.biometrics, pending)
        return updated
      }
    }

    const { data, error } = await supabase
      .from('biometrics_logs')
      .update(log)
      .match({ id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteLog(id: string): Promise<void> {
    if (id.startsWith('temp_')) {
      const pending = getPending(PENDING_KEYS.biometrics)
      const filtered = pending.filter((item: any) => item.id !== id)
      setPending(PENDING_KEYS.biometrics, filtered)
      return
    }

    const { error } = await supabase
      .from('biometrics_logs')
      .delete()
      .match({ id })
    if (error) throw error
  },
}

// Diet API
export const dietService = {
  async getLogs(): Promise<DietLog[]> {
    const pending = getPending(PENDING_KEYS.diet)
    try {
      const { data, error } = await supabase
        .from('diet_logs')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      
      const remoteData = data || []
      setCache(CACHE_KEYS.diet, remoteData)
      
      return [...pending, ...remoteData]
    } catch (err) {
      if (isNetworkError(err)) {
        console.warn('Network issue, loading diet logs from cache.')
        const cached = getCache(CACHE_KEYS.diet)
        return [...pending, ...cached]
      }
      throw err
    }
  },

  async addLogDirect(log: any): Promise<DietLog> {
    const { data, error } = await supabase
      .from('diet_logs')
      .insert([log])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async addLog(log: Omit<DietLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }): Promise<DietLog> {
    const isOffline = !navigator.onLine
    if (isOffline) {
      const tempLog: DietLog = {
        id: generateTempId(),
        created_at: log.created_at || new Date().toISOString(),
        meal_type: log.meal_type,
        food_text: log.food_text,
        photo_url: log.photo_url,
        is_high_protein: log.is_high_protein,
        has_coffee: log.has_coffee,
        user_id: 'pending_user',
        is_pending: true,
      }
      const pending = getPending(PENDING_KEYS.diet)
      setPending(PENDING_KEYS.diet, [tempLog, ...pending])
      return tempLog
    }

    try {
      return await this.addLogDirect(log)
    } catch (err) {
      if (isNetworkError(err)) {
        const tempLog: DietLog = {
          id: generateTempId(),
          created_at: log.created_at || new Date().toISOString(),
          meal_type: log.meal_type,
          food_text: log.food_text,
          photo_url: log.photo_url,
          is_high_protein: log.is_high_protein,
          has_coffee: log.has_coffee,
          user_id: 'pending_user',
          is_pending: true,
        }
        const pending = getPending(PENDING_KEYS.diet)
        setPending(PENDING_KEYS.diet, [tempLog, ...pending])
        return tempLog
      }
      throw err
    }
  },

  async updateLog(id: string, log: Partial<Omit<DietLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }>): Promise<DietLog> {
    if (id.startsWith('temp_')) {
      const pending = getPending(PENDING_KEYS.diet)
      const index = pending.findIndex((item: any) => item.id === id)
      if (index !== -1) {
        const updated = { ...pending[index], ...log }
        pending[index] = updated
        setPending(PENDING_KEYS.diet, pending)
        return updated
      }
    }

    const { data, error } = await supabase
      .from('diet_logs')
      .update(log)
      .match({ id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteLog(id: string): Promise<void> {
    if (id.startsWith('temp_')) {
      const pending = getPending(PENDING_KEYS.diet)
      const filtered = pending.filter((item: any) => item.id !== id)
      setPending(PENDING_KEYS.diet, filtered)
      return
    }

    const { error } = await supabase
      .from('diet_logs')
      .delete()
      .match({ id })
    if (error) throw error
  },
}

// Workout API
export const workoutService = {
  async getLogs(): Promise<WorkoutLog[]> {
    const pending = getPending(PENDING_KEYS.workout)
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      
      const remoteData = data || []
      setCache(CACHE_KEYS.workout, remoteData)
      
      return [...pending, ...remoteData]
    } catch (err) {
      if (isNetworkError(err)) {
        console.warn('Network issue, loading workout logs from cache.')
        const cached = getCache(CACHE_KEYS.workout)
        return [...pending, ...cached]
      }
      throw err
    }
  },

  async addLogDirect(log: any): Promise<WorkoutLog> {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert([log])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async addLog(log: Omit<WorkoutLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }): Promise<WorkoutLog> {
    const isOffline = !navigator.onLine
    if (isOffline) {
      const tempLog: WorkoutLog = {
        id: generateTempId(),
        created_at: log.created_at || new Date().toISOString(),
        workout_type: log.workout_type,
        duration_mins: log.duration_mins,
        intensity: log.intensity,
        notes: log.notes,
        user_id: 'pending_user',
        is_pending: true,
      }
      const pending = getPending(PENDING_KEYS.workout)
      setPending(PENDING_KEYS.workout, [tempLog, ...pending])
      return tempLog
    }

    try {
      return await this.addLogDirect(log)
    } catch (err) {
      if (isNetworkError(err)) {
        const tempLog: WorkoutLog = {
          id: generateTempId(),
          created_at: log.created_at || new Date().toISOString(),
          workout_type: log.workout_type,
          duration_mins: log.duration_mins,
          intensity: log.intensity,
          notes: log.notes,
          user_id: 'pending_user',
          is_pending: true,
        }
        const pending = getPending(PENDING_KEYS.workout)
        setPending(PENDING_KEYS.workout, [tempLog, ...pending])
        return tempLog
      }
      throw err
    }
  },

  async updateLog(id: string, log: Partial<Omit<WorkoutLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }>): Promise<WorkoutLog> {
    if (id.startsWith('temp_')) {
      const pending = getPending(PENDING_KEYS.workout)
      const index = pending.findIndex((item: any) => item.id === id)
      if (index !== -1) {
        const updated = { ...pending[index], ...log }
        pending[index] = updated
        setPending(PENDING_KEYS.workout, pending)
        return updated
      }
    }

    const { data, error } = await supabase
      .from('workout_logs')
      .update(log)
      .match({ id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteLog(id: string): Promise<void> {
    if (id.startsWith('temp_')) {
      const pending = getPending(PENDING_KEYS.workout)
      const filtered = pending.filter((item: any) => item.id !== id)
      setPending(PENDING_KEYS.workout, filtered)
      return
    }

    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .match({ id })
    if (error) throw error
  },
}

// Background Sync Service
export const syncService = {
  // Returns number of pending logs across all tables
  getPendingCount(): number {
    return (
      getPending(PENDING_KEYS.medication).length +
      getPending(PENDING_KEYS.biometrics).length +
      getPending(PENDING_KEYS.diet).length +
      getPending(PENDING_KEYS.workout).length
    )
  },

  async syncPendingLogs(): Promise<void> {
    if (!navigator.onLine) return

    // 1. Medication
    const medPending = getPending(PENDING_KEYS.medication)
    if (medPending.length > 0) {
      for (const log of medPending) {
        const { id, is_pending, created_at, user_id, ...payload } = log
        const record = created_at ? { ...payload, created_at } : payload
        await medicationService.addLogDirect(record)
      }
      setPending(PENDING_KEYS.medication, [])
    }

    // 2. Biometrics
    const bioPending = getPending(PENDING_KEYS.biometrics)
    if (bioPending.length > 0) {
      for (const log of bioPending) {
        const { id, is_pending, created_at, user_id, ...payload } = log
        const record = created_at ? { ...payload, created_at } : payload
        await biometricsService.addLogDirect(record)
      }
      setPending(PENDING_KEYS.biometrics, [])
    }

    // 3. Diet
    const dietPending = getPending(PENDING_KEYS.diet)
    if (dietPending.length > 0) {
      for (const log of dietPending) {
        const { id, is_pending, created_at, user_id, ...payload } = log
        const record = created_at ? { ...payload, created_at } : payload
        await dietService.addLogDirect(record)
      }
      setPending(PENDING_KEYS.diet, [])
    }

    // 4. Workout
    const workPending = getPending(PENDING_KEYS.workout)
    if (workPending.length > 0) {
      for (const log of workPending) {
        const { id, is_pending, created_at, user_id, ...payload } = log
        const record = created_at ? { ...payload, created_at } : payload
        await workoutService.addLogDirect(record)
      }
      setPending(PENDING_KEYS.workout, [])
    }
  }
}
