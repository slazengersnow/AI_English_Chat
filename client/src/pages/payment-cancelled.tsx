import { useLocation } from 'wouter'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PaymentCancelled() {
  const [, setLocation] = useLocation()

  const handleGoHome = () => {
    setLocation('/')
  }

  const handleRetryPayment = () => {
    setLocation('/subscription/select')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-800">
            決済がキャンセルされました
          </CardTitle>
          <CardDescription className="text-red-700">
            決済処理が中断されました
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h3 className="font-semibold mb-2 text-red-800">
              キャンセルの理由
            </h3>
            <ul className="text-sm text-red-700 space-y-1 text-left">
              <li>• 決済情報の入力が完了していない</li>
              <li>• ページを閉じた、または戻るボタンを押した</li>
              <li>• 通信エラーが発生した</li>
              <li>• その他の技術的な問題</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-800">
              プレミアムプランの特典
            </h3>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>• 7日間無料トライアル</li>
              <li>• 無制限の問題練習</li>
              <li>• カスタムシナリオ作成</li>
              <li>• 詳細な学習分析</li>
              <li>• 復習機能</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRetryPayment}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              もう一度決済する
            </Button>
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ホームに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}