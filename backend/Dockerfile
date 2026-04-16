FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
RUN printf '{"notes":[]}\n' > data.json \
  && printf '{"users":[]}\n' > users.json \
  && mkdir -p uploads

EXPOSE 3001

CMD ["npm", "start"]
