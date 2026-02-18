# NASA Biology Engine

Full-stack hackathon project: backend Python API + Next.js frontend.

## Overview

This repository contains a Python backend and a Next.js frontend used to ingest, process, and explore publication data and a knowledge graph.

## Repo structure (top-level)

- `backend/` — Python API, ingestion, and utilities
  - `main.py` — backend entrypoint
  - `reset_and_ingest.py` — resets DB and ingests `data/publications.csv`
  - `db.py`, `auth_oauth.py`, `encryption.py` — backend helpers
  - `requirements.txt` — Python dependencies
  - `data/` — sample CSV data
  - `logic/` — business logic and ingestion helpers
- `frontend/` — Next.js app (React + Tailwind)
  - `app/` — Next 13 app router pages and components
  - `components/`, `contexts/`, `lib/`, `services/` — UI pieces and client helpers
  - `package.json`, `setup.sh` — frontend scripts

## Quickstart

Prerequisites:

- Python 3.10+ (or compatible)
- Bun (recommended) or Node.js 16+ with npm/yarn

Backend (Python)

1. Create a virtual environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

2. Configure environment variables:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env to set keys, DB connection, etc.
```

3. Run the backend API:

```bash
python backend/main.py
```

4. (Optional) Re-run ingestion to load `data/publications.csv`:

```bash
python backend/reset_and_ingest.py
```

Frontend (Next.js)

1. Install dependencies and run the dev server (using Bun):

```bash
cd frontend
bun install
bun run dev
```

2. Open the app at `http://localhost:3000`.

Notes

- The frontend contains API proxy routes under `app/api/proxy` which may expect the backend to be accessible at a given host/port — adjust frontend or backend envs if needed.
- If you change the backend host/port, update any frontend service configuration in `frontend/services/api.ts`.

Contributing

1. Open a branch for your work.
2. Keep changes focused and include instructions for running new features.

License

This repo currently has no license file. Add one if you intend to open-source this project.

---

If you'd like, I can also:

- Add a `Makefile` or root `scripts` to simplify running both services.
- Commit and push these changes and open a PR.