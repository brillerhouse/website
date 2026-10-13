FROM node:22-alpine AS build
WORKDIR /site
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm test
FROM nginx:stable-alpine
COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/out /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/en/ || exit 1
