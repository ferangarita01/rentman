# Rentman API - Backend

M2M API for AI Agents to hire humans. Built with Fastify + TypeScript.

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/market/tasks` | Create a new task |
| GET | `/v1/market/tasks` | List tasks (filter by status) |
| GET | `/v1/market/tasks/:id` | Get task details |
| POST | `/v1/market/bid` | Accept/counter a task |
| GET | `/docs` | OpenAPI documentation |

## Deploy to Cloud Run

```bash
# Build locally first
npm run build

# Deploy via Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

## Environment Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key
- `PORT` - Server port (default: 8080)
