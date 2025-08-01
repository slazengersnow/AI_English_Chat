// Relit Console最小化スクリプト
// プレビュー環境で直接実行可能

console.log('🔧 Console最小化スクリプト開始');

// 1. Eruda開発者ツールの制御
try {
  if (window.eruda) {
    window.eruda.hide();
    console.log('✅ Eruda開発者ツールを非表示にしました');
  }
} catch (e) {
  console.log('⚠️ Eruda制御に失敗:', e.message);
}

// 2. レンチアイコンの自動クリック
try {
  const wrenchButtons = document.querySelectorAll('[title*="wrench"], [data-tooltip*="tools"], .eruda-icon-tool');
  if (wrenchButtons.length > 0) {
    wrenchButtons.forEach(btn => btn.click());
    console.log('✅ レンチアイコンを自動クリックしました');
  }
} catch (e) {
  console.log('⚠️ レンチアイコン制御に失敗:', e.message);
}

// 3. CSS強制非表示
const hideConsoleCSS = `
  .eruda-dev-tools,
  .eruda-console,
  [class*="eruda"],
  [class*="console"],
  [data-id="console"] {
    display: none !important;
    height: 0 !important;
    opacity: 0 !important;
  }
`;

const style = document.createElement('style');
style.textContent = hideConsoleCSS;
document.head.appendChild(style);
console.log('✅ CSS強制非表示を適用しました');

// 4. ユーザーへの指示表示
console.log(`
===== Console最小化完了 =====
✅ 自動制御を実行しました

手動での操作方法：
1. プレビュー右上の🔧アイコンをクリック
2. F12でブラウザ開発者ツールを開閉
3. 新しいタブで直接アクセス：
   /auto-demo または /force-demo

Agent-Preview同期問題により、
一部の制御は手動で行う必要があります。
=============================
`);

// 5. 同期問題の診断
setTimeout(() => {
  console.log('🔍 同期状態診断中...');
  
  const previewFrame = window.parent !== window;
  const hasReactDevTools = !!(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  const hasViteHMR = !!(window.__vite_plugin_react_preamble_installed__);
  
  console.log('📊 診断結果:', {
    isInPreviewFrame: previewFrame,
    hasReactDevTools: hasReactDevTools,
    hasViteHMR: hasViteHMR,
    currentURL: window.location.href,
    timestamp: new Date().toISOString()
  });
}, 2000);