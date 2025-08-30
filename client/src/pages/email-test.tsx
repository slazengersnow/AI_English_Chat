import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../../shared/supabase";
import { Mail, CheckCircle, XCircle } from "lucide-react";

export default function EmailTest() {
  const [email, setEmail] = useState("slazengersnow@gmail.com");
  const [password, setPassword] = useState("TestPassword123!");
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addTestResult = (testName: string, success: boolean, details: any) => {
    setTestResults((prev) => [
      ...prev,
      {
        testName,
        success,
        details,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const testSignUp = async () => {
    try {
      console.log("Testing sign up with email:", email);

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { test: true },
        },
      });

      console.log("Sign up result:", { data, error });

      if (error) {
        if (error.message.includes("already registered")) {
          addTestResult("サインアップテスト", true, "既に登録済み（正常）");
          return true;
        } else {
          addTestResult("サインアップテスト", false, error.message);
          return false;
        }
      }

      addTestResult("サインアップテスト", true, "アカウント作成成功");
      return true;
    } catch (error) {
      console.error("Sign up error:", error);
      addTestResult(
        "サインアップテスト",
        false,
        (error as Error).message || String(error),
      );
      return false;
    }
  };

  const testPasswordReset = async () => {
    try {
      console.log("Testing password reset with email:", email);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      console.log("Password reset result:", { data, error });

      if (error) {
        addTestResult("パスワードリセット", false, error.message);
        return false;
      }

      addTestResult("パスワードリセット", true, "リセット要求送信成功");
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      addTestResult(
        "パスワードリセット",
        false,
        (error as Error).message || String(error),
      );
      return false;
    }
  };

  const testResendConfirmation = async () => {
    try {
      console.log("Testing resend confirmation with email:", email);

      const { data, error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      console.log("Resend confirmation result:", { data, error });

      if (error) {
        addTestResult("確認メール再送", false, error.message);
        return false;
      }

      addTestResult("確認メール再送", true, "確認メール再送成功");
      return true;
    } catch (error) {
      console.error("Resend confirmation error:", error);
      addTestResult(
        "確認メール再送",
        false,
        (error as Error).message || String(error),
      );
      return false;
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      // Test 1: Sign up (to trigger email)
      await testSignUp();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test 2: Password reset
      await testPasswordReset();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test 3: Resend confirmation
      await testResendConfirmation();

      toast({
        title: "全テスト完了",
        description:
          "すべてのメール送信テストが完了しました。結果を確認してください。",
      });
    } catch (error) {
      console.error("Test suite error:", error);
      toast({
        title: "テストエラー",
        description: "テスト実行中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Mail className="w-6 h-6" />
            Supabaseメール送信テスト
          </CardTitle>
          <CardDescription>
            サインアップ、パスワードリセット、確認メール再送の包括的テスト
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">テスト用メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">テスト用パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="TestPassword123!"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Button
              onClick={testSignUp}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              サインアップテスト
            </Button>
            <Button
              onClick={testPasswordReset}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              パスワードリセット
            </Button>
            <Button
              onClick={testResendConfirmation}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              確認メール再送
            </Button>
            <Button
              onClick={runAllTests}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "実行中..." : "全テスト実行"}
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <Label>テスト結果</Label>
              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 py-2 border-b last:border-b-0"
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{result.testName}</div>
                      <div className="text-sm text-gray-600">
                        {result.details}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-yellow-800">注意事項</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• テストメールは実際に送信されます</li>
              <li>• 既に登録済みのメールアドレスでもテスト可能</li>
              <li>
                • Supabaseの設定によってはメール送信に時間がかかる場合があります
              </li>
              <li>• レート制限を避けるためテスト間に遅延を設けています</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
