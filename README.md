<h1 align="center">
  <img src="https://github.com/angelol-git/rambutan/blob/main/.github/logo.png?raw=true" width="48" alt="Rambutan logo" />
  Rambutan
</h1>

Recipe manager app for importing, organizing, editing, and generating recipes.

## Features

- Import recipes from URLs with scraping and AI parsing
- Generate or refine recipes through a cooking assistant
- Edit ingredients and instructions with drag-and-drop reordering
- Organize recipes with custom color-coded tags
- Sign in with Google to save recipes across sessions

## Tech Stack

- Frontend: React 19, Vite 7, Tailwind CSS 4, React Router 7, TanStack Query 5, `@dnd-kit`, Vitest
- Backend: Node.js, Express 5, TypeScript, SQLite, Google GenAI API, Cheerio, Google OAuth 2.0, Zod

## Project Structure

```text
.
├── client/                  # React + Vite frontend
│   ├── src/pages/           # Home and kitchen routes
│   ├── src/components/      # UI, editor, assistant, and tag components
│   ├── src/hooks/           # Data-fetching and local state hooks
│   └── src/api/             # Frontend API clients
├── server/                  # Express API and SQLite app
│   ├── routes/              # auth, recipes, kitchen, tags
│   ├── services/            # AI, recipe, message, tag, and URL services
│   ├── migrations/          # Database schema migrations
│   └── scripts/             # Migration runner and benchmarks
└── package.json             # Workspace-level scripts
```

## Setup

1. Clone the repository:

```bash
git clone https://github.com/angelol-git/rambutan.git
cd rambutan
```

2. Install workspace dependencies:

```bash
pnpm install
```

3. Create `client/.env`:

```env
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

4. Create `server/.env`:

```env
PORT=8080
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_API_KEY=your-google-api-key
SESSION_SECRET=replace-with-a-long-random-secret
DATABASE_URL=./rambutan.db
```

Notes:

- `DATABASE_URL` is optional; the server defaults to `server/rambutan.db`.
- Google OAuth credentials come from [Google Cloud Console](https://console.cloud.google.com/).
- The AI key comes from [Google AI Studio](https://aistudio.google.com/app/apikey).
- The app is now managed as a `pnpm` workspace with separate `client` and `server` packages.

5. Run database migrations:

```bash
pnpm migrate
```

## Run Locally

Start the server:

```bash
pnpm dev:server
```

Runs on `http://localhost:8080`.

Start the client in another terminal:

```bash
pnpm dev:client
```

Runs on `http://localhost:5173`.

Health check:

```text
http://localhost:8080/health
```

## Workspace Scripts

Run these from the repository root:

```bash
pnpm dev:client
pnpm dev:server
pnpm migrate
pnpm build
pnpm lint
pnpm test
pnpm format
pnpm format:check
```

## API Overview

- `/api/auth`: Google login, logout, auth check, and current user
- `/api/recipes`: recipe listing, detail, updates, deletion, version deletion, and related message history
- `/api/tags`: bulk tag updates and deletes
- `/api/kitchen`: AI recipe creation, refinement, and URL-based recipe import

## Data Behavior

- Guests can create and edit recipes in browser local storage
- Signed-in users persist recipes, tags, sessions, prompts, and recipe versions in SQLite
- Recipe completion state is stored locally for in-progress cooking checklists

## Benchmarks

Run benchmarks with the server package scripts:

```bash
pnpm --dir server benchmark:create:text
pnpm --dir server benchmark:scrape
pnpm --dir server benchmark:url
pnpm --dir server benchmark:url-context
```

Notes:

- `benchmark:create:text` expects the API to already be running unless you provide a custom URL.
- `benchmark:scrape` and `benchmark:url` fetch live pages and need outbound network access.
- `benchmark:url-context` requires `GOOGLE_API_KEY` in `server/.env`.

## Development Notes

- Husky and `lint-staged` are configured at the workspace root
- Frontend tests are present; the server test script is still a placeholder. Both are in process of a major rewrite.
- Production server output is built into `server/dist/`
