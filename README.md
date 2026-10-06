<div align="center">
  <img src="public/images/logo/light_logo.png" width="120" height="120" alt="EventKey Logo" onerror="this.src='public/manifest/icon-192x192.png'; this.onerror=null;">
  <h1>EventKey</h1>
  <p><b>One Scan. One Entry.</b></p>
</div>

**EventKey** is a high-performance event management and secure QR pass validation platform. Built for instant, atomic access control, EventKey ensures single-use ticket entry with zero double-scans, seamless QR code pass generation, real-time admin scanner validation, and comprehensive check-in analytics.

![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Prisma](https://img.shields.io/badge/Prisma-39827E?style=for-the-badge&logo=Prisma&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-FF4154?style=for-the-badge&logo=auth0&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 🏗️ System Architecture

```text
                    ┌───────────────┐
                    │     Admin     │
                    └───────┬───────┘
                            │
                       Create Event
                            │
                            ▼
                    ┌───────────────┐
                    │ Event + Pass  │
                    │ PostgreSQL    │
                    └───────┬───────┘
                            │
                       Random Token
                            │
                            ▼
                       QR Generator
                            │
                            ▼
                         User QR
                            │
                            │
                     User arrives
                            │
                            ▼
                    ┌───────────────┐
                    │ Admin Scanner │
                    └───────┬───────┘
                            │
                       Scan Token
                            │
                            ▼
                    ┌───────────────┐
                    │ Next.js API   │
                    │ Server        │
                    └───────┬───────┘
                            │
                     Atomic validation
                            │
                 ┌──────────┴──────────┐
                 │                     │
             APPROVED                DENIED
                 │                     │
                 ▼                     ▼
          ACTIVE → USED          Log rejection
                 │
                 ▼
            CheckIn record
```

---

## 🌐 Application URL Structure

Assuming base domain `eventkey.com`:

| URL | Description |
| :--- | :--- |
| `eventkey.com` | Public Landing & Main Portal |
| `eventkey.com/admin` | Admin Dashboard |
| `eventkey.com/events` | Events Management Overview |
| `eventkey.com/events/[eventId]` | Event Details & Summary |
| `eventkey.com/events/[eventId]/passes` | Pass & Ticket Generator / Manager |
| `eventkey.com/events/[eventId]/scanner` | Gate / Admin QR Code Scanner |
| `eventkey.com/events/[eventId]/check-ins` | Live Check-In Log & Analytics |
| `eventkey.com/p/[token]` | Public User Pass View & QR Code |

---

## 🌟 Key Features

### 🎟️ Event & Pass Management
- **Event Creation**: Admins create and configure events with capacity, dates, and venue settings.
- **Secure Token Pass Generation**: Generates cryptographically secure, random tokens for every attendee pass.
- **Dynamic QR Generator**: Visual QR code rendering accessible by users at `/p/[token]`.

### ⚡ Atomic Gate Scanner & Validation
- **Real-Time QR Scanner**: Built-in camera scanner for gate controllers at `/events/[eventId]/scanner`.
- **Atomic Validation Engine**: Prevents double-scans and concurrent fraud by executing atomic state transitions (`ACTIVE` → `USED`) on scan.
- **Instant Approval / Denial**: Clear visual & auditory feedback for valid entries vs. rejected/duplicate passes.
- **Rejection Logging**: Every denied scan (expired, invalid token, or already used) is securely audited.

### 📊 Real-Time Check-In Records
- **Live Attendance Feed**: Track real-time arrivals and total check-in percentage.
- **Auditable History**: Detailed log of every entry timestamp and scanner node.

### 🔒 Enterprise Security & Auth
- **Better Auth Integration**: Multi-role security (Admin / User), passkey support, and session management.
- **Role-Based Access Control (RBAC)**: Strict access guards protecting admin scanning endpoints and event management routes.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack) & [React 19](https://react.dev/)
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State & Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **QR Code Engine**: `react-qr-code`
- **Animations & Toast**: [Framer Motion](https://www.framer.com/) & `sonner`

---

## 🚀 Local Setup

### Prerequisites
- **Node.js**: `v22` or later
- **PostgreSQL**: Local instance or Docker container
- **Package Manager**: `npm`

### 1. Clone the repository
```bash
git clone https://github.com/Murlidhar08/EventKey.git
cd EventKey
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Configure your environment variables:
- `DATABASE_URL`: Connection string to your PostgreSQL instance.
- `BETTER_AUTH_SECRET`: Random key for session encryption.
- `BETTER_AUTH_URL`: Base application URL (e.g. `http://localhost:3000`).

### 4. Database Setup
Push schema and generate Prisma client:
```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npm run db:generate
```

### 5. Generate Auth Client
```bash
npm run auth:generate
```

### 6. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view EventKey.

---

## 🐳 Docker Deployment

EventKey is fully containerized. You can launch it using Docker Compose:

### Option A: App + PostgreSQL Container
```bash
docker-compose --file docker-compose.yml up -d --build
```

### Option B: App Only (Connecting to External Database)
```bash
docker-compose --file docker-compose-without-db.yml up -d --build
```

---

## 📄 License

This repository is private and intended for EventKey internal use.

---

Built with ❤️ by the **EventKey Team**.
