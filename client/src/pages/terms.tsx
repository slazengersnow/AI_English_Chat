import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/signup')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">利用規約</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">第1条（適用）</h2>
              <p className="text-gray-700 leading-relaxed">
                本規約は、AI瞬間英作文チャット（以下「本サービス」）の利用に関して、本サービス運営者（以下「当社」）と本サービスを利用するユーザー（以下「ユーザー」）との間の権利義務関係を定めることを目的とし、ユーザーと当社との間で適用されます。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">第2条（利用登録）</h2>
              <p className="text-gray-700 leading-relaxed">
                1. 本サービスの利用登録を希望する者（以下「登録希望者」）は、本規約に同意の上、当社の定める方法によって利用登録を申請するものとします。<br/>
                2. 当社は、登録希望者が以下の事由に該当する場合、利用登録を承認しないことがあります。<br/>
                ・虚偽の情報を申告した場合<br/>
                ・本規約に違反したことがある者からの申請である場合<br/>
                ・その他当社が利用登録を相当でないと判断した場合
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">第3条（ユーザーIDおよびパスワードの管理）</h2>
              <p className="text-gray-700 leading-relaxed">
                1. ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを管理するものとします。<br/>
                2. ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与することはできません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">第4条（料金および支払方法）</h2>
              <p className="text-gray-700 leading-relaxed">
                1. ユーザーは、本サービスの有料部分の対価として、当社が別途定める利用料金を、当社が指定する方法により支払うものとします。<br/>
                2. ユーザーが利用料金の支払を遅滞した場合、当社は本サービスの提供を停止することができます。<br/>
                3. トライアル期間終了後は、自動的に「プレミアムプラン（月額）」へ移行し、決済が開始されます。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">第5条（禁止事項）</h2>
              <p className="text-gray-700 leading-relaxed">
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。<br/>
                ・法令または公序良俗に違反する行為<br/>
                ・犯罪行為に関連する行為<br/>
                ・本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為<br/>
                ・当社または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為<br/>
                ・その他、当社が不適切と判断する行為
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">第6条（本サービスの提供の停止等）</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。<br/>
                ・本サービスにかかるコンピューターシステムの保守点検または更新を行う場合<br/>
                ・地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合<br/>
                ・その他、当社が本サービスの提供が困難と判断した場合
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">第7条（利用制限および登録抹消）</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。<br/>
                ・本規約のいずれかの条項に違反した場合<br/>
                ・登録事項に虚偽の事実があることが判明した場合<br/>
                ・その他、当社が本サービスの利用を適当でないと判断した場合
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">第8条（免責事項）</h2>
              <p className="text-gray-700 leading-relaxed">
                当社の債務不履行責任は、当社の故意または重過失によらない場合には免責されるものとします。<br/>
                当社は、何らかの理由によって責任を負う場合にも、通常生ずべき損害の範囲内かつ有料サービスにおいては代金額（継続的サービスの場合には1か月分相当額）の範囲内においてのみ賠償の責任を負うものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">第9条（規約の変更）</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">第10条（準拠法・裁判管轄）</h2>
              <p className="text-gray-700 leading-relaxed">
                本規約の解釈にあたっては、日本法を準拠法とします。<br/>
                本サービスに関して紛争が生じた場合には、東京地方裁判所を専属的合意管轄とします。
              </p>
            </section>

            <div className="pt-6 border-t">
              <p className="text-sm text-gray-600">
                制定日：2025年6月29日<br/>
                最終更新日：2025年6月29日
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}