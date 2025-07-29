"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SimulationSelection;
const react_query_1 = require("@tanstack/react-query");
const wouter_1 = require("wouter");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const premium_gate_1 = require("@/components/premium-gate");
function SimulationSelection() {
    return (<premium_gate_1.PremiumGate feature="シミュレーション練習">
      <SimulationSelectionContent />
    </premium_gate_1.PremiumGate>);
}
function SimulationSelectionContent() {
    const { data: customScenarios = [] } = (0, react_query_1.useQuery)({
        queryKey: ["/api/custom-scenarios"],
    });
    return (<div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <wouter_1.Link href="/">
            <button_1.Button variant="ghost" size="sm">
              <lucide_react_1.ArrowLeft className="w-4 h-4"/>
            </button_1.Button>
          </wouter_1.Link>
          <div className="flex items-center gap-2">
            <lucide_react_1.Users className="w-6 h-6 text-blue-600"/>
            <h1 className="text-2xl font-bold">シミュレーション練習</h1>
          </div>
        </div>

        {/* Description */}
        <card_1.Card className="mb-6">
          <card_1.CardHeader>
            <card_1.CardTitle>シミュレーション練習について</card_1.CardTitle>
            <card_1.CardDescription>
              実際の場面を想定した英作文練習ができます。あなたが作成したカスタムシナリオを選んで、実践的な英語表現を身につけましょう。
            </card_1.CardDescription>
          </card_1.CardHeader>
        </card_1.Card>

        {/* Custom Scenarios */}
        {customScenarios.length > 0 ? (<div className="space-y-4">
            <h2 className="text-lg font-semibold">作成済みシミュレーション</h2>
            <div className="grid gap-4">
              {customScenarios.map((scenario) => (<card_1.Card key={scenario.id} className="hover:shadow-md transition-shadow">
                  <card_1.CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <card_1.CardTitle className="text-lg">{scenario.title}</card_1.CardTitle>
                        <card_1.CardDescription className="mt-2">
                          {scenario.description}
                        </card_1.CardDescription>
                      </div>
                      <badge_1.Badge variant="secondary" className="ml-4">
                        カスタム
                      </badge_1.Badge>
                    </div>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        作成日: {new Date(scenario.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                      <wouter_1.Link href={`/simulation/${scenario.id}`}>
                        <button_1.Button>
                          <lucide_react_1.Play className="w-4 h-4 mr-2"/>
                          練習開始
                        </button_1.Button>
                      </wouter_1.Link>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>))}
            </div>
          </div>) : (<card_1.Card>
            <card_1.CardContent className="text-center py-12">
              <lucide_react_1.Users className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
              <h3 className="text-lg font-medium mb-2">シミュレーションがありません</h3>
              <p className="text-muted-foreground mb-4">
                まずはマイページでオリジナルのシミュレーションを作成しましょう
              </p>
              <wouter_1.Link href="/my-page">
                <button_1.Button>
                  <lucide_react_1.Plus className="w-4 h-4 mr-2"/>
                  シミュレーションを作成
                </button_1.Button>
              </wouter_1.Link>
            </card_1.CardContent>
          </card_1.Card>)}

        {/* Create New Simulation */}
        {customScenarios.length > 0 && (<card_1.Card className="mt-6">
            <card_1.CardContent className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">新しいシミュレーションを作成</h3>
              <p className="text-muted-foreground mb-4">
                マイページでオリジナルのシナリオを追加できます
              </p>
              <wouter_1.Link href="/my-page">
                <button_1.Button variant="outline">
                  <lucide_react_1.Plus className="w-4 h-4 mr-2"/>
                  マイページへ移動
                </button_1.Button>
              </wouter_1.Link>
            </card_1.CardContent>
          </card_1.Card>)}
      </div>
    </div>);
}
