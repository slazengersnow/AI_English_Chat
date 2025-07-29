"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xcjplyhqxgrbdhixmzse.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ||
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
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
