FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./
COPY Back-End/package*.json ./Back-End/

RUN npm install --production
RUN cd Back-End && npm install --production

COPY . .

EXPOSE 4000

CMD [ "node", "Back-End/server.js" ]
