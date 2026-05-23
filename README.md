# LeadFlow - Provider Mini Lead Distribution System

LeadFlow is a high-performance, production-grade **Provider Mini Lead Distribution System** built with **Next.js**, **Express.js**, **Socket.IO**, and **Prisma/MongoDB**. 

The system automates the routing of service lead inquiries to exactly three registered provider partners in real time, enforcing strict business rules, monthly capacity quotas, duplicate check rules, and webhook notifications.

---

##  Core Features & Routing Rules

1. **Authentication & RBAC**:
   * Users can register and sign in as `ADMIN` (full access) or `SALES` (restricted access).
   * Middleware protects routes and blocks unauthorized management operations for restricted roles.
2. **3-Provider Routing Engine**:
   * **Service 1**: Dispatched to **Provider 1** (Mandatory) and two pool providers from **Provider 2, 3, and 4** via fair round-robin rotation.
   * **Service 2**: Dispatched to **Provider 5** (Mandatory) and two pool providers from **Provider 6, 7, and 8**.
   * **Service 3**: Dispatched to **Provider 1 & 4** (Mandatory) and one pool provider from **Provider 2, 3, 5, 6, 7, and 8**.
3. **Database-Level Unique Constraints**:
   * Prevents duplicate submissions for the same combination of `phone` and `category` within a configured timeframe, throwing a `409 Conflict`.
4. **Quota Capacity Enforcement & Rollbacks**:
   * Each provider has a monthly allocation quota (default `10`).
   * If exactly three eligible providers with quota remaining cannot be found, the system rolls back the transaction, leaving the lead in `PENDING`.
5. **Real-Time Synchronized Sockets**:
   * Socket.IO instantly pushes updates to the admin dashboard for new leads, auto-allocations, quota warnings, and duplicate reviews.
6. **Payment Webhook & Idempotency**:
   * Implements a webhook receiver endpoint that registers provider payments, resets quota usage to 0, and enforces transaction-level idempotency to prevent double-processing.

---

##  Technology Stack

* **Frontend**: Next.js 16 (React 19), Turbopack, Framer Motion (micro-animations), TailwindCSS, Lucide Icons, Shadcn-like Vanilla CSS.
* **Backend**: Node.js, Express.js (v5), Socket.IO (v4), TypeScript.
* **Database & ORM**: MongoDB Atlas, Prisma Client (v6) with transaction retry loops.
* **Testing**: Jest, Supertest (Integration and concurrency tests).

---

##  Directory Structure

```bash
├── app/                      # Next.js App Router (Frontend)
│   ├── dashboard/            # Admin Panel Views (Overview, Leads, Providers, Quotas, Logs, Reports)
│   ├── login/                # Authentication Portal (Sign In / Sign Up)
│   └── page.tsx              # Landing Ingestion Lead Form
├── components/               # Reusable React components & Contexts
│   ├── context/              # MockDataContext (Client API state & Sockets) and ThemeContext
│   └── ui/                   # Shared Premium Layout Components
├── src/                      # Express.js Server (Backend)
│   ├── controllers/          # Request Handler Controllers (Auth, Leads, Providers, Logs, Webhooks)
│   ├── middleware/           # Auth (RBAC), validation, and error handlers
│   ├── routes/               # Express endpoints router mounting
│   ├── services/             # Core Logic (Allocation Engine & Webhook retries)
│   └── server.ts             # Server entrypoint and seeder trigger
├── prisma/                   # Prisma database schemas and migration configuration
└── package.json              # Project script execution and package requirements
```

---

##  Local Installation & Setup

### Prerequisites
* Node.js (v18 or higher)
* MongoDB (Local instance or MongoDB Atlas cluster connection string)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd provider-lead-system
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and define the following variables:
```env
# MongoDB Connection URL
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.plqpxux.mongodb.net/lead_distribution?retryWrites=true&w=majority"

# Server Port
PORT=5000

# Authentication
JWT_SECRET="lead_distribution_super_secret_key_98765"
NODE_ENV="development"

# Duplicate Check Window Configuration (in hours)
DUPLICATE_WINDOW_HOURS=24
```

### 3. Initialize Prisma Client
```bash
npx prisma generate
```

---

## 🏃 Running the Application

This project runs the Next.js development server (frontend) and the Express.js server (backend) concurrently.

### Run Frontend Dev Server
```bash
npm run dev
# Running on http://localhost:3000
```

### Run Backend Dev Server
```bash
npm run backend:dev
# Running on http://localhost:5000 (real-time sockets active)
```

---

##  Testing & Verification

### Running Automated Integration Tests
Runs the full Jest test suite, verifying authentication, lead distribution rotation rules, duplicate validation, quota constraints, webhooks, and concurrent multi-write safety:
```bash
npm run test
```

### Manual Verification Flow
1. **Submit Leads**: Access `http://localhost:3000` to submit leads.
2. **Dashboard**: Log in to the Admin Panel (`admin@leadflow.com` / `password123`) to view graphs, distribution logs, and provider lists.
3. **Simulations**: Use the **Admin Testing** page to simulate concurrent transactions or trigger quota resets.
