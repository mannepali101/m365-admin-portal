# ⚡ M365 Admin Portal — Phase 1

> **Production-ready centralized IT administration dashboard for Microsoft 365.**
> Authenticated via Microsoft Entra ID (Azure AD) · OAuth 2.0 PKCE · MSAL

---

## Architecture

```
m365-admin-portal/
├── backend/                    Node.js + Express API
│   └── src/
│       ├── config/env.ts       Validated environment config (Zod)
│       ├── middleware/
│       │   ├── auth.ts         Token validation + RBAC guards
│       │   ├── auditLogger.ts  Every admin action logged
│       │   └── errorHandler.ts Structured error responses
│       ├── routes/
│       │   ├── auth.ts         /login /callback /me /logout /refresh
│       │   └── dashboard.ts    /summary /recent-activity (Graph API)
│       ├── services/
│       │   ├── msalService.ts  MSAL ConfidentialClient + token refresh
│       │   └── graphClient.ts  Authenticated Graph API client factory
│       ├── utils/
│       │   ├── AppError.ts     Operational error class + asyncHandler
│       │   └── tokenStore.ts   AES-256-GCM encrypted in-memory token cache
│       └── server.ts           Express app bootstrap
│
└── frontend/                   Next.js 14 (App Router) + Tailwind CSS
    └── src/
        ├── app/
        │   ├── layout.tsx      Root layout (AuthProvider wrapper)
        │   ├── page.tsx        Root → redirects to /dashboard
        │   ├── login/          Login page (Microsoft sign-in button)
        │   ├── auth/callback/  OAuth redirect handler
        │   ├── dashboard/      Protected dashboard pages
        │   │   ├── layout.tsx  Auth guard + Sidebar + Topbar
        │   │   └── page.tsx    Overview widgets (Graph API data)
        │   └── settings/       User profile & portal config
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx   Navigation + user footer
        │   │   └── Topbar.tsx    Search + notifications + user menu
        │   ├── ui/
        │   │   ├── LoadingSpinner.tsx
        │   │   └── ErrorBanner.tsx
        │   └── widgets/
        │       └── StatsCard.tsx  Metric card with skeleton loader
        ├── lib/
        │   ├── auth/
        │   │   ├── msalConfig.ts   MSAL configuration + scopes
        │   │   └── AuthProvider.tsx Context + hooks (login/logout/token)
        │   ├── api/
        │   │   └── client.ts       Typed API client (auto session cookies)
        │   ├── hooks/
        │   │   └── useApi.ts       Generic async hook (loading/error/data)
        │   └── utils/cn.ts         Tailwind class merger
        ├── middleware.ts           Edge middleware (route protection)
        ├── styles/globals.css      Tailwind + custom design tokens
        └── types/index.ts          Shared TypeScript types
```

---

## Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 9
- **Microsoft Azure subscription** with an active Entra ID tenant
- An **App Registration** in Azure Portal

---

## Step 1 — Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**

2. **Name**: `M365 Admin Portal`
   **Supported account types**: `Accounts in this organizational directory only`
   **Redirect URI**: Platform = `Single-page application (SPA)`
   URI = `http://localhost:3000/auth/callback`

3. After creation, note down:
   - **Application (client) ID**
   - **Directory (tenant) ID**

4. Go to **Certificates & secrets** → **New client secret** → Copy the value immediately

5. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated**:
   Add all of these:
   ```
   User.ReadWrite.All
   Group.ReadWrite.All
   DeviceManagementManagedDevices.ReadWrite.All
   Reports.Read.All
   AuditLog.Read.All
   Directory.ReadWrite.All
   Sites.ReadWrite.All
   Team.ReadBasic.All
   offline_access
   openid
   profile
   email
   ```
   Then click **Grant admin consent for [your tenant]**

6. Go to **Authentication** → under Implicit grant and hybrid flows:
   Check **ID tokens** and **Access tokens**
   Add logout URL: `http://localhost:3000/login`

---

## Step 2 — Environment Variables

