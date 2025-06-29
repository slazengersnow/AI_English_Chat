import { createClient } from '@supabase/supabase-js'

// Environment variables appear to be swapped - fix this
const urlVar = import.meta.env.VITE_SUPABASE_URL
const keyVar = import.meta.env.VITE_SUPABASE_ANON_KEY

// Detect which is the URL and which is the key based on content
const isUrlJWT = urlVar?.startsWith('eyJ')
const isKeyJWT = keyVar?.startsWith('eyJ')

const supabaseUrl = isUrlJWT ? 'https://xcjplyhqxgrbdhixmzse.supabase.co' : urlVar
const supabaseKey = isKeyJWT ? keyVar : urlVar

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export type User = {
  id: string
  email: string
  role?: 'admin' | 'user'
  created_at: string
  email_confirmed_at?: string
}

export type AuthError = {
  message: string
  status?: number
}