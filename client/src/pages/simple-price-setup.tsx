import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Save, RefreshCw, Settings, Copy, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PlanPriceConfig {
  id: string
  name: string
  displayPrice: string
  description: string
  currentPriceId: string
  newPriceId: string
  verified: boolean
  verificationResult?: any
}

export default function SimplePriceSetup() {
  const [plans, setPlans] = useState<PlanPriceConfig[]>([
    {
      id: 'standard_monthly',
      name: 'スタンダード月額',
      displayPrice: '¥980',
      description: '1日50問まで、基本練習機能',
      currentPriceId: '',
      newPriceId: '',
      verified: false
    },
    {
      id: 'standard_yearly',
      name: 'スタンダード年間',
      displayPrice: '¥9,800',
      description: '1日50問まで、基本練習機能（2ヶ月分お得）',
      currentPriceId: '',
      newPriceId: '',
      verified: false
    },
    {
      id: 'premium_monthly',
      name: 'プレミアム月額',
      displayPrice: '¥1,300',
      description: '1日100問まで、カスタムシナリオ・復習機能',
      currentPriceId: '',
      newPriceId: '',
      verified: false
    },
    {
      id: 'premium_yearly',
      name: 'プレミアム年間',
      displayPrice: '¥13,000',
      description: '1日100問まで、全機能（2ヶ月分お得）',
      currentPriceId: '',
      newPriceId: '',
      verified: false
    }
  ])

  const [isUpdating, setIsUpdating] = useState(false)
  const [availablePrices, setAvailablePrices] = useState<any[]>([])
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const { toast } = useToast()

  // Load current configuration
  useEffect(() => {
    const loadCurrentConfig = async () => {
      try {
        const response = await fetch('/api/subscription-plans')
        const data = await response.json()
        
        setPlans(prev => prev.map(plan => ({
          ...plan,
          currentPriceId: data[plan.id]?.priceId || '',
          newPriceId: data[plan.id]?.priceId || ''
        })))
      } catch (error) {
        console.error('Failed to load current config:', error)
      }
    }
    
    loadCurrentConfig()
  }, [])

  const verifyPriceId = async (planId: string, priceId: string) => {
    if (!priceId.trim()) return

    try {
      const response = await fetch('/api/stripe/price-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceId.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setPlans(prev => prev.map(plan => 
          plan.id === planId 
            ? { ...plan, verified: true, verificationResult: data }
            : plan
        ))
        toast({
          title: "価格ID確認完了",
          description: `${data.unit_amount} ${data.currency.toUpperCase()} として確認されました`
        })
      } else {
        setPlans(prev => prev.map(plan => 
          plan.id === planId 
            ? { ...plan, verified: false, verificationResult: null }
            : plan
        ))
        toast({
          title: "価格ID確認失敗",
          description: data.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Price verification error:', error)
      toast({
        title: "エラー",
        description: "価格IDの確認に失敗しました",
        variant: "destructive"
      })
    }
  }

  const updatePriceId = (planId: string, newPriceId: string) => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId 
        ? { ...plan, newPriceId, verified: false, verificationResult: null }
        : plan
    ))
  }

  const fetchAvailablePrices = async () => {
    setIsLoadingPrices(true)
    try {
      const response = await fetch('/api/stripe/prices')
      const data = await response.json()
      
      if (response.ok) {
        setAvailablePrices(data.prices || [])
        toast({
          title: "価格一覧取得完了",
          description: `${data.prices?.length || 0}件の価格が取得されました`
        })
      } else {
        toast({
          title: "エラー",
          description: data.message || "価格一覧の取得に失敗しました",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error)
      toast({
        title: "エラー",
        description: "価格一覧の取得に失敗しました",
        variant: "destructive"
      })
    } finally {
      setIsLoadingPrices(false)
    }
  }

  const assignPriceId = (planId: string, priceId: string) => {
    updatePriceId(planId, priceId)
    toast({
      title: "価格ID割り当て完了",
      description: `${priceId} を割り当てました`
    })
  }

  const saveConfiguration = async () => {
    setIsUpdating(true)
    
    try {
      const configData = plans.reduce((acc, plan) => {
        if (plan.newPriceId.trim()) {
          acc[plan.id] = plan.newPriceId.trim()
        }
        return acc
      }, {} as Record<string, string>)

      const response = await fetch('/api/save-price-configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceIds: configData })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "設定保存完了",
          description: "価格ID設定が保存されました。新しい設定でプラン選択ページが更新されます。"
        })
        
        // Update current price IDs
        setPlans(prev => prev.map(plan => ({
          ...plan,
          currentPriceId: plan.newPriceId || plan.currentPriceId
        })))
      } else {
        toast({
          title: "保存エラー",
          description: result.message || "設定の保存に失敗しました",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Save configuration error:', error)
      toast({
        title: "エラー",
        description: "設定の保存に失敗しました",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "コピーしました",
      description: "価格IDをクリップボードにコピーしました"
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">価格ID設定</h1>
          <p className="text-gray-600">各プランの価格IDを設定してください</p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>重要:</strong> 価格IDは「price_」で始まるIDを使用してください。「prod_」で始まるProduct IDは使用できません。
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 mb-8">
          {plans.map((plan) => (
            <Card key={plan.id} className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="text-sm text-gray-600 font-normal">{plan.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg font-semibold">
                    {plan.displayPrice}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`current-${plan.id}`} className="text-sm font-medium">
                      現在の価格ID
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id={`current-${plan.id}`}
                        value={plan.currentPriceId}
                        readOnly
                        className="bg-gray-50"
                        placeholder="未設定"
                      />
                      {plan.currentPriceId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(plan.currentPriceId)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`new-${plan.id}`} className="text-sm font-medium">
                      新しい価格ID
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id={`new-${plan.id}`}
                        value={plan.newPriceId}
                        onChange={(e) => updatePriceId(plan.id, e.target.value)}
                        placeholder="price_xxxxxxxxxxxxxxxx"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyPriceId(plan.id, plan.newPriceId)}
                        disabled={!plan.newPriceId.trim()}
                      >
                        確認
                      </Button>
                    </div>
                  </div>
                </div>

                {plan.verified && plan.verificationResult && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>確認完了:</strong> {plan.verificationResult.unit_amount} {plan.verificationResult.currency.toUpperCase()}
                      {plan.verificationResult.recurring?.interval && ` / ${plan.verificationResult.recurring.interval}`}
                    </AlertDescription>
                  </Alert>
                )}

                {plan.newPriceId && !plan.verified && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      価格IDを確認してください
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button
            onClick={fetchAvailablePrices}
            disabled={isLoadingPrices}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isLoadingPrices ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                取得中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Stripe価格一覧を取得
              </>
            )}
          </Button>
          
          <Button
            onClick={saveConfiguration}
            disabled={isUpdating || !plans.some(p => p.newPriceId.trim())}
            className="w-full sm:w-auto"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                設定を保存
              </>
            )}
          </Button>
        </div>

        {availablePrices.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>利用可能な価格ID一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availablePrices.map((price) => (
                  <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-mono text-sm">{price.id}</div>
                      <div className="text-sm text-gray-600">
                        {price.unit_amount} {price.currency.toUpperCase()}
                        {price.recurring?.interval && ` / ${price.recurring.interval}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(price.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <select
                        className="px-2 py-1 text-sm border rounded"
                        onChange={(e) => e.target.value && assignPriceId(e.target.value, price.id)}
                        value=""
                      >
                        <option value="">割り当て</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            設定完了後、
            <a href="/subscription-select" className="text-blue-600 hover:underline mx-1">
              プラン選択ページ
            </a>
            で新しい価格設定を確認できます。
          </p>
        </div>
      </div>
    </div>
  )
}