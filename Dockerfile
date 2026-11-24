FROM node:20-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY db.js server.js migrate.js ./
# Commands the platform's migration Jobs call
RUN for p in expand verify contract; do \
      printf '#!/bin/sh\nexec node /app/migrate.js %s\n' "$p" > /usr/local/bin/migrate-$p; \
      chmod +x /usr/local/bin/migrate-$p; \
    done
# Numeric user: Kubernetes runAsNonRoot cannot verify a named user
USER 1000:1000
EXPOSE 8080
CMD ["node", "server.js"]
