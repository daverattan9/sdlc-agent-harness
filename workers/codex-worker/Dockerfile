FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git curl && \
    npm install -g @openai/codex gh && \
    rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
