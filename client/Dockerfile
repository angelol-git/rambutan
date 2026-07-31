# Build this image from the repository root so pnpm can resolve the workspace:
# docker build -f client/Dockerfile -t rambutan-client .

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy manifests first to keep dependency installation cached between builds.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

RUN pnpm install --frozen-lockfile

COPY client ./client

# Vite substitutes VITE_* variables while building. The Google client ID is
# public browser configuration; the client secret remains server-only.
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN pnpm --filter client build

FROM nginx:1.29-alpine AS runtime

COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
