import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanlseXFoeGdyYmRoaXhtenNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNjExMjMsImV4cCI6MjA1MDkzNzEyM30.XZaYqFdXF9XZQEtJGXcvzuXGlhXRoZKOJ4PxzCnJgDo";

console.log("Supabase config:", {
  url: supabaseUrl?.slice(0, 30) + "...",
  keyLength: supabaseKey?.length,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
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
