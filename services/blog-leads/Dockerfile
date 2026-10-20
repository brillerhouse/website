FROM node:22-alpine
WORKDIR /service
COPY server.mjs ./server.mjs
USER node
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.mjs"]
