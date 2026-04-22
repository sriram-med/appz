# MedJobz Platform Reset

MedJobz is being rebuilt as a data-first Medical Officer jobs intelligence platform for India, focused only on Government, PSU, ECHS, NHM, AIIMS, Railways, and other official public-sector doctor hiring sources.

## Structure

- `app/`: Next.js routes and page shells
- `frontend/`: UI components and presentation utilities
- `backend/`: database access and homepage/search services
- `workers/`: ingestion contracts, source registry, parser map, normalization
- `scheduler/`: refresh cadence policy and scheduler notes
- `database/`: migrations and seed data
- `netlify/`: Netlify serverless entry points
- `shared/`: cross-layer env and types
- `docs/`: rebuild, ingestion, and deployment documentation

## First Production Tasks

1. Create a PostgreSQL or Supabase database and run `database/migrations/001_initial.sql`.
2. Run `database/seeds/001_reference_data.sql`.
3. Configure Netlify environment variables from `docs/deployment.md`.
4. Install dependencies and connect the repository to the Netlify project.
5. Expand parser implementations for the highest-priority official domains.

