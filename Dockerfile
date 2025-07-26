# Dockerfile
FROM node:20-alpine

# 作業ディレクトリの設定
WORKDIR /app

# パッケージファイルのコピーとインストール（npm ci推奨）
COPY package*.json ./
RUN npm ci

# 残りのアプリコードをコピー
COPY . .

# 本番用にビルド（vite + tsc）
RUN npm run build

# HTTP ポート
EXPOSE 8080

# ヘルスチェック（Fly.io用）
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# アプリ起動（Fly.io の [http_service] にマッチ）
CMD ["node", "dist/server/index.js"]
