FROM node:8.11.1

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN yarn install --ignore-engines --frozen-lockfile

COPY . .
RUN yarn build
RUN yarn global add pm2

EXPOSE 3003
CMD ["./docker-start.sh" ]
