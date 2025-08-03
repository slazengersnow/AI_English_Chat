# 公式 Node イメージをベースにする（Alpineで軽量）
FROM node:20-alpine

# 作業ディレクトリを作成
WORKDIR /app

# package.json と lockファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm ci

# 残りのすべてのファイルをコピー
COPY . .

# TypeScriptビルド（dist/server/index.js を生成）
RUN npm run build

# アプリが使用するポートを開放
EXPOSE 8080

# アプリ起動コマンド
CMD ["node", "dist/server/index.js"]
