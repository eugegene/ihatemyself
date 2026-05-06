# ===================================================
# ЕТАП 1: Збірка (Builder)
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# SvelteKit вбудовує PUBLIC_ змінні в бандл на етапі build
ARG PUBLIC_API_URL
ENV PUBLIC_API_URL=${PUBLIC_API_URL}

RUN npm run build

RUN npm prune --production

# ===================================================
# ЕТАП 2: Запуск (Runner)
# ===================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# ВАЖЛИВО для аватарок!
# За замовчуванням adapter-node обмежує тіло запиту (512kb).
# Збільшуємо ліміт до 10МБ (або скільки тобі треба)
ENV BODY_SIZE_LIMIT=10M

# Відключаємо телеметрію (трохи прискорює запуск)
ENV MY_CLI_NO_UPDATE_NOTIFIER=true

# Створюємо користувача 'node' (вже є в Alpine) для безпеки
# Не запускай додатки під root!
USER node

COPY --from=builder --chown=node:node /app/build build/
COPY --from=builder --chown=node:node /app/node_modules node_modules/
COPY --from=builder --chown=node:node /app/package.json .

EXPOSE 3000

CMD ["node", "build"]