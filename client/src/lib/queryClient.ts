import { QueryClient, QueryFunction, useMutation, useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xcjplyhqxgrbdhixmzse.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanBseWhxeGdyYmRoaXhtenNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1ODQ4MzQsImV4cCI6MjA2NDE2MDgzNH0.jaqoGOz1Z2zfj-eFShm2YF8nYu8DUGaE_cD9_N1Vfhg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Default query function with authentication
const defaultQueryFn: QueryFunction = async ({ queryKey, signal }) => {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = Array.isArray(queryKey) ? queryKey.join("/") : String(queryKey);
  const res = await fetch(url, { signal, headers });
  await throwIfResNotOk(res);
  return res.json();
};

// Query client with NO RETRY configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: false, // CRITICAL: No retry for queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // CRITICAL: No retry for mutations
    },
  },
});

// API request helper with authentication
export async function apiRequest(url: string, options: RequestInit = {}) {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  await throwIfResNotOk(res);
  return res.json();
}

// Simple mutation helper with NO RETRY built-in
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  return useMutation({
    mutationFn,
    retry: false, // CRITICAL: No retry
    // No onSuccess/onError callbacks that could trigger additional calls
  });
}

export { supabase };