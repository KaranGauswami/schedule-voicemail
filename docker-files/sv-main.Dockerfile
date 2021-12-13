FROM node:16-alpine

# Create app directory
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./

RUN yarn install --frozen-lockfile

COPY ./src /app/src

RUN yarn run build

FROM node:16-alpine
WORKDIR /app/
COPY package.json ./
COPY yarn.lock ./
RUN yarn --prod --frozen-lockfile
COPY --from=0 /app/dist/ /app/dist/
COPY swagger.yml ./
CMD [ "node", "dist/index.js" ]