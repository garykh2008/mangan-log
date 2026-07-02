import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are configured
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') && 
  supabaseAnonKey !== 'your-supabase-anon-key'

if (!isConfigured) {
  console.warn(
    '⚠️ Supabase parameters are not configured yet. Please update the .env file with your project URL and Anon Key.'
  )
}

// Fallback to placeholder client to prevent crashes during initial build
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