### Backend
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<your-client-id>
AZURE_CLIENT_SECRET=<your-client-secret>
AZURE_REDIRECT_URI=http://localhost:3000/auth/callback
SESSION_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
ENCRYPTION_KEY=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_AZURE_TENANT_ID=<your-tenant-id>
NEXT_PUBLIC_AZURE_CLIENT_ID=<your-client-id>
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_APP_NAME=M365 Admin Portal
```

---

## Step 3 — Install & Run

```bash
# From the repo root
npm install          # installs concurrently

# Install all workspace packages
npm run install:all

# Start both servers (frontend + backend)
npm run dev
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000       |
| Backend  | http://localhost:4000       |
| Health   | http://localhost:4000/health|

---

## Authentication Flow

```
1.  User clicks "Sign in with Microsoft"
        ↓
2.  Frontend calls GET /api/auth/login → receives authUrl
3.  Frontend redirects browser to authUrl (Entra ID)
        ↓
4.  User authenticates (password + MFA)
5.  Entra ID redirects to /auth/callback?code=...&state=...
        ↓
6.  Callback page calls POST /api/auth/callback { code, state }
7.  Backend validates state (CSRF check), calls MSAL to exchange code
8.  MSAL returns access_token + id_token → stored AES-256-GCM encrypted
9.  Express session cookie set (httpOnly, Secure in prod)
        ↓
10. Frontend receives user profile, sets indicator cookie
11. Next.js middleware allows access to /dashboard
        ↓
12. Every API call: backend middleware calls getValidToken()
    → silently refreshes if <5 min to expiry
    → attaches user to req.user
    → all actions written to audit log
```

---

## API Endpoints (Phase 1)

| Method | Path                    | Auth | Description                       |
|--------|-------------------------|------|-----------------------------------|
| GET    | /health                 | ✗    | Health check                      |
| GET    | /api/auth/login         | ✗    | Get Entra ID authorization URL    |
| POST   | /api/auth/callback      | ✗    | Exchange code for session         |
| GET    | /api/auth/me            | ✓    | Get current user profile          |
| POST   | /api/auth/logout        | ✓    | Revoke tokens + destroy session   |
| POST   | /api/auth/refresh       | ✓    | Proactive token refresh           |
| GET    | /api/dashboard/summary  | ✓    | Aggregated M365 metrics           |
| GET    | /api/dashboard/recent-activity | ✓ | Audit events from Graph API  |

---

## Security Measures

| Layer | Mechanism |
|-------|-----------|
| Authentication | Microsoft Entra ID OAuth 2.0 (PKCE, redirect flow) |
| MFA | Enforced via Conditional Access in Entra ID |
| Token storage | AES-256-GCM encrypted server-side (never sent to browser) |
| Session cookie | `httpOnly`, `Secure` (prod), `SameSite=Lax`, 8h TTL |
| CSRF | State parameter validated on every OAuth callback |
| Rate limiting | 500 req/15min global · 30 req/15min on auth routes |
| Security headers | Helmet (CSP, X-Frame-Options, X-Content-Type-Options) |
| CORS | Locked to `FRONTEND_URL` only |
| Route guards | Next.js middleware (edge) + Express `validateToken` |
| Audit trail | Every authenticated request logged with actor + IP |

---

## Production Deployment

### Backend (e.g. Azure Container Apps / App Service)

```bash
cd backend
npm run build
# Set all environment variables in your hosting platform
NODE_ENV=production npm start
```

Replace the in-memory `tokenStore` with **Redis** (`ioredis` + `connect-redis`):
```ts
// backend/src/utils/tokenStore.ts → swap Map for Redis
import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });
```

### Frontend (e.g. Vercel / Azure Static Web Apps)

```bash
cd frontend
npm run build
# Deploy .next output
```

Update Azure App Registration redirect URIs to your production domain.

---

## Phases Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| **1** | ✅ Complete | Auth, layout, dashboard widgets, protected routes |
| 2 | Next | User management (CRUD, reset password, assign licenses) |
| 3 | — | Device management (Intune, compliance, remote actions) |
| 4 | — | Groups, SharePoint, Teams monitoring |
| 5 | — | Reports, audit logs UI, automation workflows |
| 6 | — | Real-time alerts, notification system, role management |
