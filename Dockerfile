# English Party — imagen de producción (web + multijugador + voz en un solo proceso)
# Compatible con Hugging Face Spaces (usuario sin privilegios, uid 1000)
FROM node:22-slim
WORKDIR /app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
RUN npm run build && mkdir -p .tts-cache && chown -R node:node /app
USER node
ENV PORT=7860 NODE_ENV=production
EXPOSE 7860
CMD ["node", "server.js"]
