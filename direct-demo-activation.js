// 直接ブラウザでデモモードを強制的に有効化
console.log('=== 直接デモモード強制有効化 ===');

// 複数の方法でデモモードを設定
const activateDirectDemo = () => {
  // 1. ローカルストレージ設定
  localStorage.setItem('demoMode', 'true');
  localStorage.setItem('emergencyDemo', 'true');
  localStorage.setItem('auth_bypass', 'true');
  
  // 2. セッションストレージ設定
  sessionStorage.setItem('demoMode', 'true');
  sessionStorage.setItem('emergencyAccess', 'true');
  
  // 3. クッキー設定
  document.cookie = 'demoMode=true; path=/';
  document.cookie = 'emergency=true; path=/';
  
  // 4. グローバル変数設定
  window.DEMO_MODE = true;
  window.EMERGENCY_ACCESS = true;
  
  console.log('デモモード設定完了');
  console.log('ローカルストレージ:', localStorage.getItem('demoMode'));
  console.log('セッションストレージ:', sessionStorage.getItem('demoMode'));
  
  // 5. 強制リダイレクト
  setTimeout(() => {
    window.location.href = window.location.origin + '/';
  }, 1000);
};

// ブラウザコンソールで実行可能
console.log('ブラウザのコンソールで以下を実行してください:');
console.log('activateDirectDemo()');

// 関数をグローバルに公開
if (typeof window !== 'undefined') {
  window.activateDirectDemo = activateDirectDemo;
}

// 即座に実行したい場合
// activateDirectDemo();