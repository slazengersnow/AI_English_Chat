import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const signupSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "利用規約とプライバシーポリシーに同意する必要があります"
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"]
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false
    }
  });

  const signupMutation = useMutation({
    mutationFn: async (data: Omit<SignupFormData, "confirmPassword" | "agreeToTerms">) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "アカウント作成完了",
        description: "プラン選択ページに移動します"
      });
      setLocation("/subscription/select");
    },
    onError: (error: any) => {
      toast({
        title: "登録エラー",
        description: error.message || "アカウント作成に失敗しました",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: SignupFormData) => {
    const { confirmPassword, agreeToTerms, ...signupData } = data;
    signupMutation.mutate(signupData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">アカウント作成</CardTitle>
            <p className="text-gray-600">AI英作文チャットを始めましょう</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className={form.formState.errors.email ? "border-red-500" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    className={form.formState.errors.password ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">パスワード確認</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...form.register("confirmPassword")}
                    className={form.formState.errors.confirmPassword ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={form.watch("agreeToTerms")}
                    onCheckedChange={(checked) => 
                      form.setValue("agreeToTerms", checked as boolean)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="agreeToTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
                        <DialogTrigger asChild>
                          <button 
                            type="button"
                            className="text-blue-600 hover:underline"
                          >
                            利用規約およびプライバシーポリシー
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>利用規約およびプライバシーポリシー</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh] pr-4">
                            <div className="prose prose-sm max-w-none">
                              <p className="text-gray-700 mb-4">
                                本規約は、ユーザーの皆さま（以下「ユーザー」といいます）が、当サービス「AI英作文チャット」（以下「本サービス」といいます）をご利用いただくにあたっての条件を定めるものです。
                              </p>
                              
                              <h3 className="text-lg font-semibold mt-6 mb-3">第1条（サービスの概要）</h3>
                              <p className="text-gray-700 mb-4">
                                本サービスは、生成AIを用いて英作文トレーニングを行うWebアプリケーションです。一定の機能は無料でご利用いただけますが、月額・年額の有料プランをご契約いただくことで、追加の機能やコンテンツをご利用いただけます。
                              </p>

                              <h3 className="text-lg font-semibold mt-6 mb-3">第2条（ご利用にあたっての注意事項）</h3>
                              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                                <li>本サービスは、通信環境や機器の状況によって正常に動作しない場合があります。通信費用はユーザーのご負担となります。</li>
                                <li>メンテナンスやシステムトラブル等により、本サービスの一部または全部を予告なく停止する場合があります。</li>
                                <li>本サービスの提供の中断、停止、エラー、データの損失等によってユーザーに生じた損害について、当社は一切の責任を負いません。</li>
                              </ol>

                              <h3 className="text-lg font-semibold mt-6 mb-3">第3条（料金・プラン・支払い）</h3>
                              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                                <li>本サービスの利用料金は、表示された内容に従ってお支払いいただきます。</li>
                                <li>料金プランは予告なく変更される場合がありますが、既存のユーザーには原則として事前に通知いたします。</li>
                                <li>トライアル期間終了後は、自動的に「スタンダードプラン（月額）」へ移行し、決済が開始されます。</li>
                                <li>年額プランをご契約いただいた場合、期間満了後は自動的に契約が更新され、同一料金で継続されます。</li>
                                <li>年額プランにおいて、途中解約やサービス停止が発生した場合でも、返金等の対応は行いません。</li>
                              </ol>

                              <p className="text-xs text-gray-500 mt-6">
                                ※ その他の条項については、メインページの利用規約をご確認ください。
                              </p>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      に同意する
                    </label>
                  </div>
                </div>
                {form.formState.errors.agreeToTerms && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.agreeToTerms.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? "作成中..." : "アカウント作成"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                既にアカウントをお持ちですか？{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-blue-600 hover:underline"
                >
                  ログイン
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}