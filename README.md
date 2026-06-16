# <img src="https://github.com/angelol-git/rambutan/blob/main/.github/logo.png?raw=true" width="32" /> Rambutan

Recipe manager app for importing, organizing, editing, and generating recipes.

## Features

- Import recipes from URLs with scraping and AI parsing
- Generate or refine recipes through a cooking assistant
- Edit ingredients and instructions with drag-and-drop reordering
- Organize recipes with custom color-coded tags
- Sign in with Google to save recipes across sessions

## Tech Stack

- Frontend: React 19, Vite 7, Tailwind CSS 4, React Router 7, TanStack Query 5, `@dnd-kit`
- Backend: Node.js, Express 5, SQLite, Google GenAI API, Cheerio, Google OAuth 2.0, Zod

## Setup

1. Clone the repository:

```bash
git clone https://github.com/angelol-git/rambutan.git
cd rambutan
```

2. Install dependencies:

```bash
cd server
npm install
cd ../client
npm install
```

3. Create `server/.env`:

```env
NODE_ENV=development
PORT=8080
CLIENT_URL=http://localhost:5173
DATABASE_URL=./recipes.db
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_API_KEY=your_google_genai_api_key
```

Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/) and the AI key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Run Locally

Start the server:

```bash
cd server && npm run dev
```

Runs on `http://localhost:8080`.

Start the client:

```bash
cd client && npm run dev
```

Runs on `http://localhost:5173`.

## Benchmarks

Run benchmarks from `server/`:

```bash
npm run benchmark:create:text
npm run benchmark:scrape
npm run benchmark:url
npm run benchmark:url-context
```

Notes:

- `benchmark:create:text` expects the server to already be running on `http://localhost:8080` unless you pass `--url`.
- `benchmark:scrape` and `benchmark:url` fetch live pages and need outbound network access.
- `benchmark:url-context` also requires `GOOGLE_API_KEY` in `server/.env`.
