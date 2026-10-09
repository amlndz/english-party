# English Party — imagen de producción (web + multijugador + voz en un solo proceso)
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV PORT=3000
EXPOSE 3000
# .tts-cache guarda los audios generados; móntalo como volumen para no regenerarlos
VOLUME ["/app/.tts-cache"]
CMD ["node", "server.js"]
