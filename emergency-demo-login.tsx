import React, { useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '../client/src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../client/src/components/ui/card'
import { AlertTriangle, TestTube } from 'lucide-react'

export default function EmergencyDemoLogin() {
  const [, setLocation] = useLocation()

  const handleEmergencyDemo = () => {
    console.log('Emergency demo mode activated')
    
    // 直接ローカルストレージにデモモードを設定
    localStorage.setItem('demoMode', 'true')
    
    // 即座にホームページにリダイレクト
    setLocation('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <CardTitle className="text-2xl">AI瞬間英作文チャット</CardTitle>
          <CardDescription>
            緊急アクセスモード
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* 緊急デモモード - 単独表示 */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
              <h3 className="font-bold text-red-800 text-lg">緊急アクセス</h3>
            </div>
            <p className="text-sm text-red-700 mb-4">
              認証システムの問題により、デモモードで即座にアプリにアクセスできます。
            </p>
            <Button
              onClick={handleEmergencyDemo}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 text-lg shadow-lg"
            >
              <TestTube className="w-5 h-5 mr-2" />
              🚨 緊急デモモード開始
            </Button>
            <p className="text-xs text-center text-red-600 mt-3 font-medium">
              認証を完全にバイパスしてアプリを体験
            </p>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              このモードは技術的問題の解決までの一時的な措置です
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}