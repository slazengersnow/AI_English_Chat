import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

// 一時的な型定義（開発環境用）
interface UserSubscription {
  subscriptionStatus?: string;
}

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  // 開発環境では常にバイパス
  const isDevelopment = true;
  
  if (isDevelopment) {
    console.log('SubscriptionGuard - Development mode bypass');
    return <>{children}</>;
  }

  // 以下は本番用（現在は使用されない）
  return <>{children}</>;
}
