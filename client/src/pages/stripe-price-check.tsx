import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function StripePriceCheck() {
  const [priceId, setPriceId] = useState('')
  const [priceInfo, setPriceInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const checkPrice = async () => {
    if (!priceId.trim()) {
      setError('価格IDを入力してください')
      return
    }

    setLoading(true)
    setError(null)
    setPriceInfo(null)

    try {
      const response = await fetch('/api/stripe/price-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: priceId.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch price info')
      }

      setPriceInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "コピーしました",
      description: "価格IDをクリップボードにコピーしました"
    })
  }

  // 推奨価格ID設定
  const recommendedPrices = [
    { name: "スタンダード月額", amount: 980, currency: "jpy" },
    { name: "スタンダード年額", amount: 9800, currency: "jpy" },
    { name: "プレミアム月額", amount: 1300, currency: "jpy" },
    { name: "プレミアム年額", amount: 13000, currency: "jpy" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Stripe価格ID確認ツール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="priceId">価格ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="priceId"
                    placeholder="price_1ReXPnHridtc6DvMQaW7NC6w"
                    value={priceId}
                    onChange={(e) => setPriceId(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={checkPrice}
                    disabled={loading}
                  >
                    {loading ? "確認中..." : "確認"}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {priceInfo && (
                <Alert className="border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700">
                    <div className="space-y-2">
                      <div className="font-semibold">価格情報:</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>価格ID: {priceInfo.id}</div>
                        <div>料金: {formatPrice(priceInfo.unit_amount, priceInfo.currency)}</div>
                        <div>通貨: {priceInfo.currency.toUpperCase()}</div>
                        <div>タイプ: {priceInfo.type}</div>
                        <div>商品ID: {priceInfo.product}</div>
                        <div>アクティブ: {priceInfo.active ? 'Yes' : 'No'}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(priceInfo.id)}
                        className="mt-2"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        価格IDをコピー
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>推奨価格設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                以下の料金でStripeの価格IDを作成してください：
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedPrices.map((price, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="font-semibold text-lg">{price.name}</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(price.amount, price.currency)}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Stripe設定: {price.amount} {price.currency.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="font-semibold text-yellow-800 mb-2">重要な注意事項:</div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 日本円の場合、Stripeでは最小単位（円）で設定します</li>
                  <li>• ¥1,300の場合、Stripeでは 1300 と入力</li>
                  <li>• ¥13,000の場合、Stripeでは 13000 と入力</li>
                  <li>• 価格IDは "price_" で始まる文字列です</li>
                  <li>• 商品IDは "prod_" で始まる文字列です</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}