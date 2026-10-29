# Village1 — All-in-One Local Village Shop Platform

**Village1** is a production-oriented local village commerce platform connecting customers with nearby village shops across Tamil Nadu, India. It enables customers to discover local shops, buy groceries and provisions, book salon appointments with live queue tokens, and collect orders locally.

---

## Architecture Overview

Village1 is structured as a modular monorepo:

```
Village1/
├── apps/
│   ├── web/               # Customer & Shopkeeper Web App (React + Vite + TypeScript + Tailwind CSS)
│   └── mobile/            # Android Application (React Native with Expo + TypeScript)
├── server/
│   ├── prisma/            # Database schemas (MySQL Production & SQLite Test/Dev fallback) & Seed script
│   ├── src/
│   │   ├── config/        # Environment and Prisma database client singletons
│   │   ├── middleware/    # Auth verification, Role checks, Rate limiting, Zod validation, Error handling
│   │   ├── modules/       # Domain modules: auth, users (ready for shops, orders, appointments)
│   │   ├── routes/        # Central API routing (/api/v1)
│   │   ├── utils/         # Bcrypt password hashing, JWT access/refresh token rotation, response formats
│   │   └── tests/         # Automated Vitest + Supertest integration tests
│   └── vitest.config.ts   # Vitest testing configuration
├── database/
│   └── schema/            # Database ER diagrams, relationship documentation, and constraints
├── .env.example           # Documented environment variable template
└── README.md              # Beginner-friendly setup and operational instructions
```

---

## Phase 1 & Phase 2 Deliverables Summary

- **Phase 1: Foundation, Multi-Tenant Database, Authentication & Security**:
  - Normalized schemas for MySQL (`prisma/schema.prisma`) and SQLite (`prisma/schema.sqlite.prisma`).
  - Bcrypt password hashing + short-lived JWT Access Tokens (15m) + cryptographic Refresh Tokens with reuse detection.
  - Role-Based Access Control (`CUSTOMER`, `SHOPKEEPER`, `ADMIN`) + Rate Limiting + Helmet + CORS.
  - Development seed data with 5 categories, sample accounts, and verified village shops.
  - Initial React web portal and Expo mobile app structure.

- **Phase 2: Shop Management & Super Admin Governance**:
  - **Shop Management Backend**:
    - Shop onboarding (`POST /api/v1/shops`) creating shops in `PENDING` status with `OWNER` membership.
    - Public directory (`GET /api/v1/shops/public`): strictly returns ONLY `APPROVED` and active shops.
    - Multi-shop management (`GET /api/v1/shops/my-shops`): lists all authorized branches for the shopkeeper.
    - Category browsing (`GET /api/v1/shops/categories`).
  - **Super Admin Control Center (`/admin` / `#admin`)**:
    - **Overview**: Real database stats (Users by role, Shops by status, Orders count, zero-fabrication revenue notice, recent audit trail).
    - **Approval Queue**: Dedicated review queue for `PENDING` shops with one-click Approve and Reject (with mandatory reason).
    - **Shops Directory**: Searchable, filterable by status (`PENDING`, `APPROVED`, `SUSPENDED`, `REJECTED`) with suspend and reactivate actions.
    - **Users Governance**: Searchable, filterable by role and status, with account deactivation/reactivation safeguards (self-deactivation and last admin protection).
    - **Security Audit Logs**: Real-time audit history tracking all administrative approvals, rejections, suspensions, and user modifications.
  - **Automated Tests**:
    - **33 comprehensive integration tests passing with 100% success** (18 Auth tests + 15 Admin & Shop Lifecycle tests).

---

## Quick-Fill Demo Credentials (Development Only)

| Role | Email / Phone | Password | Village Location |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@village1.in` / `9999900001` | `AdminSecure@123` | Chennai Central Office |
| **Shopkeeper** | `shopkeeper@village1.in` / `9876543210` | `Shopkeeper@123` | Alanganallur, Madurai (2 Shops) |
| **Customer** | `customer@village1.in` / `9123456780` | `Customer@123` | Alanganallur, Madurai |

---

## Getting Started (Windows PowerShell Commands)

### 1. Prerequisites
- **Node.js**: v18+ or v22+ (`node -v`)
- **npm**: v9+ or v10+ (`npm -v`)
- **MySQL**: (Optional for production; SQLite is configured out-of-the-box for instant local development and testing)

---

### 2. Environment Setup

Copy `.env.example` to `server/.env`:

```powershell
# In project root
Copy-Item .env.example server/.env
```

To use **MySQL**, edit `server/.env` and update the connection URL:
```env
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/village1_db"
```

To run **instantly without installing MySQL**, keep the default SQLite URL:
```env
DATABASE_URL="file:./dev.db"
```

---

### 3. Database Initialization & Seeding

Navigate to `server` and sync the database schema:

```powershell
cd server
npm install

# For instant SQLite:
npm run prisma:push:sqlite

# Run development seed script:
npm run db:seed
```

*(For MySQL: run `npx prisma db push` or `npx prisma migrate dev --name init`)*

---

### 4. Running Automated Tests

To run the Vitest + Supertest integration test suite:

```powershell
cd server
npm test
```

Expected output: **18 tests passing (100% pass rate)**.

---

### 5. Running the Backend API Server

```powershell
cd server
npm run dev
```

- API Base URL: `http://localhost:5000/api/v1`
- Health Check: `http://localhost:5000/api/v1/health`
- Interactive Swagger UI: `http://localhost:5000/api-docs`

---

### 6. Running the Web Frontend

In a separate terminal window:

```powershell
cd apps/web
npm install
npm run dev
```

- Website URL: `http://localhost:5173`
- The Vite development server automatically proxies `/api` requests to `http://localhost:5000`.

---

### 7. Running the Mobile App (Expo)

In a separate terminal window:

```powershell
cd apps/mobile
npm install
npm start
```

Press `a` to open in Android Emulator or scan the QR code with the Expo Go app on a physical Android device.

---

## Production Security Best Practices

1. **Environment Secrets**: Never commit real database passwords or JWT secrets to Git.
2. **Access Tokens**: Keep access token expiration short (15 minutes); rotate refresh tokens on every request.
3. **Database Transactions**: Always execute multi-table updates (e.g. order creation + inventory deduction) inside transactions.
4. **Role Checks**: All administrative and shopkeeper APIs enforce server-side role and membership validation.
