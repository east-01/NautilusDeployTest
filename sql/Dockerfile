FROM node:23.6.1

WORKDIR /var/www

EXPOSE 8921

COPY package.json /var/www/
RUN npm install

COPY .. /var/www/sql

CMD ["node", "sql/sqlaccess.js"]
