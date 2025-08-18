function Guard({ children }: { children: JSX.Element }) {
  // 一時的に全てパススルー（認証チェック無効）
  console.log('Guard: 一時的に全てパススルー');
  return children;
}
