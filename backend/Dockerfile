FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# better-sqlite3 네이티브 애드온 빌드에 필요한 툴
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p uploads

EXPOSE 3001

CMD ["npm", "start"]
