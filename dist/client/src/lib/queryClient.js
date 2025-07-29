"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryClient = exports.getQueryFn = void 0;
exports.apiRequest = apiRequest;
const react_query_1 = require("@tanstack/react-query");
const supabase_1 = require("@shared/supabase");
async function throwIfResNotOk(res) {
    if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
    }
}
async function getAuthHeaders() {
    const { data: { session } } = await supabase_1.supabase.auth.getSession();
    const headers = {};
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    if (session?.user?.email) {
        headers['X-User-Email'] = session.user.email;
    }
    return headers;
}
async function apiRequest(method, url, data) {
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
const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(queryKey[0], {
        headers: authHeaders,
        credentials: "include",
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
};
exports.getQueryFn = getQueryFn;
exports.queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            queryFn: (0, exports.getQueryFn)({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
