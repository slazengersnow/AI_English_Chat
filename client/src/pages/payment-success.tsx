import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function PaymentSuccess() {
  const [, setLocation] = useLocation()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [subscriptionCreated, setSubscriptionCreated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    console.log('PaymentSuccess component mounted')
    console.log('Current URL:', window.location.href)
    console.log('Search params:', window.location.search)
    
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')
    console.log('Extracted session ID:', sessionId)
    
    setSessionId(sessionId)
  }, [])

  const createSubscription = async () => {
    if (!sessionId) {
      toast({
        title: "エラー",
        description: "セッションIDが見つかりません",
        variant: "destructive"
      })
      return
    }

    setIsCreatingSubscription(true)
    
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          priceId: 'price_1ReXHSHridtc6DvMOjCbo2VK' // Standard monthly - will be determined by session
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSubscriptionCreated(true)
        toast({
          title: "サブスクリプション作成完了",
          description: `${data.subscriptionType} プランが有効になりました`,
          duration: 3000
        })
      } else {
        toast({
          title: "エラー",
          description: data.message || "サブスクリプションの作成に失敗しました",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Subscription creation error:', error)
      toast({
        title: "エラー",
        description: "サブスクリプションの作成中にエラーが発生しました",
        variant: "destructive"
      })
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  const handleGoHome = () => {
    setLocation('/')
  }

  const handleGoToApp = () => {
    if (!subscriptionCreated) {
      createSubscription()
    } else {
      setLocation('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            決済完了
          </CardTitle>
          <CardDescription className="text-green-700">
            プレミアムプランへの登録が完了しました
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold mb-2 text-green-800">
              プレミアムプランの特典
            </h3>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• 無制限の問題練習</li>
              <li>• カスタムシナリオ作成</li>
              <li>• 詳細な学習分析</li>
              <li>• 復習機能</li>
              <li>• 優先サポート</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-800">
              7日間無料トライアル
            </h3>
            <p className="text-sm text-blue-700">
              今すぐ全ての機能をお試しいただけます。
              トライアル期間中はいつでもキャンセル可能です。
            </p>
          </div>

          {sessionId && (
            <div className="text-xs text-gray-500 font-mono">
              セッションID: {sessionId}
            </div>
          )}

          <div className="space-y-3">
            {!subscriptionCreated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 mb-2">
                  サブスクリプションの設定を完了してください
                </p>
                <Button 
                  onClick={createSubscription}
                  disabled={isCreatingSubscription}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {isCreatingSubscription ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      設定中...
                    </>
                  ) : (
                    'サブスクリプションを設定'
                  )}
                </Button>
              </div>
            )}
            
            <Button 
              onClick={handleGoToApp}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!subscriptionCreated}
            >
              {subscriptionCreated ? '学習を開始する' : 'サブスクリプション設定後に利用可能'}
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