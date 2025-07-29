"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Privacy;
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const wouter_1 = require("wouter");
function Privacy() {
    const [, setLocation] = (0, wouter_1.useLocation)();
    return (<div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button_1.Button variant="ghost" onClick={() => setLocation('/signup')} className="mb-4">
            <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2"/>
            戻る
          </button_1.Button>
        </div>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-2xl">プライバシーポリシー</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">個人情報の取得</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、AI瞬間英作文チャット（以下「本サービス」）を提供するにあたり、ユーザーから以下の個人情報を取得いたします。<br />
                ・メールアドレス<br />
                ・パスワード（暗号化して保存）<br />
                ・学習履歴および進捗データ<br />
                ・お支払い情報（Stripe経由で処理、当社は直接保存しません）<br />
                ・サービス利用に関するログ情報
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">個人情報の利用目的</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、取得した個人情報を以下の目的で利用いたします。<br />
                ・本サービスの提供・運営のため<br />
                ・ユーザーからのお問い合わせに回答するため<br />
                ・ユーザーに本サービスに関する通知を送付するため<br />
                ・本サービスの品質向上・改善のため<br />
                ・利用料金の決済のため<br />
                ・サービスの利用状況を分析し、利便性向上のための統計情報を取得するため（Firebase Analytics 等）<br />
                ・上記の利用目的に付随する目的
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">個人情報の第三者提供</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。<br />
                ・法令に基づく場合<br />
                ・人の生命、身体または財産の保護のために必要がある場合<br />
                ・公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合<br />
                ・国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">個人情報の委託</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、利用目的の達成に必要な範囲において、個人情報の取扱いの全部または一部を第三者に委託することがあります。この場合、当社は、委託先との間で個人情報の取扱いに関する契約を締結し、委託先に対して適切な監督を行います。<br />
                主な委託先：<br />
                ・Stripe（決済処理）<br />
                ・Supabase（認証・データベース）<br />
                ・Anthropic（AI機能）<br />
                ・Firebase（分析・通知・認証など）<br />
                ・Vercel（アプリケーションのホスティング・アクセスログ管理）
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">個人情報の開示</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。<br />
                ・本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合<br />
                ・当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合<br />
                ・その他法令に違反することとなる場合
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">個人情報の訂正および削除</h2>
              <p className="text-gray-700 leading-relaxed">
                ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下「訂正等」）を請求することができます。<br />
                当社は、ユーザーから前項の請求を受けてその請求に理由があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">個人情報の利用停止等</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」）を求められた場合には、遅滞なく必要な調査を行います。<br />
                前項の調査結果に基づき、その請求に理由があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">プライバシーポリシーの変更</h2>
              <p className="text-gray-700 leading-relaxed">
                本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。<br />
                当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">お問い合わせ窓口</h2>
              <p className="text-gray-700 leading-relaxed">
                本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。<br />
                AI瞬間英作文チャット サポート窓口<br />
                メールアドレス：support@ai-english-chat.com
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">Cookie（クッキー）について</h2>
              <p className="text-gray-700 leading-relaxed">
                本サービスは、ユーザーの利便性向上のためにCookieを使用しています。Cookieは、ユーザーのブラウザに保存される小さなテキストファイルです。<br />
                Cookieを無効にした場合、本サービスの一部機能が正常に動作しない可能性があります。<br />
                Cookieの設定は、お使いのブラウザの設定から変更することができます。<br />
                <br />
                また、当社はサービスの改善および利用状況の把握を目的として、Google Analyticsなどの第三者のアクセス解析ツールを使用することがあります。<br />
                これらのツールは、匿名のアクセス情報を収集するためにCookieを使用しています。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">準拠法および管轄裁判所</h2>
              <p className="text-gray-700 leading-relaxed">
                本ポリシーの解釈・適用については、日本法を準拠法とし、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>

            <div className="pt-6 border-t">
              <p className="text-sm text-gray-600">
                制定日：2025年6月29日<br />
                最終更新日：2025年6月29日
              </p>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
