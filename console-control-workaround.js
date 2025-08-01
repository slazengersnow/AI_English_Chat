// プレビュー内のConsole制御回避策
console.log('=== Console制御回避策 ===');

// 1. プレビューログの簡略化
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

// ログ出力を最小限に抑制
console.log = function(...args) {
  // 重要なログのみ表示
  if (args.some(arg => typeof arg === 'string' && 
      (arg.includes('Emergency') || arg.includes('Demo') || arg.includes('Error')))) {
    originalLog.apply(console, args);
  }
};

console.error = originalError; // エラーは常に表示
console.warn = function(...args) {
  // 警告は制限
  if (args.some(arg => typeof arg === 'string' && arg.includes('Demo'))) {
    originalWarn.apply(console, args);
  }
};

// 2. DOM操作でConsole要素を制御試行
const minimizeConsoleAttempt = () => {
  try {
    // プレビュー内のConsole関連要素を特定・制御
    const elements = document.querySelectorAll([
      '[class*="console"]',
      '[class*="devtools"]', 
      '[data-testid*="console"]',
      '.chrome-devtools'
    ].join(','));
    
    elements.forEach(el => {
      if (el.style) {
        el.style.display = 'none';
        el.style.height = '0px';
        el.style.minHeight = '0px';
      }
    });
    
    return elements.length > 0;
  } catch (e) {
    return false;
  }
};

// 3. プレビューフレーム内でのConsole制御
const controlPreviewConsole = () => {
  // プレビューフレーム内で実行されるスクリプト
  const script = `
    // Console最小化
    const consoles = document.querySelectorAll('[class*="console"], [class*="devtools"]');
    consoles.forEach(c => c.style.display = 'none');
    
    // スタイル注入
    const style = document.createElement('style');
    style.textContent = \`
      [class*="console"], [class*="devtools"] { 
        display: none !important; 
        height: 0 !important; 
      }
    \`;
    document.head.appendChild(style);
  `;
  
  // プレビューフレームに注入試行
  try {
    const frames = document.querySelectorAll('iframe');
    frames.forEach(frame => {
      if (frame.contentWindow) {
        frame.contentWindow.eval(script);
      }
    });
  } catch (e) {
    console.log('フレーム制御失敗:', e.message);
  }
};

// 実行
setTimeout(minimizeConsoleAttempt, 1000);
setTimeout(controlPreviewConsole, 2000);

console.log('Console制御回避策を実行中...');