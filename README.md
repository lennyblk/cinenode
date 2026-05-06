# CineNode

RESTful API de gestion de cinéma, construite avec **NestJS** et **TypeScript**.

---

## Tech Stack

| Catégorie        | Technologie                                         |
| ---------------- | --------------------------------------------------- |
| Framework        | NestJS (Node.js)                                    |
| Langage          | TypeScript                                          |
| Base de données  | MySQL 8                                             |
| ORM              | TypeORM                                             |
| Auth             | JWT stateful (access token 5min + refresh token 7j) |
| Validation       | class-validator + class-transformer                 |
| Documentation    | Swagger / OpenAPI                                   |
| Conteneurisation | Docker + Docker Compose                             |
| Reverse proxy    | Caddy (HTTPS automatique)                           |
| CI/CD            | GitHub Actions                                      |

---

## Production

| Service | URL                                 |
| ------- | ----------------------------------- |
| API     | `https://cinenode.lennyblk.dev`     |
| Swagger | `https://cinenode.lennyblk.dev/api` |

---

## Démarrage (développement)

```bash
git clone https://github.com/lennyblk/cinenode.git
cd cinenode

cp .env.example .env

# Lance MySQL + phpMyAdmin
docker compose -f docker-compose.dev.yaml up -d

pnpm install
pnpm run start:dev
```

| Service    | URL                         |
| ---------- | --------------------------- |
| API        | `http://localhost:3636`     |
| Swagger    | `http://localhost:3636/api` |
| phpMyAdmin | `http://localhost:8080`     |

---

## Variables d'environnement

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cinenode
DB_USER=cinenode
DB_PASSWORD=cinenode

JWT_AT_SECRET=
JWT_RT_SECRET=

