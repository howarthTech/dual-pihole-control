# dual-pihole-control backend image
FROM node:20-alpine

# App lives here inside the container.
WORKDIR /app

# Install dependencies first so Docker can cache this layer.
COPY package.json ./
RUN npm install --omit=dev

# Copy application source.
COPY src ./src

# The backend listens on this port (overridable via PORT env var).
EXPOSE 8088

# Run as the built-in non-root user provided by the node image.
USER node

CMD ["node", "src/server.js"]
