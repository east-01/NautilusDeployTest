FROM node:23.6.1

WORKDIR /var/www

COPY package.json /var/www/
RUN npm install

COPY sql /var/www/sql

CMD ["node", "sql/sqlaccess.js"]
