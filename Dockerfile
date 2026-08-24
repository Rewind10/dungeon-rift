# DUNGEON RIFT — immagine server (zero dipendenze npm)
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY shared ./shared
COPY public ./public
ENV PORT=8080
EXPOSE 8080
RUN addgroup -S game && adduser -S game -G game && chown -R game:game /app
USER game
CMD ["node", "server/index.js"]
