# UniSwap — Campus Marketplace

FYP 401 Final Year Project. A closed marketplace for verified `.edu.kh` campus members to
buy, sell, trade, or give away items.

| Folder | What it is | Owner |
|---|---|---|
| [`frontend/`](frontend/) | Next.js + React + TypeScript + Tailwind + shadcn/ui | Dy Nobsokun |
| [`backend/`](backend/) | Node.js + Express REST API + PostgreSQL | Long Vathanak |

Rules for AI coding agents working in this repo are in [`Agent.md`](Agent.md).

## Run locally

```bash
# API on http://localhost:4000  (needs PostgreSQL; see backend/README.md)
cd backend && npm install && cp .env.example .env && npm run db:setup && npm run db:seed && npm run dev

# Web app on http://localhost:3000 (talks to the API above)
cd frontend && npm install && npm run dev
```

The web app calls the API from the Next.js server, at `http://localhost:4000` by default. To use a
different address, set `API_URL` in `frontend/.env.local`.

Demo accounts (created by `npm run db:seed`, password `password123` for all):
`sokunth@aupp.edu.kh`, `chanrithorn@aupp.edu.kh`, `dara@aupp.edu.kh`. New accounts need a
`.edu.kh` email; their verification link is printed in the API's log until email sending is set up.
