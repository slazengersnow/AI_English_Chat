import { useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useLocation } from 'wouter';

export default function Logout() {
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        // Clear any stored session data
        localStorage.clear();
        sessionStorage.clear();
        console.log('Logout successful, redirecting to login');
        setLocation('/login');
      } catch (error) {
        console.error('Logout error:', error);
        setLocation('/login');
      }
    };

    handleLogout();
  }, [signOut, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">ログアウト中...</p>
      </div>
    </div>
  );
}