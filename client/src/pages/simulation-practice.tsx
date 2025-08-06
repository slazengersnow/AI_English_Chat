import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function SimulationPracticePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              シミュレーション練習
            </h1>
            <p className="text-gray-600 mt-1">
              実際のシーンを想定した英作文練習
            </p>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            シミュレーション機能
          </h2>
          <p className="text-gray-500">この機能は現在開発中です。</p>
        </div>
      </div>
    </div>
  );
}
