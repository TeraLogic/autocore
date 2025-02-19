FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /autocore

COPY package.json ./

RUN pnpm install

COPY . .

CMD ["pnpm", "prod"]
