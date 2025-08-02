import { QueryClient, QueryFunction, useMutation } from "@tanstack/react-query";
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

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  if (session?.user?.email) {
    headers['X-User-Email'] = session.user.email;
  }
  
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(queryKey[0] as string, {
      headers: authHeaders,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// CRITICAL: Absolutely no auto-retry for any operation
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false, // NO RETRY
    },
    mutations: {
      retry: false, // NO RETRY
    },
  },
});

// Simple mutation helper with NO RETRY built-in
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  console.log("🔧 Creating mutation with retry: false");
  return useMutation({
    mutationFn,
    retry: false, // CRITICAL: No retry
    // DO NOT add onSuccess/onError that could trigger additional calls
    onError: (error) => {
      console.error("🚨 Mutation error caught:", error);
      // DO NOT call mutationFn again here
    },
    onSuccess: (data) => {
      console.log("✅ Mutation success:", data);
      // DO NOT call mutationFn again here
    },
  });
}