FROM node:18-alpine

WORKDIR /autocore

COPY package.json ./ 

RUN npm install --omit=dev

COPY . .

CMD ["pnpm", "prod"]
