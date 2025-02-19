FROM node:18-alpine

WORKDIR /autocore

RUN npm install -g pnpm@latest 

COPY package.json ./

RUN pnpm install

COPY . .

CMD ["pnpm", "prod"]
