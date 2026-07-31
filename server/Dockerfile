# Build this image from the repository root so pnpm can resolve the workspace:
# docker build -f server/Dockerfile -t rambutan-server .

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy manifests first to keep dependency installation cached between builds.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

RUN pnpm install --frozen-lockfile

COPY server ./server

RUN pnpm --filter server build \
  && pnpm --filter server deploy --legacy --prod /opt/server

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# The deploy output contains the compiled server and its production dependencies.
COPY --from=build /opt/server ./

EXPOSE 8080

# Required: DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_API_KEY,
# SESSION_SECRET. Optional: PORT, CLIENT_URL, LOG_LEVEL.
CMD ["node", "dist/server.js"]
