import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, AlertCircle, CreditCard } from 'lucide-react'

export default function StripeTest() {
  const { toast } = useToast()
  const [priceId, setPriceId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])

  const addResult = (step: string, success: boolean, message: string, details?: any) => {
    setTestResults(prev => [...prev, {
      step,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    }])
  }

  const testCreateCheckoutSession = async () => {
    if (!priceId.trim()) {
      toast({
        title: "エラー",
        description: "価格IDを入力してください",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setTestResults([])

    try {
      addResult('セッション作成開始', true, `価格ID: ${priceId}`)

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        addResult('セッション作成', false, `エラー: ${data.message}`, data)
        throw new Error(data.message)
      }

      addResult('セッション作成', true, 'セッションが正常に作成されました', data)

      if (data.url) {
        addResult('リダイレクト', true, 'Stripeチェックアウトページへリダイレクト中...')
        
        toast({
          title: "成功",
          description: "Stripeチェックアウトページを開きます",
        })

        // Open in new tab to avoid losing the test page
        window.open(data.url, '_blank')
      } else {
        addResult('リダイレクト', false, 'チェックアウトURLが見つかりません')
      }

    } catch (error) {
      console.error('Stripe test error:', error)
      addResult('エラー', false, `テストエラー: ${error.message}`)
      
      toast({
        title: "テスト失敗",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testPriceIds = [
    'price_1OXXXXXXXXXXXXXXXXXXXXXX', // 実際のStripe価格ID例
    'prod_SZgm74ZfQCQMSP', // 現在のプレミアム月額
    'prod_SZgeMcEAMDMlDe', // 現在のスタンダード月額
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <CreditCard className="w-6 h-6" />
            Stripe決済テスト
          </CardTitle>
          <CardDescription>
            実際のStripe価格IDを使用してチェックアウトセッションの作成をテストします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="priceId">Stripe価格ID</Label>
              <Input
                id="priceId"
                placeholder="price_1OXXXXXXXXXXXXXXXXXXXXXX または prod_XXXXXXXXXXXXXXX"
                value={priceId}
                onChange={(e) => setPriceId(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">テスト用価格ID例:</h3>
              <div className="space-y-2">
                {testPriceIds.map((id, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPriceId(id)}
                      className="text-xs"
                    >
                      使用
                    </Button>
                    <code className="text-xs bg-white px-2 py-1 rounded">{id}</code>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={testCreateCheckoutSession}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "テスト中..." : "チェックアウトセッションをテスト"}
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">テスト結果:</h3>
              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.step}</div>
                      <div className="text-sm text-gray-600 whitespace-pre-line">{result.message}</div>
                      {result.details && (
                        <div className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                          <pre>{JSON.stringify(result.details, null, 2)}</pre>
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">テスト情報</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 実際のStripe価格IDを使用してテストします</li>
              <li>• 7日間の無料トライアル期間が設定されます</li>
              <li>• 成功した場合、新しいタブでチェックアウトページが開きます</li>
              <li>• 価格IDは Stripe ダッシュボードから確認できます</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">価格ID取得方法</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Stripeダッシュボード → 商品 → 価格</li>
              <li>2. 価格IDをコピー（price_xxx または prod_xxx）</li>
              <li>3. 上記のフォームに貼り付けてテスト</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}