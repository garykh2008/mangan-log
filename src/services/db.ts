import { supabase } from '../lib/supabaseClient'

// Define interfaces for tables
export interface MedicationLog {
  id: string
  created_at: string
  injection_date: string
  dose: number
  cycle_number: number
  user_id: string
}

export interface BiometricsLog {
  id: string
  created_at: string
  weight: number
  body_fat: number | null
  photo_url: string | null
  user_id: string
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
}

export interface WorkoutLog {
  id: string
  created_at: string
  workout_type: string
  duration_mins: number
  intensity: number
  notes: string | null
  user_id: string
}

// Helper: Upload Image to storage bucket
export async function uploadImage(
  bucket: 'biometrics' | 'diet',
  file: File,
  userId: string
): Promise<string | null> {
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
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .order('injection_date', { ascending: false })
    if (error) throw error
    return data || []
  },

  async addLog(log: Omit<MedicationLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }): Promise<MedicationLog> {
    const { data, error } = await supabase
      .from('medication_logs')
      .insert([log])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateLog(id: string, log: Partial<Omit<MedicationLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }>): Promise<MedicationLog> {
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
    const { data, error } = await supabase
      .from('biometrics_logs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async addLog(log: Omit<BiometricsLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }): Promise<BiometricsLog> {
    const { data, error } = await supabase
      .from('biometrics_logs')
      .insert([log])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateLog(id: string, log: Partial<Omit<BiometricsLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }>): Promise<BiometricsLog> {
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
    const { data, error } = await supabase
      .from('diet_logs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async addLog(log: Omit<DietLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }): Promise<DietLog> {
    const { data, error } = await supabase
      .from('diet_logs')
      .insert([log])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateLog(id: string, log: Partial<Omit<DietLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }>): Promise<DietLog> {
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
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async addLog(log: Omit<WorkoutLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }): Promise<WorkoutLog> {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert([log])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateLog(id: string, log: Partial<Omit<WorkoutLog, 'id' | 'created_at' | 'user_id'> & { created_at?: string }>): Promise<WorkoutLog> {
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
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .match({ id })
    if (error) throw error
  },
}
