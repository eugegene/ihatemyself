# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Track List is a full-stack media tracking and review web application. Users can log films, TV shows, and books; write reviews; follow others; and browse a personalized feed.

- **Frontend**: SvelteKit 2 + TypeScript + Tailwind CSS 4, served via Node.js adapter
- **Backend**: ASP.NET Core 10 (.NET 10) + Entity Framework Core + PostgreSQL
- **Infrastructure**: Docker Compose + Caddy reverse proxy

---

## Commands

### Frontend (`Frontend/`)

```bash
npm run dev           # Vite dev server with hot reload
npm run build         # Production SSR build
npm run preview       # Preview production build

npm run lint          # ESLint + Prettier check
npm run check         # SvelteKit sync + svelte-check (type check)
npm run check:watch   # Type check in watch mode

npm run test:unit          # Vitest unit tests (run once)
npm run test:unit:watch    # Vitest watch mode
npm run test:bdd           # Cucumber BDD tests against shared feature files
```

### Backend (`Backend/track-list-api/`)

```bash
dotnet run                        # Start API on http://0.0.0.0:8080
dotnet watch run                  # Hot reload mode

dotnet test ../TrackListTests     # Run all xUnit + BDD tests
dotnet test --logger "console;verbosity=detailed"

dotnet ef migrations add <Name>   # Add EF Core migration
dotnet ef database update         # Apply pending migrations
```

### Docker (repo root `Source/`)

```bash
docker compose -f docker-compose.dev.yaml up --build   # Dev (watch mode, hot reload)
docker compose up --build -d                           # Production
docker compose down -v                                 # Tear down with volumes
```

---

## Architecture

### Request Flow

**Dev**: Browser → Caddy (port 80) → `/api/*` → API (8080) | other → Vite dev server (5173)  
**Prod**: Browser → Caddy (80/443) → `/api/*` → API (8080) | other → SvelteKit Node (3000)

File uploads live at `/app/uploads`, served by Caddy and shared across containers via a mounted volume.

### Backend Layers

```
Controller → Service → Repository → DbContext → PostgreSQL
```

- **Repository pattern**: Generic `Repository<T>` + `UnitOfWork` in `Backend/track-list-api/Repository/`
- **Services** (`Services/`): business logic — `AuthService`, `ReviewService`, `MediaGetService`, `TmdbService` (external TMDB API), `FeedService`, `SanitizerService` (HTML sanitization for user content)
- **DTOs** (`DTOs/`): all API responses use DTOs; never expose raw entities
- **Validators** (`Validators/`): FluentValidation on all inbound request models
- **Middleware** (`Middleware/GlobalExceptionHandler.cs`): catches all unhandled exceptions
- **Identity** (`Identity/`): JWT bearer auth; user claims carried in token (no server sessions)

### Key Data Entities

| Entity | Notes |
|---|---|
| `User` | Role: USER / ADMIN / MODERATOR |
| `Media` | Stores only non-text fields (ExternalApiId/TMDB, type, year, poster URL) |
| `MediaTranslation` | Localized title + synopsis; status PENDING → APPROVED via moderator |
| `Review` | One per user per media; soft-deleted (`DeletedAt`) |
| `Comment` | Self-referencing `ParentCommentId` for nested replies; soft-deleted |
| `Playlist` | User collection (public/private); sharing via `PlaylistAccess` |
| `TrackingStatus` | PLAN_TO_WATCH / WATCHING / COMPLETED / DROPPED |
| `Report` | Flagged content; status PENDING → RESOLVED |
| `Follow` | Self-referencing users (follower → following); unique constraint |

Soft-delete entities use a `DeletedAt` column with an EF Core global query filter defined in `DbContext/`.

### Frontend Structure

```
src/
  routes/         # File-based SvelteKit pages (auth, profile, feed, media, admin…)
  lib/
    components/   # Reusable Svelte UI components
    stores/       # Svelte stores for global client state (auth, user, feed)
    server/       # Server-side utilities (cookie/token helpers)
    types/        # TypeScript interfaces mirroring backend DTOs
    utils/        # Helper functions
  hooks.server.ts # Server middleware: validates JWT on every SSR request
```

### BDD Testing

Shared Gherkin feature files live in `Features/` (written in Ukrainian). Both the backend (Reqnroll + xUnit) and frontend (Cucumber.js) execute against the same `.feature` files. Scenarios cover: authentication, profile, feed, media pages, tracking, moderation, admin, collections, search, and reviews.

---

## Configuration

Environment variables are defined in `.env` (root) and `Backend/track-list-api/.env`. Key variables:

```
POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB / DB_HOST / DB_PORT
CONNECTION_STRING          # EF Core connection string
JWT_PRIVATE_KEY / JWT_AUDIENCE / JWT_ISSUER
FILE_STORAGE_PATH          # Path for user upload files
PUBLIC_API_URL             # Exposed to frontend via SvelteKit PUBLIC_ convention
```

---

## Conventions

- **Formatting**: Prettier enforces tabs, 100-char line width, Svelte plugin. Run `npm run lint` before committing frontend changes.
- **C# analysis**: SonarAnalyzer is active; fix any new warnings it raises.
- **Feature files**: Written in Ukrainian (`language: uk` in Gherkin header). Keep new scenarios in Ukrainian to match existing files.
- **Swagger**: Available in development at `/swagger`. All controllers should have XML doc comments for OpenAPI generation.
- **Logging**: Serilog with structured logging. Use `ILogger<T>` injection; avoid `Console.Write`.
