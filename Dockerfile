FROM node:18-alpine

WORKDIR /autocore

COPY package.json pnpm-lock.yaml ./

RUN npm install --omit=dev

COPY . .

CMD ["node", "index.js"]
