# Inventory Backend

NestJS + MongoDB backend for inventory management. The service exposes JWT-protected REST endpoints for users, categories, products, and audit logs, with Swagger documentation available out of the box.

## Overview

This API is built around a few core concepts:

- Authentication with JWT bearer tokens
- Role-based authorization for admin-only actions
- MongoDB persistence through Mongoose
- Request validation with Zod
- Audit logging for the most important business actions
- Swagger/OpenAPI docs for interactive exploration

The application uses a global API prefix of `/api`, so every route documented below is mounted under that prefix.

## Features

- Login with email and password
- Admin-only user registration
- List users
- Create, list, and delete categories
- Create, list, update quantity, and delete products
- Query audit logs by user, product, category, event, and date range
- Expose the supported log event types through the API
- Serve Swagger UI at `/api/docs`

## Tech Stack

- NestJS 11
- MongoDB
- JWT authentication with `passport-jwt`
- Password hashing with `bcrypt`
- Zod request validation
- Swagger/OpenAPI via `@nestjs/swagger`

## Project Structure

- `src/main.ts` boots the app, enables CORS, sets the global `/api` prefix, and configures Swagger
- `src/app.module.ts` wires the feature modules together
- `src/auth` contains authentication, JWT strategy, and role guards
- `src/users` contains user persistence and user routes
- `src/categories` contains category persistence and routes
- `src/products` contains product persistence and routes
- `src/log` contains audit log persistence and routes
- `src/database` configures the MongoDB connection
- `src/config` contains environment validation and Swagger setup
- `src/common/pipes/zod-validation.pipe.ts` adapts Zod schemas to Nest validation errors

## Requirements

- Node.js
- npm
- MongoDB instance accessible from the application

## Installation

```bash
npm install
```

## Running The App

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

The server starts on the configured `PORT` and exposes the API under:

```text
http://localhost:<PORT>/api
```

Swagger UI is available at:

```text
http://localhost:<PORT>/api/docs
```

## Scripts

| Script                | Description                                     |
| --------------------- | ----------------------------------------------- |
| `npm run build`       | Compile the application with Nest CLI.          |
| `npm run start`       | Start the app once.                             |
| `npm run start:dev`   | Start the app in watch mode.                    |
| `npm run start:debug` | Start the app in debug watch mode.              |
| `npm run start:prod`  | Run the compiled app from `dist/main`.          |
| `npm run format`      | Format TypeScript files with Prettier.          |
| `npm run lint`        | Run ESLint with auto-fix.                       |
| `npm test`            | Run the Jest unit test suite.                   |
| `npm run test:watch`  | Run Jest in watch mode.                         |
| `npm run test:cov`    | Run Jest with coverage output.                  |
| `npm run test:debug`  | Run Jest in Node debug mode.                    |
| `npm run test:e2e`    | Run end-to-end tests using the e2e Jest config. |

## Authentication

Most routes require a bearer token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

### Login

`POST /api/auth/login` is public and returns:

```json
{
	"user": {
		"id": "66b8d8d3f3b6f5d0f1a11111",
		"email": "operator@inventory.local",
		"role": "OPERATOR",
		"createdAt": "2026-06-22T10:00:00.000Z",
		"updatedAt": "2026-06-22T10:00:00.000Z"
	},
	"token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Registration

`POST /api/auth/register` is restricted to `ADMIN` users and requires a valid bearer token.

### Roles

The application currently supports these roles:

- `ADMIN`
- `OPERATOR`

Role checks are enforced with guards:

- Routes marked with `@Public()` skip JWT authentication
- Routes marked with `@Roles(...)` require one of the listed roles

### Operational Note

The current JWT strategy extracts tokens from the bearer header and validates them with `JWT_SECRET`. Token expiration is not enforced by the strategy as implemented, so operational token lifecycle management should be handled separately if needed.

## Validation Rules

Request validation is enforced with Zod and translated into HTTP 400 responses.

### Auth

- Email must be valid and is normalized to lowercase
- Login password must be non-empty
- Registration password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one special character from `!@#$%^&*`
- Registration role must be `ADMIN` or `OPERATOR`

### Categories

- Category names are trimmed and must not be empty
- Category names are treated case-insensitively for uniqueness

### Products

- Product name must be non-empty
- Category ID must be supplied
- Quantity must be a number greater than or equal to `0`
- Product and category identifiers must be valid MongoDB ObjectIds where applicable

### Logs

- `pageSize` must be a positive integer
- `user`, `product`, and `category` filters must be non-empty strings if provided
- `event` must be one of the supported log event names
- `startDate` and `endDate` must be valid dates
- If both dates are provided, `startDate` must be less than or equal to `endDate`

## API Reference

All routes below are mounted under `/api`.

