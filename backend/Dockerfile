FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar source code
COPY . .

# Build TypeScript
RUN npm install typescript @types/node --save-dev && npm run build

# Expor porta
EXPOSE 3000

# Start command
CMD ["npm", "start"]
