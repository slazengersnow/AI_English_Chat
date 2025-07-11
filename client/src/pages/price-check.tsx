import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, DollarSign } from 'lucide-react'

export default function PriceCheck() {
  const [priceData, setPriceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkPriceDetails = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/stripe-prices')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch price data')
      }
      
      setPriceData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (unitAmount: number | null, currency: string) => {
    if (!unitAmount) return '無料'
    
    // JPY currency doesn't use decimal places in Stripe
    if (currency === 'jpy') {
      return `¥${unitAmount.toLocaleString()}`
    }
    
    // Other currencies use cents/smallest unit
    return `${(unitAmount / 100).toFixed(2)} ${currency.toUpperCase()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <DollarSign className="w-6 h-6" />
            Stripe価格設定確認
          </CardTitle>
          <CardDescription>
            現在のStripeアカウントの価格設定を確認し、正しい金額が設定されているかチェックします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Button 
              onClick={checkPriceDetails}
              disabled={isLoading}
              className="w-full max-w-md"
            >
              {isLoading ? "確認中..." : "価格設定を確認"}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">エラー</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {priceData && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  アカウント情報
                </h3>
                <div className="text-sm text-blue-700">
                  <p>環境: <span className="font-mono">{priceData.account_type}</span></p>
                  <p>価格数: {priceData.total_prices}個</p>
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold">価格一覧</h3>
                </div>
                <div className="max-h-96 overflow-auto">
                  {priceData.prices.map((price: any, index: number) => (
                    <div key={index} className="border-b last:border-b-0 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {price.id}
                            </code>
                            <span className={`text-xs px-2 py-1 rounded ${
                              price.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {price.active ? '有効' : '無効'}
                            </span>
                          </div>
                          
                          <div className="text-lg font-semibold text-gray-900">
                            {formatPrice(price.unit_amount, price.currency)}
                          </div>
                          
                          {price.recurring && (
                            <div className="text-sm text-gray-600 mt-1">
                              請求間隔: {price.recurring.interval}
                              {price.recurring.interval_count > 1 && 
                                ` (${price.recurring.interval_count}${price.recurring.interval}毎)`
                              }
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mt-2">
                            商品ID: {price.product}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {price.type === 'recurring' ? '定期' : '一回'}
                          </div>
                          {price.id === 'price_1ReXPnHridtc6DvMQaW7NC6w' && (
                            <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1">
                              使用中
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">価格設定の注意点</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• JPY通貨の場合、Stripeは円単位で価格を保存します</li>
                  <li>• ¥1,300の場合、unit_amountは「1300」である必要があります</li>
                  <li>• 現在「13000」になっている場合、¥13,000として表示されます</li>
                  <li>• 価格を修正するには、Stripeダッシュボードで新しい価格を作成する必要があります</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}