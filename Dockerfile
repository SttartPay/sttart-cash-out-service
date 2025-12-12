FROM node:20-slim AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

FROM base AS deps
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM deps AS dev
COPY . .
CMD ["npm", "run", "start:dev"]

FROM deps AS prod-deps
ENV NODE_ENV=production
RUN npm prune --omit=dev

FROM base AS prod
COPY --chown=node:node package*.json ./
COPY --from=prod-deps --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/dist ./dist
USER node
EXPOSE 3006
CMD ["node", "dist/apps/cash-out/main.js"]
