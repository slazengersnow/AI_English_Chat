import { createClient } from "@supabase/supabase-js";

// Check if we're in a browser environment (client-side)
const isBrowser = typeof window !== 'undefined';

// Fallback values for development
const DEFAULT_SUPABASE_URL = 'https://xcjplyhqxgrbdhixmzse.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanlseXFoeGdyYmRoaXhtenNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNjExMjMsImV4cCI6MjA1MDkzNzEyM30.XZaYqFdXF9XZQEtJGXcvzuXGlhXRoZKOJ4PxzCnJgDo";

// Unified environment variable access
let supabaseUrl: string;
let supabaseKey: string;

if (isBrowser) {
  // Client-side: use import.meta.env (injected by Vite)
  let metaEnv: any = {};
  try {
    metaEnv = (import.meta as any).env || {};
  } catch (e) {
    metaEnv = {};
  }
  supabaseUrl = metaEnv?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  supabaseKey = metaEnv?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  
  // Browser-side debug for environment variables
  console.log('Browser environment variables:', {
    VITE_SUPABASE_URL: metaEnv?.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: metaEnv?.VITE_SUPABASE_ANON_KEY ? `${metaEnv.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined',
    hasUrl: !!metaEnv?.VITE_SUPABASE_URL,
    hasKey: !!metaEnv?.VITE_SUPABASE_ANON_KEY
  });
} else {
  // Server-side: use process.env, check both VITE_ prefixed and non-prefixed
  supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  
  // Validate that we're not getting database URL instead of API key
  if (supabaseKey?.startsWith('postgresql://')) {
    console.error('ERROR: SUPABASE_ANON_KEY contains database URL instead of API key!');
    supabaseKey = DEFAULT_SUPABASE_ANON_KEY;
  }
}

console.log("Supabase config:", {
  environment: isBrowser ? 'browser' : 'server',
  url: supabaseUrl?.slice(0, 30) + "...",
  keyLength: supabaseKey?.length,
  keyPrefix: supabaseKey?.slice(0, 10) + "...",
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  isDefaultUrl: supabaseUrl === DEFAULT_SUPABASE_URL,
  isDefaultKey: supabaseKey === DEFAULT_SUPABASE_ANON_KEY,
});

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  throw new Error("supabaseUrl is required");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type User = {
  id: string;
  email: string;
  role?: "admin" | "user";
  created_at: string;
  email_confirmed_at?: string;
};

export type AuthError = {
  message: string;
  status?: number;
};
