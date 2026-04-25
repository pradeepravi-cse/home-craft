# HomeCraft — Business Manager

A full-stack mobile-first web app to manage your home-based business — services, products, customers, orders, and earnings.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Zustand + Recharts
- **Backend**: NestJS + TypeORM
- **Database**: PostgreSQL 16
- **Reverse Proxy**: Nginx
- **Containerisation**: Docker Compose

---

## 🚀 Quick Start

### 1. Clone / download and enter the project directory

```bash
cd homecraft
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Edit `.env` and set secure values:

```env
APP_PORT=8080
DB_USER=ppuser
DB_PASSWORD=your-strong-password
JWT_SECRET=your-random-32+-char-secret
JWT_EXPIRES_IN=7d
VITE_API_URL=/api
```

### 3. Start everything

```bash
docker compose up -d --build
```

### 4. Open in browser

```
http://localhost:8080
```

On first visit you will be prompted to **create your owner account**. After that the app is protected by JWT authentication.

---

## 📱 Cloudflare Tunnel (access from anywhere)

If you have `cloudflared` installed on your server:

```bash
cloudflared tunnel --url http://localhost:8080
```

Or create a named tunnel via the Cloudflare Zero Trust dashboard for a permanent public URL.

---

## 🏗️ Project Structure

```
homecraft/
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf          # Reverse proxy: /api → backend, / → frontend
├── backend/                # NestJS API
│   ├── src/
│   │   ├── auth/           # JWT authentication
│   │   ├── users/          # User accounts
│   │   ├── clients/        # Client profiles
│   │   ├── measurements/   # Saree measurements
│   │   ├── orders/         # Orders (pleating, draping, combo)
│   │   ├── expenses/       # Per-order expenses
│   │   ├── earnings/       # Revenue/profit analytics
│   │   ├── products/       # Baking products catalogue
│   │   ├── inventory/      # Stock management
│   │   └── dashboard/      # Overview stats
│   └── Dockerfile
└── frontend/               # React SPA
    ├── src/
    │   ├── api/            # Axios API client
    │   ├── store/          # Zustand auth store
    │   ├── components/     # Reusable UI & layout
    │   ├── pages/          # Dashboard, Clients, Orders, Earnings, Products
    │   └── utils/          # Formatters, constants
    ├── Dockerfile
    └── nginx.conf          # SPA routing
```

---

## 🔑 API Overview

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/products` | List public products (for future website) |
| GET | `/api/auth/setup` | Check if first-run setup needed |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register (first user only) |

### Protected (Bearer JWT required)
| Resource | Endpoints |
|----------|-----------|
| Clients | `GET/POST /clients`, `GET/PUT/DELETE /clients/:id` |
| Measurements | `GET /measurements/client/:id`, `POST/PUT/DELETE /measurements/:id` |
| Orders | `GET/POST /orders`, `GET/PUT/DELETE /orders/:id`, `PATCH /orders/:id/status` |
| Expenses | `GET /expenses/order/:id`, `POST/DELETE /expenses/:id` |
| Earnings | `GET /earnings/summary`, `GET /earnings/monthly`, `GET /earnings/by-type` |
| Products | `GET/POST /products`, `GET/PUT/DELETE /products/:id` |
| Inventory | `GET /inventory/stock`, `POST /inventory/transaction` |
| Dashboard | `GET /dashboard/overview` |

---

## 💰 Pricing Logic (auto-calculated)

| Service | Price |
|---------|-------|
| Saree Pleating (1 saree) | RM 20 |
| Saree Pleating (2+ sarees) | RM 15 per saree |
| Draping only | RM 30 |
| Combo (pleating + draping, 1 saree) | RM 40 (RM5 off each) |
| Combo (pleating + draping, 2+ sarees) | RM 25 per saree |

Prices are auto-suggested but editable per order.

---

## 📋 Order Flow

**Pleating journey:**
`Received → Processing → Ready → Collected → Completed`

**Draping journey:**
`Received → Processing → Draped → Completed`

**Combo:** follows Pleating flow.

---

## 🔧 Development (local, without Docker)

### Backend
```bash
cd backend
pnpm install
# Set DATABASE_URL in your environment
pnpm run start:dev
```

### Frontend
```bash
cd frontend
pnpm install
pnpm run dev
# Proxies /api → http://localhost:3000
```

---

## 🔄 Extending for Future Features

The app is designed to be extensible:

- **New business lines**: Add values to the `BusinessLine` enum in `product.entity.ts`
- **New order types**: Add to `OrderType` enum in `order.entity.ts`
- **Public website**: Use `GET /api/public/products` — no auth needed
- **New pages**: Add a route in `App.tsx` and a nav item in `AppLayout.tsx`
- **Database migrations**: Switch `synchronize: false` in `app.module.ts` and use TypeORM migrations

---

## 🛑 Stopping

```bash
docker compose down          # Stop containers (data preserved)
docker compose down -v       # Stop and delete all data
```
