// プレビューコンソール最小化スクリプト
console.log('コンソール最小化処理実行中...');

// プレビューコンソールを最小化する処理
const minimizeConsole = () => {
  try {
    // Replitのプレビューコンソール要素を特定
    const consoleElements = document.querySelectorAll('[data-testid*="console"], [class*="console"], [class*="devtools"]');
    
    consoleElements.forEach(el => {
      if (el.style) {
        el.style.height = '30px';
        el.style.minHeight = '30px';
        el.style.maxHeight = '30px';
        el.style.overflow = 'hidden';
      }
    });
    
    // コンソールパネルの高さを制限
    const panels = document.querySelectorAll('[class*="panel"], [class*="pane"]');
    panels.forEach(panel => {
      if (panel.textContent && panel.textContent.includes('Console')) {
        panel.style.height = '30px';
      }
    });
    
    console.log('コンソール最小化完了');
  } catch (error) {
    console.log('コンソール最小化エラー:', error);
  }
};

// DOM読み込み後に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', minimizeConsole);
} else {
  minimizeConsole();
}

// 追加の最小化試行
setTimeout(minimizeConsole, 1000);
setTimeout(minimizeConsole, 3000);