### Auth

| Method | Path             | Auth   | Description                           |
| ------ | ---------------- | ------ | ------------------------------------- |
| `POST` | `/auth/login`    | Public | Login and receive a JWT access token. |
| `POST` | `/auth/register` | Admin  | Register a new user.                  |

#### `POST /api/auth/login`

Request body:

```json
{
	"email": "operator@inventory.local",
	"password": "P@ssw0rd!"
}
```

#### `POST /api/auth/register`

Request body:

```json
{
	"email": "operator@inventory.local",
	"password": "P@ssw0rd!",
	"role": "OPERATOR"
}
```

### Users

| Method   | Path         | Auth         | Description     |
| -------- | ------------ | ------------ | --------------- |
| `GET`    | `/users`     | JWT required | List all users. |
| `DELETE` | `/users/:id` | Admin        | Delete a user.  |

`DELETE /api/users/:id` returns `204 No Content` on success.

### Categories

| Method   | Path                           | Auth         | Description                                 |
| -------- | ------------------------------ | ------------ | ------------------------------------------- |
| `GET`    | `/categories`                  | JWT required | List all categories.                        |
| `POST`   | `/categories?categoryName=...` | JWT required | Create a category.                          |
| `DELETE` | `/categories/:id`              | Admin        | Delete a category and its related products. |

Category creation uses a query parameter instead of a JSON body:

```text
POST /api/categories?categoryName=Hardware
```

Deleting a category also deletes any products assigned to it and records corresponding audit log entries.

### Products

| Method   | Path                         | Auth         | Description              |
| -------- | ---------------------------- | ------------ | ------------------------ |
| `GET`    | `/products`                  | JWT required | List all products.       |
| `POST`   | `/products`                  | JWT required | Create a product.        |
| `PATCH`  | `/products/:id?quantity=...` | JWT required | Update product quantity. |
| `DELETE` | `/products/:id`              | Admin        | Delete a product.        |

Create product request body:

```json
{
	"name": "Wireless Mouse",
	"categoryId": "6869bb4a4fa3b392b0cbab1a",
	"quantity": 25
}
```

Update quantity uses a query parameter:

```text
PATCH /api/products/6869bb4a4fa3b392b0cbab1a?quantity=15
```

### Logs

| Method | Path          | Auth         | Description                         |
| ------ | ------------- | ------------ | ----------------------------------- |
| `GET`  | `/log/events` | JWT required | List all supported log event names. |
| `POST` | `/log`        | JWT required | Query logs with filters.            |

#### `POST /api/log`

Request body:

```json
{
	"pageSize": 25,
	"event": "PRODUCT_CREATE",
	"startDate": "2026-01-01T00:00:00.000Z",
	"endDate": "2026-01-31T23:59:59.999Z"
}
```

Optional filters:

- `user`
- `product`
- `category`
- `event`
- `startDate`
- `endDate`

The response is sorted by newest log first and limited by `pageSize`.

If a referenced user has been deleted, the API returns a placeholder user entry in the log payload instead of failing the request.

## Log Events

Supported audit events:

- `CATEGORY_CREATE`
- `CATEGORY_DELETE`
- `PRODUCT_CREATE`
- `PRODUCT_DELETE`
- `PRODUCT_UPDATE`
- `USER_DELETE`
- `USER_LOGIN`
- `USER_REGISTER`

These are also returned by `GET /api/log/events`.

## Data Model Summary

### User

- `email`
- `password` hash
- `role`
- timestamps

### Category

- `name`
- timestamps

### Product

- `name`
- `quantity`
- `category` reference
- timestamps

### Log

- `event`
- `timestamp`
- `user` reference
- optional product snapshot
- optional category snapshot
- optional details

Audit records preserve a snapshot of related entities at the time of the event, which makes historical queries more reliable even after deletes.

## Swagger

Swagger UI is configured with bearer auth support and persists authorization in the browser session.

Open:

```text
/api/docs
```

Use the `Authorize` button and provide:

```text
Bearer <token>
```

## Error Handling

The API uses standard HTTP status codes:

- `200` and `201` for successful reads and writes
- `204` for successful deletes
- `400` for validation errors
- `401` for missing or invalid JWTs
- `403` for insufficient role permissions
- `404` when a resource does not exist
- `409` for duplicate email or category conflicts

## Development Notes

- CORS is enabled globally
- MongoDB connection retries are configured in `src/database/database.module.ts`
- Database DNS servers can be overridden with `MONGODB_DNS_SERVERS`
- Time fields are serialized as ISO strings in API responses

## Testing

Run the test suites with:

```bash
npm test
npm run test:e2e
```

Coverage is available with:

```bash
npm run test:cov
```

## License

UNLICENSED
