// VITE_SUPABASE_URL/ANON_KEY가 .env에 없으면 supabase는 null이 되고, 앱은 로그인
// 없이 로컬 상태만으로 동작한다(AppContext의 isSupabaseEnabled가 이 값을 기준으로 분기).
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null
