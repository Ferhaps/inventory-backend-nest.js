# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev          # run with watch/reload
npm run build              # nest build -> dist/
npm run start:prod         # node dist/main (requires build first)
npm run lint               # eslint --fix over {src,apps,libs,test}
npm run format             # prettier --write

npm test                   # jest unit tests (*.spec.ts under src/)
npm run test:cov           # with coverage
npm run test:e2e           # uses test/jest-e2e.json
npx jest src/path/to/file.spec.ts          # run a single test file
npx jest -t "name of test"                 # run tests matching a name
```

Required environment variables (validated at boot by `validateEnvironment` in [src/config/environment.ts](src/config/environment.ts) — the app fails to start if any are invalid): `PORT`, `CONNECTION_STRING` (must match `mongodb://`/`mongodb+srv://`), `JWT_SECRET`. Optional: `MONGODB_DNS_SERVERS` (comma-separated; passed to `dns.setServers` to override resolution for Atlas/SRV).

The server mounts everything under the global prefix `/api`; Swagger UI is at `/api/docs`.

## Architecture

NestJS 11 + Mongoose (MongoDB). Feature modules (`auth`, `users`, `categories`, `products`, `log`) are wired in [src/app.module.ts](src/app.module.ts); `database` and `config` are infrastructure.

### Authentication & authorization are global-by-default
Two guards are registered as `APP_GUARD` in [src/auth/auth.module.ts](src/auth/auth.module.ts), so they apply to **every** route automatically:
- `JwtAuthGuard` — requires a valid bearer JWT unless the handler/class is marked `@Public()` ([src/auth/public.decorator.ts](src/auth/public.decorator.ts)). Currently only `POST /api/auth/login` is public.
- `RolesGuard` — enforces `@Roles(UserRole.ADMIN)` etc. ([src/auth/roles.decorator.ts](src/auth/roles.decorator.ts)). No `@Roles` means any authenticated user passes.

The JWT strategy ([src/auth/jwt.strategy.ts](src/auth/jwt.strategy.ts)) uses `ignoreExpiration: true` — **tokens never expire** as implemented. The decoded `JwtPayload` (`{ sub, email, role }`) is attached to `request.user`; controllers read `request.user.sub` for the actor id (see `AuthenticatedRequest`).

### Validation: per-route Zod, not a global pipe
There is no global `ValidationPipe`. Each route opts in with `new ZodValidationPipe(schema)` ([src/common/pipes/zod-validation.pipe.ts](src/common/pipes/zod-validation.pipe.ts)), which maps Zod issues to a 400 `BadRequestException`. Schemas live in `*.schemas.ts` next to each module. Note several endpoints validate **query params** rather than a JSON body (e.g. `POST /categories?categoryName=...`, `PATCH /products/:id?quantity=...`).

### Audit logging via snapshots
Mutating service methods call `LogService.create(...)` ([src/log/log.service.ts](src/log/log.service.ts)) after the change, passing the actor's user id plus a **snapshot** (`{ id, name }`) of the affected product/category. Snapshots are stored on the log document so historical queries still work after the entity is deleted; a deleted referenced user is rendered as a `User deleted` placeholder rather than failing the query. Import `LogModule` into any feature module that needs to write logs. Cascade example: deleting a category also deletes its products and writes one `CATEGORY_DELETE` + one `PRODUCT_DELETE` log per product ([src/categories/categories.service.ts](src/categories/categories.service.ts)).

### DTO / persistence conventions
- DTO types and `toXxxDto(...)` mapping helpers are defined as module-level functions inside the service files (not separate DTO classes for responses).
- Services return DTOs with `_id` stringified and dates as ISO strings; never leak raw Mongoose documents.
- ObjectId coercion/validation goes through small helpers (`toObjectIdOrThrow`, etc.); category uniqueness is case-insensitive via Mongo collation `{ locale: 'en', strength: 2 }` plus a duplicate-key (11000) catch.
- `DatabaseModule` is `@Global()` and configures connection retries (`retryAttempts: 3`, `retryDelay: 3000`).

### Testing
Jest runs from `rootDir: src`, matching `*.spec.ts`. `mongodb-memory-server` is available for integration-style tests against a real in-memory Mongo. e2e tests use the separate `test/jest-e2e.json` config.

## Conventions
- Source is formatted with tabs (Prettier). Run `npm run lint`/`npm run format` before considering work done.
- Log event names are the literal union `LOG_EVENTS` in [src/log/types.ts](src/log/types.ts); add new events there and they are automatically surfaced by `GET /api/log/events`.
