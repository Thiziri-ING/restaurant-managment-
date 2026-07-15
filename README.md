# 🍽️ Restaurant Manager

Application complète de gestion de restaurant — Desktop (Electron) + Web (React) + API (NestJS)

---

## ⚡ Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 16+
- npm 10+

### 1. Cloner et installer

```bash
git clone <repo>
cd restaurant-management

# Backend
cd apps/backend
cp .env.example .env         # configurer DATABASE_URL et JWT secrets
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Base de données

```bash
cd apps/backend

# Créer la base + appliquer les migrations
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate

# Seed — crée rôles, permissions, utilisateurs de test, zones, tables
npm run prisma:seed
```

### 3. Lancement en développement

```bash
# Terminal 1 — Backend (port 3000)
cd apps/backend
npm run start:dev

# Terminal 2 — Frontend (port 5173)
cd apps/frontend
npm run dev
```

---

## 🐳 Démarrage avec Docker

```bash
cp .env.example .env        # configurer les variables
docker-compose up -d        # démarre PostgreSQL + Backend + Frontend

# Premier lancement — seed la base
docker exec restaurant_api npm run prisma:seed
```

Application disponible sur `http://localhost`

---

## 👤 Comptes de test

| Email                          | Mot de passe  | Rôle       |
|--------------------------------|---------------|------------|
| manager@restaurant.com         | password123   | MANAGER    |
| caissier@restaurant.com        | password123   | CAISSIER   |
| magasinier@restaurant.com      | password123   | MAGASINIER |

---

## 📁 Structure du projet

```
restaurant-management/
├── apps/
│   ├── backend/          # NestJS API (port 3000)
│   ├── frontend/         # React + Vite (port 5173)
│   └── desktop/          # Electron (wrapper du frontend)
├── docker-compose.yml
└── .env.example
```

---

## 🔑 Architecture Auth (JWT + Refresh Token)

```
Login → Access Token (15min) + Refresh Token (7j, stocké en DB)
       ↓
Request API → Header: Authorization: Bearer <accessToken>
       ↓ (si 401)
Auto-refresh → POST /auth/refresh → nouveaux tokens (rotation)
       ↓ (si refresh invalide)
Logout forcé → redirect /login
```

---

## 📡 API REST — Endpoints principaux

| Méthode | Route                          | Description                          |
|---------|--------------------------------|--------------------------------------|
| POST    | /api/auth/login                | Connexion                            |
| POST    | /api/auth/refresh              | Renouveler l'access token            |
| GET     | /api/products                  | Liste des produits de stock          |
| GET     | /api/products/alerts           | Produits en rupture/alerte           |
| POST    | /api/stock/entries             | Saisir une entrée de stock           |
| POST    | /api/stock/outputs             | Saisir une sortie de stock           |
| GET     | /api/menu/items                | Liste des plats                      |
| GET     | /api/tables                    | Tables par zone                      |
| POST    | /api/tables/merge              | Fusionner des tables                 |
| POST    | /api/tables/transfer           | Transférer une commande              |
| POST    | /api/orders                    | Créer une commande                   |
| PATCH   | /api/orders/:id/status         | Changer le statut                    |
| POST    | /api/invoices/:orderId         | Générer une facture                  |
| GET     | /api/invoices/:id/ticket       | Ticket PDF (80mm)                    |
| GET     | /api/invoices/:id/pdf          | Facture PDF (A5)                     |
| POST    | /api/cash-register/open        | Ouvrir la caisse                     |
| POST    | /api/cash-register/close       | Fermer la caisse                     |
| GET     | /api/reports/dashboard         | KPIs du tableau de bord              |
| GET     | /api/reports/sales             | Rapport des ventes                   |
| GET     | /api/reports/top-items         | Articles les plus vendus             |
| GET     | /api/reports/stock-state       | État du stock                        |

Documentation Swagger interactive disponible en dev sur : `http://localhost:3000/api/docs`

---

## 🖥️ Build Electron (Application Desktop Windows)

```bash
cd apps/desktop

# Copier le build frontend dans le dossier desktop
cp -r ../frontend/dist ./dist

# Build Windows (.exe installer)
npm run build:win

# Le fichier d'installation sera dans :
# apps/desktop/release/Restaurant Manager Setup x.x.x.exe
```

---

## 🧪 Tests

```bash
cd apps/backend

# Unit tests
npm test

# Coverage
npm run test:cov
```

---

## 🔐 Sécurité — checklist production

- [ ] Changer tous les secrets JWT dans `.env`
- [ ] Changer le mot de passe PostgreSQL
- [ ] Activer HTTPS sur le serveur Nginx
- [ ] Limiter les origines CORS (`FRONTEND_URL`)
- [ ] Activer `NODE_ENV=production`
- [ ] Activer le rate limiting (déjà configuré, vérifier `THROTTLE_LIMIT`)

---

## 📦 Modules Backend

| Module           | Description                                     |
|------------------|-------------------------------------------------|
| `auth`           | JWT, refresh token, strategies Passport         |
| `users`          | CRUD utilisateurs, activation/désactivation     |
| `roles`          | Rôles RBAC, permissions granulaires             |
| `stock/products` | Catalogue produits, alertes stock               |
| `stock/entries`  | Entrées de stock (avec fournisseur)             |
| `stock/outputs`  | Sorties de stock (avec validation quantité)     |
| `suppliers`      | CRUD fournisseurs                               |
| `menu`           | Plats et catégories menu                        |
| `tables`         | Tables, zones, fusion, transfert                |
| `reservations`   | Réservations avec détection de conflits         |
| `orders`         | Commandes POS, remises, offerts, retours        |
| `invoices`       | Facturation, paiement mixte, PDF, ticket 80mm  |
| `cash-register`  | Caisse, mouvements, solde théorique             |
| `reports`        | Dashboard KPIs, ventes, stock, top items        |
| `audit`          | Journal d'audit automatique toutes mutations    |
