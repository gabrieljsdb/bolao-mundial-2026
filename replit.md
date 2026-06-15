# Bolão Copa do Mundo 2026

App de bolão para a Copa do Mundo 2026, com cadastro, previsões de partidas, ranking e painel administrativo.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/bolao2026 run dev` — run the frontend (port via PORT env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (artifact: `bolao2026`, path `/bolao2026/`)
- API: Express 5 (artifact: `api-server`, path `/api/`)
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT via `jose` + bcrypt passwords
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bolao2026/src/` — React frontend (pages, components, contexts, hooks)
- `artifacts/api-server/src/routes/` — Express API routes
  - `auth.ts` — POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
  - `predictions.ts` — GET/POST /api/predictions
  - `ranking.ts` — GET /api/ranking (+ scoring logic + group/match data)
  - `admin.ts` — GET/POST /api/config, GET/POST /api/admin/results, GET /api/admin/users, POST /api/admin/users/:id/payment, GET /api/match-stats
  - `reports.ts` — relatórios e exportações
- `artifacts/api-server/src/lib/activity.ts` — logActivity helper
- `lib/db/src/schema/bolao.ts` — PostgreSQL schema (users, user_predictions, official_results, system_config, activity_logs)

## Architecture decisions

- Schema migrated from MySQL to PostgreSQL (pgTable, native boolean)
- JWT signed with `SESSION_SECRET` env var (falls back to dev default)
- All scoring logic lives in `ranking.ts` — group match data + best-thirds calculation
- Admin promotion done via direct SQL (no self-register as admin)
- Frontend uses `fetch` directly (no generated API client)
- Activity logging in `activity_logs` table via logActivity helper

## Product

- Usuários se cadastram e fazem previsões para todas as fases da Copa (grupos, oitavas, quartas, semis, final)
- Sistema calcula pontuação automática comparando previsões com resultados oficiais
- Ranking global mostrando todos os participantes por pontuação
- Painel admin para inserir resultados oficiais e marcar pagamentos

## User preferences

- Lingua: Português Brasileiro

## Default Admin

- Email: `admin@bolao.com`
- Senha: `admin2026`
- (Mudar a senha após o primeiro login em produção)

## Gotchas

- `hasPaid` era `int(0/1)` no MySQL original; aqui é `boolean` nativo do PostgreSQL
- O servidor retorna `hasPaid` como `true/false` (não `1/0`)
- Para novo deploy, criar admin via `POST /api/auth/register` e promover via SQL: `UPDATE users SET role = 'admin' WHERE email = '...'`
- O módulo `../lib/activity` precisa existir em `artifacts/api-server/src/lib/activity.ts`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
