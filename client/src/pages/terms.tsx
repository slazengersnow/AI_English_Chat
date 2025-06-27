import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              AI英作文チャット 利用規約およびプライバシーポリシー
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-6">
              本規約は、ユーザーの皆さま（以下「ユーザー」といいます）が、当サービス「AI英作文チャット」（以下「本サービス」といいます）をご利用いただくにあたっての条件を定めるものです。ご利用に際しては、以下の内容をご確認のうえ、同意いただく必要があります。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">第1条（サービスの概要）</h2>
            <p className="text-gray-700 mb-6">
              本サービスは、生成AIを用いて英作文トレーニングを行うWebアプリケーションです。一定の機能は無料でご利用いただけますが、月額・年額の有料プランをご契約いただくことで、追加の機能やコンテンツをご利用いただけます。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">第2条（ご利用にあたっての注意事項）</h2>
            <div className="text-gray-700 mb-6">
              <ol className="list-decimal list-inside space-y-2">
                <li>本サービスは、通信環境や機器の状況によって正常に動作しない場合があります。通信費用はユーザーのご負担となります。</li>
                <li>メンテナンスやシステムトラブル等により、本サービスの一部または全部を予告なく停止する場合があります。</li>
                <li>本サービスの提供の中断、停止、エラー、データの損失等によってユーザーに生じた損害について、当社は一切の責任を負いません。</li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">第3条（料金・プラン・支払い）</h2>
            <div className="text-gray-700 mb-6">
              <ol className="list-decimal list-inside space-y-2">
                <li>本サービスの利用料金は、表示された内容に従ってお支払いいただきます。</li>
                <li>料金プランは予告なく変更される場合がありますが、既存のユーザーには原則として事前に通知いたします。</li>
                <li>トライアル期間終了後は、自動的に「スタンダードプラン（月額）」へ移行し、決済が開始されます。</li>
                <li>年額プランをご契約いただいた場合、期間満了後は自動的に契約が更新され、同一料金で継続されます。</li>
                <li>年額プランにおいて、途中解約やサービス停止が発生した場合でも、返金等の対応は行いません。</li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">第4条（メール・通知）</h2>
            <div className="text-gray-700 mb-6">
              <ol className="list-decimal list-inside space-y-2">
                <li>ユーザーがご登録いただいたメールアドレスには、サービスに関するお知らせや改善のご案内、利用状況のサマリー、関連サービスのご紹介などをお送りする場合があります。</li>
                <li>ご案内メールはいつでも配信停止が可能です。</li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">第5条（アカウント管理）</h2>
            <div className="text-gray-700 mb-6">
              <ol className="list-decimal list-inside space-y-2">
                <li>本サービスを利用するには、メールアドレス・パスワードによるアカウント登録が必要です。</li>
                <li>アカウント情報はご本人が責任を持って管理してください。第三者への貸与や共有は禁止とします。</li>
                <li>ユーザーが本規約に違反した場合、アカウントを停止または削除することがあります。</li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">第6条（禁止事項）</h2>
            <p className="text-gray-700 mb-4">以下に該当する行為は禁止します：</p>
            <div className="text-gray-700 mb-6">
              <ul className="list-disc list-inside space-y-2">
                <li>他人の個人情報を無断で使用する行為</li>
                <li>サービスのリバースエンジニアリングや不正アクセス</li>
                <li>商用利用や無断転載・再配布</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">第7条（知的財産権）</h2>
            <p className="text-gray-700 mb-6">
              本サービス内で提供されるすべてのテキスト・画像・AIによる出力等のコンテンツの著作権は、当社または提供元に帰属します。無断利用は禁じます。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">第8条（プライバシーの取扱い）</h2>
            <div className="text-gray-700 mb-6">
              <ol className="list-decimal list-inside space-y-2">
                <li>ユーザーの個人情報（メールアドレスなど）は、サービス提供・改善・通知のためにのみ利用します。</li>
                <li>個人情報は法令に従って安全に管理し、第三者に提供することはありません（法令に基づく場合を除く）。</li>
                <li>サービス利用の統計的分析や改善のため、匿名化された情報を活用する場合があります。</li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">第9条（免責事項）</h2>
            <div className="text-gray-700 mb-6">
              <ol className="list-decimal list-inside space-y-2">
                <li>本サービスは現状有姿で提供されるものであり、その正確性、完全性、有用性について保証いたしません。</li>
                <li>本サービスの利用により生じた損害（精神的損害・機会損失・逸失利益等）について、当社は一切の責任を負いません。</li>
                <li>ユーザー同士または第三者との間で紛争が発生した場合でも、当社は責任を負いません。</li>
              </ol>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">第10条（規約の変更）</h2>
            <p className="text-gray-700 mb-6">
              本規約は予告なく変更される場合があります。変更後の内容はサービス上に掲示された時点で効力を持つものとし、引き続きサービスをご利用いただく場合には、変更後の規約に同意したものとみなします。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">第11条（準拠法および管轄裁判所）</h2>
            <p className="text-gray-700 mb-6">
              本規約の解釈および適用については日本法を準拠法とし、本サービスに関するすべての紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">附則</h2>
            <p className="text-gray-700 mb-6">
              本規約は2025年6月27日より施行します。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}