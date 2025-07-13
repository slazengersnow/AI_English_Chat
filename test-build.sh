#!/bin/bash
# テスト用：Renderビルドの動作確認

echo "=== Render Build Test ==="
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

echo "=== npm install ==="
npm install

echo ""
echo "=== npm run build ==="
npm run build

echo ""
echo "=== Build results ==="
ls -la dist/
echo ""
echo "=== dist/public ==="
ls -la dist/public/

echo ""
echo "=== Test complete ==="