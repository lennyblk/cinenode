# CineNode

RESTful API for cinema management, built with **NestJS** and **TypeScript**.

---

## Tech Stack

| Category         | Technology                              |
| ---------------- | --------------------------------------- |
| Framework        | NestJS (Node.js)                        |
| Language         | TypeScript                              |
| Database         | MySql                                   |
| ORM              | TypeORM                                 |
| Auth             | JWT (access token 5min + refresh token) |
| Validation       | class-validator + class-transformer     |
| Documentation    | Swagger / OpenAPI                       |
| Containerization | Docker + Docker Compose                 |
| Observability    | Prometheus + Grafana                    |
| CI/CD            | GitHub Actions                          |

---

## Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [Docker](https://docker.com) + Docker Compose

---

## Getting started (development)

```bash
git clone https://github.com/lennyblk/cinenode.git
cd cinenode

cp .env.example .env

docker compose -f docker-compose.dev.yml up -d

npm install
npm run start:dev
```

| Service | URL                         |
| ------- | --------------------------- |
| API     | `http://localhost:3000`     |
| Swagger | `http://localhost:3000/api` |

---

## Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

> The production image contains only compiled JavaScript. TypeScript is not present in the prod image.

---

## Environment variables

Copy `.env.example` and fill in the values:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cinenode
DATABASE_USER=postgres
DATABASE_PASSWORD=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=5m
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
```

---

## Project structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── dto/
├── rooms/
│   ├── rooms.module.ts
│   ├── rooms.controller.ts
│   ├── rooms.service.ts
│   └── dto/
├── movies/
│   ├── movies.module.ts
│   ├── movies.controller.ts
│   ├── movies.service.ts
│   └── dto/
├── screenings/
│   ├── screenings.module.ts
│   ├── screenings.controller.ts
│   ├── screenings.service.ts
│   └── dto/
├── tickets/
│   ├── tickets.module.ts
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   └── dto/
├── wallet/
│   ├── wallet.module.ts
│   ├── wallet.controller.ts
│   └── wallet.service.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   └── users.service.ts
├── stats/
│   ├── stats.module.ts
│   ├── stats.controller.ts
│   └── stats.service.ts
├── database/
│   └── database.module.ts
├── app.module.ts
└── main.ts
```

---

## API Routes

> Full documentation available at `/api` (Swagger).

### Auth

| Method | Route            | Description                   | Access        |
| ------ | ---------------- | ----------------------------- | ------------- |
| POST   | `/auth/register` | Create an account             | Public        |
| POST   | `/auth/login`    | Sign in                       | Public        |
| POST   | `/auth/logout`   | Sign out (deletes all tokens) | Authenticated |
| POST   | `/auth/refresh`  | Refresh access token          | Authenticated |

### Rooms

| Method | Route                    | Description                  | Access        |
| ------ | ------------------------ | ---------------------------- | ------------- |
| GET    | `/rooms`                 | List all rooms               | Authenticated |
| POST   | `/rooms`                 | Create a room                | Admin         |
| PATCH  | `/rooms/:id`             | Update a room                | Admin         |
| DELETE | `/rooms/:id`             | Delete a room                | Admin         |
| PATCH  | `/rooms/:id/maintenance` | Toggle maintenance mode      | Admin         |
| GET    | `/rooms/:id/schedule`    | Room schedule (`?from=&to=`) | Authenticated |

### Movies

| Method | Route                  | Description                   | Access        |
| ------ | ---------------------- | ----------------------------- | ------------- |
| GET    | `/movies`              | List all movies               | Authenticated |
| POST   | `/movies`              | Create a movie                | Admin         |
| PATCH  | `/movies/:id`          | Update a movie                | Admin         |
| DELETE | `/movies/:id`          | Delete a movie                | Admin         |
| GET    | `/movies/:id/schedule` | Movie schedule (`?from=&to=`) | Authenticated |

### Screenings

| Method | Route             | Description                    | Access        |
| ------ | ----------------- | ------------------------------ | ------------- |
| GET    | `/screenings`     | Global schedule (`?from=&to=`) | Authenticated |
| POST   | `/screenings`     | Create a screening             | Admin         |
| PATCH  | `/screenings/:id` | Update a screening             | Admin         |
| DELETE | `/screenings/:id` | Delete a screening             | Admin         |

### Tickets

| Method | Route                | Description                          | Access        |
| ------ | -------------------- | ------------------------------------ | ------------- |
| POST   | `/tickets/buy`       | Buy a single ticket                  | Authenticated |
| POST   | `/tickets/buy-super` | Buy a super ticket (x10 sessions)    | Authenticated |
| GET    | `/tickets/mine`      | My tickets and associated screenings | Authenticated |

### Wallet

| Method | Route              | Description                     | Access        |
| ------ | ------------------ | ------------------------------- | ------------- |
| GET    | `/wallet`          | Balance and transaction history | Authenticated |
| POST   | `/wallet/deposit`  | Add funds                       | Authenticated |
| POST   | `/wallet/withdraw` | Withdraw funds                  | Authenticated |

### Stats (Admin)

| Method | Route                      | Description                     | Access |
| ------ | -------------------------- | ------------------------------- | ------ |
| GET    | `/stats/attendance`        | Attendance stats (`?from=&to=`) | Admin  |
| GET    | `/stats/attendance/daily`  | Daily attendance                | Admin  |
| GET    | `/stats/attendance/weekly` | Weekly attendance               | Admin  |
| GET    | `/stats/live`              | Real-time occupancy rates       | Admin  |

---

## Scripts

```bash
npm run start:dev      # Development with hot reload
npm run build          # Compile TypeScript to JavaScript
npm run start:prod     # Run the compiled build
npm run lint           # ESLint
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
```

---

## Authors

Sarah GARCIA
Lenny BLACKETT
Malo LAVAL

Project built as part of the **ESGI** curriculum.
