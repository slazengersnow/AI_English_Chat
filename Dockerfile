# 公式 Node イメージをベースにする
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["node", "dist/server/index.js"]
