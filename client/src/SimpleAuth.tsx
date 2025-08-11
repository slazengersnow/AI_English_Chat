import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Checkbox } from './components/ui/checkbox';

interface SimpleAuthProps {
  onClose?: () => void;
}

export function SimpleAuth({ onClose }: SimpleAuthProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Demo mode - automatically close after 2 seconds
    setTimeout(() => {
      setLoading(false);
      if (onClose) onClose();
      // Redirect to main app
      window.location.href = '/';
    }, 2000);
  };

  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onClose) onClose();
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isSignup ? 'AI英作文チャット' : 'AI瞬間英作文チャット'}
          </h1>
          <p className="text-gray-600 text-sm">
            {isSignup ? '新しいアカウントを作成してください' : 'アカウントにログインしてください'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                required
              />
              {!isSignup && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-red-500 text-xs font-medium">必須</span>
                </div>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={isSignup ? '半角6文字、英字と数字を含む' : 'パスワードを入力'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-20 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
                <span className="text-red-500 text-xs font-medium">必須</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Confirm Password Field - Only for signup */}
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード確認
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="パスワードを再入力"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-20 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
                  <span className="text-red-500 text-xs font-medium">必須</span>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Terms and Privacy Checkboxes - Only for signup */}
          {isSignup && (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 leading-5">
                  <button 
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-500 hover:text-blue-600 underline cursor-pointer"
                  >
                    利用規約
                  </button>
                  に同意します
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="privacy" className="text-sm text-gray-700 leading-5">
                  <button 
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    className="text-blue-500 hover:text-blue-600 underline cursor-pointer"
                  >
                    プライバシーポリシー
                  </button>
                  に同意します
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || (isSignup && (!termsAccepted || !privacyAccepted))}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-base disabled:bg-gray-400"
          >
            {loading ? 
              (isSignup ? 'アカウント作成中...' : 'ログイン中...') : 
              (isSignup ? 'アカウント作成' : 'ログイン')
            }
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 text-center">
          <span className="text-gray-400 text-sm">または</span>
        </div>

        {/* Google Auth Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleAuth}
          className="w-full h-12 border-gray-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700 font-medium">
            {isSignup ? 'Googleで登録' : 'Googleでログイン'}
          </span>
        </Button>

        {/* Toggle Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {isSignup ? (
              <>
                すでにアカウントをお持ちですか？{' '}
                <button
                  onClick={() => setIsSignup(false)}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  ログイン
                </button>
              </>
            ) : (
              <>
                アカウントをお持ちでない方は{' '}
                <button
                  onClick={() => setIsSignup(true)}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  新規登録
                </button>
              </>
            )}
          </p>
        </div>

        {/* Close button for demo */}
        {onClose && (
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-gray-500 text-sm"
            >
              デモ用: 戻る
            </Button>
          </div>
        )}
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">利用規約</h2>
                <button 
                  onClick={() => setShowTerms(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="prose prose-sm max-w-none">
                <TermsContent />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowTerms(false)}>
                閉じる
              </Button>
              <Button 
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTerms(false);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                同意する
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">プライバシーポリシー</h2>
                <button 
                  onClick={() => setShowPrivacy(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="prose prose-sm max-w-none">
                <PrivacyContent />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowPrivacy(false)}>
                閉じる
              </Button>
              <Button 
                onClick={() => {
                  setPrivacyAccepted(true);
                  setShowPrivacy(false);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                同意する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Terms Content Component
function TermsContent() {
  return (
    <div className="text-sm leading-relaxed">
      <h1 className="text-xl font-bold mb-4">AI瞬間英作文チャット 利用規約</h1>
      
      <p className="mb-6">
        本規約は、ユーザーの皆さま（以下「ユーザー」といいます）が、当サービス「AI瞬間英作文チャット」（以下「本サービス」といいます）をご利用いただくにあたっての条件を定めるものです。ご利用に際しては、以下の内容をご確認のうえ、同意いただく必要があります。
      </p>

      <h2 className="text-lg font-semibold mb-3">第1条（サービスの概要）</h2>
      <p className="mb-6">
        本サービスは、生成AIを用いて英作文トレーニングを行うWebアプリケーションです。一定の期間は無料でご利用いただけますが、月額・年額の有料プランをご契約いただくことで、追加の機能やコンテンツをご利用いただけます。
      </p>

      <h2 className="text-lg font-semibold mb-3">第2条（ご利用にあたっての注意事項）</h2>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>本サービスは、通信環境や機器の状況によって正常に動作しない場合があります。通信費用はユーザーのご負担となります。</li>
        <li>メンテナンスやシステムトラブル等により、本サービスの一部または全部を予告なく停止する場合があります。</li>
        <li>本サービスの提供の中断、停止、エラー、データの損失等によってユーザーに生じた損害について、当社は一切の責任を負いません。</li>
      </ol>

      <h2 className="text-lg font-semibold mb-3">第3条（料金・プラン・支払い）</h2>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>本サービスの利用料金は、表示された内容に従ってお支払いいただきます。</li>
        <li>料金プランは予告なく変更される場合がありますが、既存のユーザーには原則として事前に通知いたします。</li>
        <li>無料トライアル期間中は、プレミアムプラン相当の機能をご利用いただけます。トライアル期間終了後は、自動的にスタンダードプラン（月額）へ移行し、当該プランに基づく決済が開始されます。</li>
        <li>年額プランをご契約いただいた場合、期間満了後は自動的に契約が更新され、同一料金で継続されます。</li>
        <li>年額プランにおいて、途中解約やサービス停止が発生した場合でも、返金等の対応は行いません。</li>
      </ol>

      <h2 className="text-lg font-semibold mb-3">第4条（メール・通知）</h2>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>ユーザーがご登録いただいたメールアドレスには、サービスに関するお知らせや改善のご案内、利用状況のサマリー、関連サービスのご紹介などをお送りする場合があります。</li>
        <li>ご案内メールはいつでも配信停止が可能です。</li>
      </ol>

      <h2 className="text-lg font-semibold mb-3">第5条（アカウント管理）</h2>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>本サービスを利用するには、メールアドレス・パスワードによるアカウント登録が必要です。</li>
        <li>アカウント情報はご本人が責任を持って管理してください。第三者への貸与や共有は禁止とします。</li>
        <li>ユーザーが本規約に違反した場合、アカウントを停止または削除することがあります。</li>
      </ol>

      <h2 className="text-lg font-semibold mb-3">第6条（禁止事項）</h2>
      <p className="mb-3">以下に該当する行為は禁止します：</p>
      <ul className="list-disc list-inside mb-6 space-y-1">
        <li>他人の個人情報を無断で使用する行為</li>
        <li>サービスのリバースエンジニアリングや不正アクセス</li>
        <li>本サービスのソースコードの解析、複製、リバースエンジニアリング</li>
        <li>自動化されたプログラム等による大量アクセス</li>
        <li>スクレイピングなど無断で情報を取得する行為</li>
        <li>商用利用や無断転載・再配布</li>
        <li>虚偽の情報でのアカウント登録</li>
        <li>過度な負荷をかける行為</li>
        <li>その他、当社が不適切と判断する行為</li>
      </ul>

      <h2 className="text-lg font-semibold mb-3">第7条（知的財産権）</h2>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>本サービス内で提供されるすべてのテキスト・画像・AIによる出力等のコンテンツの著作権は、当社または提供元に帰属します。</li>
        <li>ユーザーが入力した日本語文および英訳の著作権は、ユーザーに帰属します。</li>
        <li>無断での複製、転載、再配布は禁じます。</li>
      </ol>

      <h2 className="text-lg font-semibold mb-3">第8条（サービスの変更・停止）</h2>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>当社は、ユーザーに事前の通知をすることなく、本サービスの内容を変更、追加、削除することができます。</li>
        <li>当社は、以下の場合には本サービスを一時的に停止することができます：
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>システムメンテナンスを行う場合</li>
            <li>天災、火災、停電、通信障害等の不可抗力により運営が困難な場合</li>
            <li>その他、当社が必要と判断した場合</li>
          </ul>
        </li>
      </ol>

      <h2 className="text-lg font-semibold mb-3">第9条（解約・退会）</h2>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>ユーザーはいつでもアカウントを削除し、サービスから退会することができます。</li>
        <li>退会後も、お支払いいただいた料金の返金は原則として行いません。</li>
        <li>退会と同時に、ユーザーのアカウント情報および学習履歴は削除されます。</li>
      </ol>

      <h2 className="text-lg font-semibold mb-3">第10条（免責事項）</h2>
      <ol className="list-decimal list-inside mb-6 space-y-2">
        <li>本サービスは現状有姿で提供されるものであり、その正確性、完全性、有用性について保証いたしません。</li>
        <li>AIによる評価結果は参考情報であり、その正確性や教育効果を保証するものではありません。</li>
        <li>当サービスは、AIによる生成コンテンツの正確性、完全性、有用性等を保証するものではありません。利用者は、AIの回答や学習結果を自己の責任において利用するものとし、当社はそれにより生じたいかなる損害についても責任を負いません。</li>
        <li>本サービスの利用により生じた損害（精神的損害・機会損失・逸失利益等）について、当社は一切の責任を負いません。</li>
        <li>ユーザー同士または第三者との間で紛争が発生した場合でも、当社は責任を負いません。</li>
      </ol>

      <h2 className="text-lg font-semibold mb-3">第11条（規約の変更）</h2>
      <p className="mb-6">
        本規約は予告なく変更される場合があります。変更後の内容はサービス上に掲示された時点で効力を持つものとし、引き続きサービスをご利用いただく場合には、変更後の規約に同意したものとみなします。
      </p>

      <h2 className="text-lg font-semibold mb-3">第12条（準拠法および管轄裁判所）</h2>
      <p className="mb-6">
        本規約は日本法に準拠し、利用者と当社の間で生じた紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
      </p>

      <h2 className="text-lg font-semibold mb-3">附則</h2>
      <p className="mb-6">本規約は2025年8月10日より施行します。</p>

      <div className="border-t pt-4 mt-6">
        <p className="font-semibold">お問い合わせ先</p>
        <p>AI瞬間英作文チャット運営事務局</p>
        <p>メール：contact@ai-english-chat.com</p>
      </div>
    </div>
  );
}

// Privacy Policy Content Component
function PrivacyContent() {
  return (
    <div className="text-sm leading-relaxed">
      <h1 className="text-xl font-bold mb-4">AI瞬間英作文チャット プライバシーポリシー</h1>
      
      <p className="mb-6">
        株式会社ビズモア（以下「当社」といいます）は、「AI瞬間英作文チャット」（以下「本サービス」といいます）をご利用いただくユーザーの皆さま（以下「ユーザー」といいます）の個人情報保護の重要性を認識し、個人情報の保護に関する法律およびその他の関連法令を遵守し、以下のプライバシーポリシーに従って個人情報を取り扱います。
      </p>

      <h2 className="text-lg font-semibold mb-3">1. 個人情報の収集</h2>
      <p className="mb-3">当社は、本サービスの提供にあたり、以下の個人情報を収集いたします。</p>
      
      <h3 className="text-md font-semibold mb-2">1.1 ユーザーが直接提供する情報</h3>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li><strong>アカウント情報</strong>: メールアドレス、パスワード</li>
        <li><strong>学習データ</strong>: 入力された日本語文、英訳回答、学習履歴</li>
        <li><strong>プロフィール情報</strong>: 学習目標、難易度設定等の任意入力情報</li>
      </ul>

      <h3 className="text-md font-semibold mb-2">1.2 サービス利用時に自動的に収集される情報</h3>
      <ul className="list-disc list-inside mb-6 space-y-1">
        <li><strong>利用状況データ</strong>: ログイン履歴、学習進捗、問題解答状況、成績データ</li>
        <li><strong>決済情報</strong>: 課金履歴、サブスクリプション状況（決済詳細はStripeが管理）</li>
        <li><strong>技術情報</strong>: IPアドレス、ブラウザ種別、デバイス情報、OSバージョン</li>
        <li><strong>アクセスログ</strong>: アクセス日時、閲覧ページ、リファラー情報</li>
      </ul>

      <h2 className="text-lg font-semibold mb-3">2. 個人情報の利用目的</h2>
      <p className="mb-3">収集した個人情報は、以下の目的で利用いたします。</p>
      <ol className="list-decimal list-inside mb-6 space-y-1">
        <li><strong>サービス提供</strong>: アカウント管理、学習機能の提供、進捗管理</li>
        <li><strong>AI評価サービス</strong>: 英訳の評価・フィードバック生成のためのAI処理</li>
        <li><strong>決済処理</strong>: サブスクリプション料金の請求・管理</li>
        <li><strong>カスタマーサポート</strong>: お問い合わせ対応、技術サポート</li>
        <li><strong>サービス改善</strong>: 機能改善、新機能開発、品質向上</li>
      </ol>

      <h2 className="text-lg font-semibold mb-3">3. 第三者への情報提供</h2>
      <p className="mb-3">当社は、取得した個人情報を、以下の場合を除き第三者に提供することはありません。</p>
      
      <h3 className="text-md font-semibold mb-2">3.1 本人の同意がある場合</h3>
      <h3 className="text-md font-semibold mb-2">3.2 法令に基づく場合</h3>
      <h3 className="text-md font-semibold mb-2">3.3 業務委託先に業務を委託する場合（例：クラウドサービス、決済代行事業者など）</h3>
      
      <h3 className="text-md font-semibold mb-2">3.4 サービス提供に必要な第三者サービス</h3>
      <p className="mb-3">以下のサービスプロバイダーと必要な範囲で個人情報を共有いたします：</p>
      
      <div className="mb-4">
        <h4 className="font-semibold">Anthropic Inc.（米国）</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li><strong>提供情報</strong>: 日本語文、英訳回答</li>
          <li><strong>利用目的</strong>: AI（Claude）による英訳評価・フィードバック生成</li>
          <li><strong>プライバシーポリシー</strong>: https://www.anthropic.com/privacy</li>
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Stripe Inc.（米国）</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li><strong>提供情報</strong>: 決済に必要な情報（氏名、メールアドレス、決済情報）</li>
          <li><strong>利用目的</strong>: サブスクリプション料金の決済処理</li>
          <li><strong>プライバシーポリシー</strong>: https://stripe.com/privacy</li>
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Google LLC（米国）</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li><strong>提供情報</strong>: アクセスログ、利用状況データ</li>
          <li><strong>利用目的</strong>: Google Analytics によるサービス分析・改善</li>
          <li><strong>プライバシーポリシー</strong>: https://policies.google.com/privacy</li>
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Google LLC - Firebase（米国）</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li><strong>提供情報</strong>: アカウント情報、認証データ</li>
          <li><strong>利用目的</strong>: ユーザー認証、データベース管理</li>
          <li><strong>プライバシーポリシー</strong>: https://firebase.google.com/support/privacy</li>
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Supabase Inc.（米国）</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li><strong>提供情報</strong>: アカウント情報、学習データ</li>
          <li><strong>利用目的</strong>: データベース管理、ユーザー認証</li>
          <li><strong>プライバシーポリシー</strong>: https://supabase.com/privacy</li>
        </ul>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold">Fly.io Inc.（米国）</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li><strong>提供情報</strong>: アクセスログ、技術情報</li>
          <li><strong>利用目的</strong>: アプリケーションホスティング、システム運営</li>
          <li><strong>プライバシーポリシー</strong>: https://fly.io/legal/privacy-policy/</li>
        </ul>
      </div>

      <h3 className="text-md font-semibold mb-2">3.5 法令に基づく場合</h3>
      <ul className="list-disc list-inside mb-6">
        <li>裁判所、警察、その他の公的機関から法的義務に基づく要請があった場合</li>
      </ul>

      <h2 className="text-lg font-semibold mb-3">4. 国外移転について</h2>
      <p className="mb-6">
        当サービスでは、海外に設置されたサーバー（例：米国）でデータを保存・処理する場合があります。この場合、日本の個人情報保護法に基づき、適切な安全管理措置を講じます。
      </p>

      <h2 className="text-lg font-semibold mb-3">5. 国際的なデータ転送</h2>
      <p className="mb-6">
        本サービスでは、上記第三者サービスの利用により、ユーザーの個人情報が日本国外（主に米国）に転送されます。これらの国々は、日本と同等の個人情報保護水準を持たない場合がありますが、当社は適切な保護措置を講じた上で転送を行います。
      </p>

      <h2 className="text-lg font-semibold mb-3">6. 個人情報の保存期間</h2>
      
      <h3 className="text-md font-semibold mb-2">6.1 アカウント情報・学習データ</h3>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li><strong>保存期間</strong>: アカウント作成から3年間</li>
        <li><strong>削除</strong>: アカウント削除後30日以内に完全削除</li>
      </ul>

      <h3 className="text-md font-semibold mb-2">6.2 決済情報</h3>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li><strong>保存期間</strong>: 最終取引から7年間（法令要件）</li>
        <li><strong>削除</strong>: 期間満了後に順次削除</li>
      </ul>

      <h3 className="text-md font-semibold mb-2">6.3 アクセスログ・技術情報</h3>
      <ul className="list-disc list-inside mb-6 space-y-1">
        <li><strong>保存期間</strong>: 収集から1年間</li>
        <li><strong>削除</strong>: 期間満了後に自動削除</li>
      </ul>

      <h2 className="text-lg font-semibold mb-3">7. Cookieおよび類似技術</h2>
      
      <h3 className="text-md font-semibold mb-2">7.1 使用するCookie</h3>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li><strong>必須Cookie</strong>: セッション管理、ログイン状態の維持</li>
        <li><strong>分析Cookie</strong>: Google Analytics による利用状況分析</li>
        <li><strong>機能Cookie</strong>: ユーザー設定の保存、サービス改善</li>
      </ul>

      <h3 className="text-md font-semibold mb-2">7.2 Cookie の管理</h3>
      <p className="mb-6">
        ブラウザの設定によりCookieを無効にできますが、一部機能が制限される場合があります。
      </p>

      <h2 className="text-lg font-semibold mb-3">8. セキュリティ対策</h2>
      <p className="mb-3">当社は、個人情報の保護のため以下の技術的・組織的安全管理措置を講じています：</p>
      <ul className="list-disc list-inside mb-6 space-y-1">
        <li><strong>暗号化</strong>: HTTPS通信、データベース暗号化</li>
        <li><strong>アクセス制御</strong>: 最小権限の原則</li>
        <li><strong>監視</strong>: 不正アクセス検知、ログ監視</li>
      </ul>

      <h2 className="text-lg font-semibold mb-3">9. ユーザーの権利</h2>
      <p className="mb-3">ユーザーは、当社が保有する自己の個人情報について、以下の権利を有します：</p>
      
      <h3 className="text-md font-semibold mb-2">9.1 開示請求</h3>
      <p className="mb-3">保有する個人情報の利用目的、保存期間等の開示を求めることができます。</p>

      <h3 className="text-md font-semibold mb-2">9.2 訂正・削除請求</h3>
      <p className="mb-3">個人情報の訂正、追加、削除を求めることができます。</p>

      <h3 className="text-md font-semibold mb-2">9.3 利用停止請求</h3>
      <p className="mb-3">個人情報の利用停止、第三者提供の停止を求めることができます。</p>

      <h3 className="text-md font-semibold mb-2">9.4 データポータビリティ</h3>
      <p className="mb-3">アカウント削除時に、学習履歴データのダウンロードを要求できます。</p>

      <p className="mb-6">
        <strong>請求方法</strong>: 下記お問い合わせ先までご連絡ください。本人確認後、法令に従い対応いたします。
      </p>

      <h2 className="text-lg font-semibold mb-3">10. 18歳未満のユーザーについて</h2>
      <p className="mb-6">
        18歳未満の方が本サービスをご利用される場合は、保護者の同意が必要です。18歳未満の方の個人情報を故意に収集することはありませんが、そのような情報を認識した場合は速やかに削除いたします。
      </p>

      <h2 className="text-lg font-semibold mb-3">11. プライバシーポリシーの変更</h2>
      <p className="mb-6">
        当社は、法令の変更やサービスの改善等により、本プライバシーポリシーを変更する場合があります。重要な変更については、サービス内での通知またはメールにてお知らせいたします。
      </p>

      <h2 className="text-lg font-semibold mb-3">12. お問い合わせ</h2>
      <p className="mb-3">個人情報の取扱いに関するお問い合わせ、開示請求等については、以下までご連絡ください：</p>
      
      <div className="mb-6 border-t pt-4">
        <p><strong>株式会社ビズモア</strong></p>
        <p><strong>所在地</strong>: 〒160-0022 東京都新宿区新宿1-36-2新宿第七葉山ビル3階</p>
        <p><strong>メール</strong>: contact@ai-english-chat.com</p>
        <p><strong>件名</strong>: 【プライバシーポリシーに関するお問い合わせ】</p>
        <p><strong>受付時間</strong>: 平日 10:00〜18:00（土日祝日除く）</p>
      </div>

      <h2 className="text-lg font-semibold mb-3">附則</h2>
      <p className="mb-4">本プライバシーポリシーは2025年8月10日より施行します。</p>
      <p>最終更新日：2025年8月10日</p>
    </div>
  );
}