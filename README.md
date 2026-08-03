<h1>
  <img
    src="https://github.com/angelol-git/rambutan/blob/main/.github/logo.png?raw=true"
    width="42"
    alt="Rambutan logo"
  />
  <span>Rambutan</span>
</h1>

[Live site](https://myrambutan.app/)

Recipe manager app for importing, organizing, editing, and generating recipes.

## Features

- Import recipes from URLs with scraping and AI parsing
- Generate or refine recipes through a cooking assistant
- Edit ingredients and instructions with drag-and-drop reordering
- Organize recipes with custom color-coded tags
- Sign in with Google to save recipes across sessions

## Tech Stack

- Frontend: React 19, Vite 7, Tailwind CSS 4, React Router 7, TanStack Query 5, `@dnd-kit`, Vitest
- Backend: Node.js, Express 5, TypeScript, PostgreSQL, Kysely, Google GenAI API, Cheerio, Google OAuth 2.0, Zod

## Project Structure

```text
.
├── client/                  # React + Vite frontend
│   ├── src/pages/           # Home and kitchen routes
│   ├── src/components/      # UI, editor, assistant, and tag components
│   ├── src/hooks/           # Data-fetching and local state hooks
│   └── src/api/             # Frontend API clients
├── server/                  # Express API and PostgreSQL app
│   ├── database/            # Kysely client, schema types, and migrations
│   ├── routes/              # auth, recipes, kitchen, tags
│   ├── services/            # AI, recipe, message, tag, and URL services
│   └── server.ts            # API entry point
└── package.json             # Workspace-level scripts
```

## Setup

Requirements:

- Docker and Docker Compose
- Node.js 22 or later
- pnpm

1. Clone the repository:

```bash
git clone https://github.com/angelol-git/rambutan.git
cd rambutan
```

2. Run the first-time Docker setup:

```bash
pnpm docker:setup
```

On its first run this creates `.env` without overwriting an existing one.

3. Edit `.env` and set the database password, Google credentials, and session
   secret, then rerun the setup command. It builds and starts the containers and
   runs the database migrations:

```bash
pnpm docker:setup
```

- Google OAuth credentials come from [Google Cloud Console](https://console.cloud.google.com/).
- The AI key comes from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Run with Docker

The client is available at `http://localhost:8080`. View service logs with:

```bash
pnpm docker:logs
```

Start or rebuild the containers with `pnpm docker:up`; stop them with
`pnpm docker:down`.

## Develop with Docker

For a first-time development setup, run:

```bash
pnpm docker:dev
```

If `.env` does not exist, this creates it from `.env.example` and stops. Set
the database password, Google credentials, and session secret in `.env`, then
rerun the command.

This mounts the `client` and `server` source directories into their containers
and runs Vite and the server watcher. Open `http://localhost:5173`; edits to
either application reload automatically. The API is available at
`http://localhost:8080`.

The server applies outstanding database migrations automatically before starting
the development watcher.

Stop the development environment with `pnpm docker:dev:down`.

Check the server health from inside its container:

```bash
docker compose -f compose.dev.yaml exec server node -e "fetch('http://localhost:8080/health').then(r => console.log(r.status))"
```

Check database readiness:

```bash
docker compose -f compose.dev.yaml exec server node -e "fetch('http://localhost:8080/ready').then(r => console.log(r.status))"
```

`/health` verifies that the server process is running. `/ready` also verifies
PostgreSQL connectivity and that the baseline schema is available.

## Workspace Scripts

Run these from the repository root:

```bash
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
- Signed-in users persist recipes, tags, sessions, prompts, and recipe versions in PostgreSQL
- Recipe completion state is stored locally for in-progress cooking checklists

## Development Notes

- Husky and `lint-staged` are configured at the workspace root
- Run `pnpm docker:migrate` against the production PostgreSQL database before starting a newly deployed server version.
