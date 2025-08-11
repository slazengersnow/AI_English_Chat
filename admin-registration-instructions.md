# 管理者アカウント登録手順

## 現在の状況
- アプリケーションは完全にSupabase認証を使用
- テストアカウントは全て削除済み
- slazengersnow@gmail.comが管理者として設定済み

## 管理者アカウント作成方法

### オプション1: 通常の新規登録で管理者アカウントを作成
1. アプリケーションの新規登録画面にアクセス
2. slazengersnow@gmail.com で新規登録
3. パスワード: s05936623
4. 利用規約・プライバシーポリシーに同意
5. 確認メールのリンクをクリック

### オプション2: Supabaseダッシュボードで直接作成
1. https://supabase.com/dashboard/projects にアクセス
2. プロジェクト xcjplyhqxgrbdhixmzse を選択
3. Authentication → Users → Add user
4. Email: slazengersnow@gmail.com
5. Password: s05936623
6. Email confirm: チェック（メール確認をスキップ）

## 管理者権限の確認
- ログイン後、ホーム画面右上に「管理者」ボタンが表示される
- MyPageで「管理者アカウント」と表示される
- プレミアム機能に自動的にアクセス可能

## 注意点
- 管理者判定はuser.email === 'slazengersnow@gmail.com'で行われる
- 大文字小文字は区別される
- 確実にメール認証を完了させる必要がある