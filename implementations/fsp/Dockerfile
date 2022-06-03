FROM node:16.14.2-alpine3.15
RUN mkdir www/
WORKDIR www/
ADD package.json package-lock.json ./
COPY node_modules ./node_modules
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000
#RUN npm install
ADD . .
CMD [ "npm", "run", "start" ]
