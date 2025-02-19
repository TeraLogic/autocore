FROM node:18-alpine

WORKDIR /autocore

COPY package.json ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "prod"]
