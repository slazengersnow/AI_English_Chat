// ブラウザ接続診断
console.log('=== ブラウザ接続診断開始 ===');

// 1. サーバーレスポンス確認
const testServerResponse = async () => {
  try {
    const response = await fetch('http://localhost:5000/');
    console.log('サーバーレスポンス:', response.status);
    const text = await response.text();
    console.log('HTML長さ:', text.length);
    console.log('デモモード含有確認:', text.includes('緊急デモモード') ? '✓ 含まれている' : '✗ 含まれていない');
    return text;
  } catch (error) {
    console.error('サーバー接続エラー:', error);
    return null;
  }
};

// 2. ブラウザコンソール直接実行テスト
const testDirectDemoMode = () => {
  console.log('ブラウザで実行してください:');
  console.log('localStorage.setItem("demoMode", "true"); window.location.reload();');
};

// 3. Agent-Preview 通信問題の仮説検証
const analyzeAgentPreviewIssue = () => {
  console.log('\n=== Agent-Preview通信問題分析 ===');
  console.log('症状:');
  console.log('- サーバー側の認証は正常動作');
  console.log('- ブラウザ側の認証は完全失敗');
  console.log('- コード変更がブラウザに反映されない');
  console.log('- デモモードボタンが表示されない');
  
  console.log('\n推定原因:');
  console.log('1. ビルドプロセスの問題');
  console.log('2. ブラウザキャッシュの問題');
  console.log('3. Replit Preview環境の同期問題');
  console.log('4. TypeScript/React コンパイルエラー');
  
  console.log('\n検証方法:');
  console.log('1. ハードリフレッシュ（Ctrl+Shift+R）');
  console.log('2. ブラウザ開発者ツールでネットワーク確認');
  console.log('3. コンソールエラーの確認');
  console.log('4. 要素検査でDOM構造確認');
};

// 実行
testServerResponse();
testDirectDemoMode();
analyzeAgentPreviewIssue();