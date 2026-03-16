FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests first (layer cache optimisation)
COPY package*.json ./

# Set production mode before install so devDependencies are skipped
ENV NODE_ENV=production

RUN npm install --omit=dev

# Copy application source (includes src/public/index.html)
COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
