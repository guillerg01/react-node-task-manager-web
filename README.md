# Task manager frontend

React and TypeScript task dashboard with a Spanish interface. Create tasks, filter and paginate server-side results, and change task status. The implementation keeps form state, server state, transport, and presentation separate.

- Application: https://react-node-task-manager-web.onrender.com
- API repository and Docker Compose: https://github.com/guillerg01/react-node-task-manager-api
- API documentation: https://react-node-task-manager-api.onrender.com/docs
- Architecture: https://github.com/guillerg01/react-node-task-manager-api/blob/main/ARCHITECTURE.md
- Technical decisions and AI workflow: https://github.com/guillerg01/react-node-task-manager-api/blob/main/DECISIONS.md

![Desktop dashboard](docs/images/dashboard-1440.png)

[Mobile screenshot](docs/images/dashboard-375.png) · [Tablet screenshot](docs/images/dashboard-768.png)

## Run the complete application

Clone both repositories as sibling directories. With Docker running:

```sh
git clone https://github.com/guillerg01/react-node-task-manager-api.git
git clone https://github.com/guillerg01/react-node-task-manager-web.git
cd react-node-task-manager-api
docker compose up --build
```

Open http://localhost:5174. The API is at http://localhost:3001 and Swagger at http://localhost:3001/docs. PostgreSQL uses a named volume, and the API applies explicit migrations on startup.

For frontend development without Docker, use the Node version in `.nvmrc`:

```sh
npm ci
npm run dev
```

The development API defaults to http://localhost:3000. Set `VITE_API_URL` to another origin when needed, for example `VITE_API_URL=http://localhost:3001` in `.env.local` when using the Compose API. Vite embeds this public configuration at build time; it must contain no secrets.

## Architecture and ownership

| Location | Responsibility |
| --- | --- |
| `src/features/tasks/components` | Task form, dashboard, list, filter, and row presentation |
| `src/features/tasks/hooks/useTasks.ts` | Task queries, writes, cache reconciliation, and concurrency errors |
| `src/features/tasks/api` | Typed task-specific HTTP operations |
| `src/features/tasks/taskFilterStorage.ts` | Persistence of the selected task filter |
| `src/shared/components` | Reusable validated fields and pagination controls |
| `src/shared/notifications` | Notification queue, accessible toast presentation, and notification context |
| `src/api` | Shared Axios instance and normalized transport failures |
| `src/app` | Application-level query provider |

`useTasks` belongs to the task feature because it knows task statuses, endpoints, and query keys. Moving it into a generic hooks folder would hide that ownership. Shared code contains behavior that can serve another feature without importing task rules.

React components are functions. NestJS uses classes for its dependency-injection model; the frontend does not introduce equivalent class hierarchies. Responsibilities are separated without adding a generic repository framework or a global store for data already managed by TanStack Query.

## Technical decisions

- **React and Vite:** a small application with a focused build pipeline and static deployment.
- **Material UI and Tailwind:** established accessible controls, with utility classes for layout. Feature components own labels and task-specific behavior.
- **React Hook Form:** input state, validation, submission state, and field errors. Required text is trimmed; title and assignee limits are 120 and 100 characters. A failed request preserves the draft; a successful create resets it.
- **One Axios instance:** a module-scoped `axios.create` centralizes API origin and a ten-second timeout. Its response interceptor normalizes HTTP, network, and timeout errors while preserving cancellation. A singleton class is unnecessary because module exports already share the instance.
- **TanStack Query:** owns remote data, cancellation, freshness, and invalidation. React Hook Form does not own the query cache. No Redux-style store is needed for this scope.
- **One route:** the app has a single screen at `/`, so a routing library would add no useful behavior. Filter and pagination are local UI state; only the selected filter persists in browser storage.

### Cache and write lifecycle

The key is `['tasks', statusFilter, page, pageSize]`, with a 30-second stale time and window-focus refetching disabled. Filtering and pagination execute in PostgreSQL; the browser does not load every task and filter locally.

Creating a task invalidates task queries and refreshes the active view. Changing status uses the saved API response to update the visible cache when the row still belongs in that view, avoiding an unnecessary GET. When membership changes, the active page and total are fetched again. Other cached views become stale. Pending writes use the currently committed view if the user changes filters before the response arrives.

