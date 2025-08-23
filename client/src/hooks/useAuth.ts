import { useQuery } from "@tanstack/react-query";
import { useAuth as useAuthProvider } from "@/providers/auth-provider";

export function useAuth() {
  const { user: authUser, initialized, isLoading: authLoading } = useAuthProvider();

  // Fetch user data from server when authenticated
  const { data: userData, isLoading: userDataLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!authUser && initialized,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = authLoading || userDataLoading;
  const isAuthenticated = !!authUser && !!userData;

  // Log authentication errors for debugging
  if (error) {
    console.log("Failed to load user data:", error);
  }

  return {
    user: userData || authUser,
    isLoading,
    isAuthenticated,
    initialized,
    error,
  };
}