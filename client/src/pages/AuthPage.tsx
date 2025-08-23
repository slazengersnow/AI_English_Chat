import React, { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { SignupForm } from '@/components/SignupForm';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast.js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "ログインエラー",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "ログイン成功",
          description: "ログインしました",
        });
        // Redirect will be handled by auth state change
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "ログインエラー",
        description: "ログインに失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (
    email: string,
    password: string,
    confirmPassword: string,
    termsAccepted: boolean,
    privacyAccepted: boolean
  ) => {
    if (password !== confirmPassword) {
      toast({
        title: "パスワードエラー",
        description: "パスワードが一致しません",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: "利用規約エラー",
        description: "利用規約とプライバシーポリシーに同意してください",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast({
          title: "アカウント作成エラー",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "アカウント作成成功",
          description: "確認メールを送信しました。メールをご確認ください。",
        });
      }
    } catch (error) {
      toast({
        title: "アカウント作成エラー",
        description: "アカウント作成に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Google認証エラー",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Google認証エラー",
        description: "Google認証に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isSignup ? (
        <SignupForm
          onSignup={handleSignup}
          onGoogleSignup={handleGoogleAuth}
          onSwitchToLogin={() => setIsSignup(false)}
          loading={loading}
        />
      ) : (
        <LoginForm
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleAuth}
          onSwitchToSignup={() => setIsSignup(true)}
          loading={loading}
        />
      )}
    </>
  );
}