PORT=3636
```

---

## Données de seed

Au premier lancement, les données suivantes sont insérées automatiquement :

| Donnée  | Détail                                        |
| ------- | --------------------------------------------- |
| Admin   | `admin@admin.com` / `Admin123!`               |
| Salles  | 10 salles variées (Standard, IMAX, 4DX, VIP)  |
| Films   | Plusieurs films avec durées, genres, affiches |
| Séances | Planifiées sur +1 mois à l'avance             |

---

## Routes API

### Auth

| Méthode | Route           | Description                         | Accès       |
| ------- | --------------- | ----------------------------------- | ----------- |
| POST    | `/auth/signup`  | Créer un compte                     | Public      |
| POST    | `/auth/signin`  | Se connecter                        | Public      |
| POST    | `/auth/logout`  | Se déconnecter (révoque les tokens) | Authentifié |
| POST    | `/auth/refresh` | Rafraîchir l'access token           | Authentifié |

### Salles

| Méthode | Route                    | Description                         | Accès       |
| ------- | ------------------------ | ----------------------------------- | ----------- |
| GET     | `/rooms`                 | Lister toutes les salles            | Authentifié |
| GET     | `/rooms/:id`             | Détail d'une salle                  | Authentifié |
| GET     | `/rooms/:id/schedule`    | Planning d'une salle (`?from=&to=`) | Authentifié |
| POST    | `/rooms`                 | Créer une salle                     | Admin       |
| PATCH   | `/rooms/:id`             | Modifier une salle                  | Admin       |
| PATCH   | `/rooms/:id/maintenance` | Activer/désactiver la maintenance   | Admin       |
| DELETE  | `/rooms/:id`             | Supprimer une salle                 | Admin       |

### Films

| Méthode | Route                  | Description                      | Accès       |
| ------- | ---------------------- | -------------------------------- | ----------- |
| GET     | `/movies`              | Lister tous les films            | Authentifié |
| GET     | `/movies/:id`          | Détail d'un film                 | Authentifié |
| GET     | `/movies/:id/schedule` | Séances d'un film (`?from=&to=`) | Authentifié |
| POST    | `/movies`              | Créer un film                    | Admin       |
| PATCH   | `/movies/:id`          | Modifier un film                 | Admin       |
| DELETE  | `/movies/:id`          | Supprimer un film                | Admin       |

### Séances

| Méthode | Route             | Description                                        | Accès       |
| ------- | ----------------- | -------------------------------------------------- | ----------- |
| GET     | `/screenings`     | Planning global (`?from=&to=`)                     | Authentifié |
| GET     | `/screenings/:id` | Détail d'une séance (billets vendus, places dispo) | Authentifié |
| POST    | `/screenings`     | Créer une séance                                   | Admin       |
| PATCH   | `/screenings/:id` | Modifier une séance                                | Admin       |
| DELETE  | `/screenings/:id` | Supprimer une séance                               | Admin       |

### Billets

| Méthode | Route                           | Description                              | Accès       |
| ------- | ------------------------------- | ---------------------------------------- | ----------- |
| GET     | `/tickets`                      | Tous les billets                         | Admin       |
| GET     | `/tickets/:id`                  | Détail d'un billet                       | Authentifié |
| GET     | `/tickets/user/:userId`         | Billets d'un utilisateur                 | Authentifié |
| GET     | `/tickets/user/:userId/history` | Historique billets utilisés + séances    | Authentifié |
| GET     | `/tickets/screening/:id/count`  | Nombre de billets vendus pour une séance | Authentifié |
| POST    | `/tickets/user/:userId/buy`     | Acheter un billet (classique ou super)   | Authentifié |
| POST    | `/tickets/:id/use`              | Utiliser un billet pour une séance       | Authentifié |
| POST    | `/tickets/:id/link-screening`   | Lier un super billet à une séance        | Authentifié |
| DELETE  | `/tickets/:id`                  | Supprimer un billet                      | Admin       |

### Portefeuilles

| Méthode | Route                       | Description                     | Accès       |
| ------- | --------------------------- | ------------------------------- | ----------- |
| GET     | `/wallets`                  | Tous les wallets + transactions | Admin       |
| GET     | `/wallets/:id`              | Détail d'un wallet              | Authentifié |
| GET     | `/wallets/user/:userId`     | Wallet d'un utilisateur         | Authentifié |
| GET     | `/wallets/:id/transactions` | Historique des transactions     | Authentifié |
| POST    | `/wallets/:id/deposit`      | Déposer de l'argent             | Authentifié |
| POST    | `/wallets/:id/withdraw`     | Retirer de l'argent             | Authentifié |
| DELETE  | `/wallets/:id`              | Supprimer un wallet             | Admin       |

### Utilisateurs

| Méthode | Route        | Description                  | Accès |
| ------- | ------------ | ---------------------------- | ----- |
| GET     | `/users`     | Lister tous les utilisateurs | Admin |
| GET     | `/users/:id` | Détail d'un utilisateur      | Admin |
| POST    | `/users`     | Créer un utilisateur         | Admin |
| PATCH   | `/users/:id` | Modifier un utilisateur      | Admin |
| DELETE  | `/users/:id` | Supprimer un utilisateur     | Admin |

---

## Ce qui est fait / pas fait

### Fait

- [x] Gestion des salles : CRUD complet, contrainte capacité 15-30 places, maintenance, planning par période
- [x] Gestion des films : CRUD complet, planning d'un film par période
- [x] Gestion des séances : CRUD complet, contrainte lundi-vendredi 9h-20h, durée min = film + 30 min, anti-chevauchement salle et film, billets vendus / places disponibles par séance
- [x] Authentification stateful : access token 5 min + refresh token 7 jours stockés en base, révocation au logout
- [x] Rôles : client / admin
- [x] Billets classiques (1 séance) et Super Billets (10 séances)
- [x] Portefeuille : dépôt, retrait, historique daté des transactions
- [x] Vérification solde insuffisant et salle complète à l'achat
- [x] Historique des billets utilisés avec séances associées
- [x] Admin : liste des utilisateurs, liste de toutes les transactions
- [x] Seed automatique : admin, 10+ salles, films, séances planifiées +1 mois
- [x] Swagger / OpenAPI complet
- [x] Docker multi-stage (build TypeScript → image JS uniquement en prod)
- [x] Déploiement en production avec HTTPS via Caddy
- [x] CI/CD GitHub Actions : tests avant chaque déploiement
- [x] Tests unitaires (auth, rooms, movies, screenings, wallets, tickets)

### Pas fait

- [ ] Statistiques de fréquentation (quotidien, hebdomadaire, temps réel)
- [ ] Activité détaillée d'un utilisateur pour l'admin (films vus, billets, dépenses)
- [ ] Rôle super_admin et planning des employés
- [ ] Observabilité (Prometheus, Grafana)
- [ ] Logs structurés JSON (Winston/Pino)
- [ ] Gestion des race conditions (SELECT FOR UPDATE)
- [ ] Backup de la base de données

---

## Scripts

```bash
pnpm run start:dev   # Développement avec hot reload
pnpm run build       # Compilation TypeScript → JavaScript
pnpm run lint        # ESLint
pnpm run test        # Tests unitaires
pnpm run seed        # Insérer les données de seed
```

---

## Auteurs

Sarah GARCIA · Lenny BLACKETT · Malo LAVAL

Projet réalisé dans le cadre du cursus [**ESGI**](https://www.esgi.fr/).