Writes are not automatically retried, preventing an ambiguous network failure from silently creating duplicates. A `409` means another client changed the task version; the app refreshes the data and asks the user to retry deliberately. This is not real-time synchronization: external changes become visible on a subsequent read or reload.

### Notifications, errors, and accessibility

The shared Material UI Snackbar/Alert provider queues success notifications for creation and status changes. Each toast closes manually or after five seconds. Without the provider, the dashboard retains an inline success fallback. Write errors remain visible inline and failed reads offer a retry; field validation stays beside the relevant input.

The transport layer classifies `400`, `404`, `409`, `429`, server errors, network failures, and timeouts. Recognizing `429` does not imply that this API implements rate limiting.

Controls have accessible labels, field errors are associated with inputs, status is expressed in text as well as color, and notifications use live-region roles. Layout stacks on narrow screens. Browser checks cover 375, 768, and 1440 pixels, keyboard interactions, and horizontal overflow. A full screen-reader audit remains future work.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

With the Compose stack running:

```sh
npx playwright install chromium
npm run test:e2e
```

| Layer | Evidence |
| --- | --- |
| Unit | Filter persistence and request-error classification |
| UI integration | Testing Library with MSW: validation, filtered reads, pagination, writes, draft preservation, cache behavior, rate-limit responses, and update conflicts |
| Browser | Playwright against the running frontend/API/PostgreSQL stack: creation, status changes, toast dismissal, filters, reload, pagination, and controlled network failures |

The verified baseline contains 30 frontend tests and nine browser scenarios across three viewport sizes. Browser error cases intercept responses so failure handling can be tested without breaking a deployed service. Screenshots supplement assertions with visual inspection; they are not a claim of a complete accessibility audit.

## Branches, CI, and deployment

Create `feature/*` or `fix/*` from `dev`, submit a pull request to `dev`, then promote to `main` through a pull request. `main` represents production. Commit titles and bodies describe behavior and verification.

GitHub Actions is configured for pushes and pull requests. It installs locked dependencies, audits packages, checks lint and types, runs tests, and builds. Its browser job checks out both repositories and starts the complete Docker stack. The companion repository uses `dev` for integration work and `main` for production checks.

Render builds the static assets and publishes `dist` from `main` after successful checks. API deployment is independent. The two repositories therefore do not provide an atomic release: breaking contract changes would require a coordinated, backward-compatible rollout.

## Scope and next steps

This is a small assessment application. Authentication, user ownership, real-time updates, and production monitoring are not implemented. Before operating it with sensitive data, I would add access control, observability, operational backups, and stricter release protection. The free Render API can cold-start, and its free database has a limited lifetime.

## AI-assisted workflow

I used AI to compare the stack, propose feature boundaries, implement bounded parts, and suggest tests and documentation. Luna subagents worked on API, interface, and test tasks against a shared contract. Accepted choices included Material UI, React Hook Form, the shared Axios client, and network-boundary tests with MSW.

Generated proposals were reviewed against project rules and actual behavior. Cache handling during filter changes, focus styling, layout alignment, validation, and concurrent updates were refined through code inspection and automated/browser checks. The main agent performed the final integration review. Browser-control tools supported inspection and Render setup; Playwright provided reproducible browser verification when integrated-browser access was unavailable.

The [decision record](https://github.com/guillerg01/react-node-task-manager-api/blob/main/DECISIONS.md) explains tools, context management, accepted decisions, corrections, and verification limits. AI assistance is disclosed because the assessment explicitly requests it; test outcomes and documented limitations remain the basis for evaluating the result.

## Environment reference

Copy `.env.example` to `.env.local` for Vite development. It contains only `VITE_API_URL`, the public backend origin without `/api`. Vite adds `/api` through the shared client and embeds the configured origin during the build. Restart the development server after editing it. The example targets the Compose API on port 3001; use port 3000 for the native API default. Compose already supplies its build value, and Render stores the production value in service configuration.

Playwright also accepts `E2E_BASE_URL` and `E2E_API_URL` as process environment variables, defaulting to `http://localhost:5174` and `http://localhost:3001`. These are test-runner settings, not Vite browser variables; export them in the shell before running `npm run test:e2e`. Playwright does not load `.env.local` automatically.
