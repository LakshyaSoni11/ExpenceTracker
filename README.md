<div align="center">

# ExpenceTracker

**A Splitwise-inspired expense-sharing app with per-user accounts, group invites, realtime updates, and an AI finance assistant.**

Track shared expenses, split bills equally / by exact amount / by percentage, see who owes whom, settle up, and let Gemini manage your finances from chat.

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Live Demo](#live-demo)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Security Note](#security-note)

---

## Overview

ExpenceTracker is a full-stack **MERN** application that makes splitting group expenses effortless. Create groups, invite registered users, log shared expenses, let the app figure out who owes whom, record settlements, and get **realtime updates** the moment anything changes.

The app now includes full **authentication** (email + password with **JWT sessions**), **email verification** (Brevo), a **group-invite flow** (invite → accept/decline), and a chat-powered **AI assistant** backed by Google Gemini that can answer finance questions and even create groups / add expenses directly from the chat.

---

## Features

### Accounts & Security
- Register / login with email & password (passwords hashed with `bcrypt`)
- JWT-based sessions; email verification before you can use groups
- Per-user data isolation — you only ever see your own groups, expenses, and settlements

### Groups & Invites
- Create groups and add any registered user by email or name
- Invited members are invited immediately accepted/declined — activity is **realtime** via Socket.IO
- Remove members and delete groups you no longer need

### Expenses
- Add expenses with a description, amount, and payer
- Split **equally**, by **exact amount**, or by **percentage** (with live "remaining / over" feedback)
- Delete erroneous entries

### Balance Tracking
- Automatic per-member net balances per group — see exactly **who owes you** and **whom you owe**
- Suggested minimal-transfer settlements (creators → debtors netting)

### Settlements
- Record when one member pays another back
- Full settlement history per group

### Report Export
- Download a formatted **PDF** report (summary stats, expense table, split details, payments by member, settlement history)
- Download a UF8 **CSV** for Excel / Google Sheets

### AI Chat Assistant *(powered by Google Gemini)*
- Ask natural-language finance questions with live context of your groups
- Create groups and add expenses directly through chat (e.g. *"Add 50 for pizza in Trip"*)
- Runs on a valid Gemini model with automatic fallback across candidates

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 7, Tailwind CSS 4, Radix UI, Framer Motion, Axios, Sonner, jsPDF |
| **Backend** | Node.js, Express 5, Mongoose 9, Socket.IO, JWT, bcryptjs, Nodemailer (Brevo) |
| **Database** | MongoDB (MongoDB Atlas) |
| **AI** | Google Gemini via `@google/generative-ai` (model configurable, fallback chain) |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## Architecture

```
Browser ──▶ React SPA (Vercel)
              │
              │  HTTPS /api  (VITE_API_URL, CORS-enabled)
              ▼
         Express API (Render) ──▶ MongoDB Atlas (Mongoose)
              │  ──────────────▶ Brevo (transactional email)
              │  ──────────────▶ Google Gemini (AI chat)
              └  Socket.IO      ◀── realtime push to connected browsers
```

- The **frontend** is a static Vite build served from Vercel. It talks to the backend through a single Axios instance (`frontend/src/api/axios.js`) that inlines `VITE_API_URL` at build time.
- The **backend** is a long-running Node service on Render. It exposes the REST API under `/api/`, realtime events over Socket.IO, and scopes **all** queries to the authenticated user.

---

## Live Demo

| App | URL |
|---|---|
| **Frontend (Vercel)** | https://expence-tracker-app-three.vercel.app |
| **Backend (Render)** | https://expencetracker-6y0c.onrender.com/api (health: `/api/health`) |

> You need a verified account to use the app. Register, then click the link sent to your inbox.

---

## Getting Started

### Prerequisites
- **Node.js** >= 18 and npm
- **MongoDB** — an [Atlas](https://www.mongodb.com/atlas) cluster (or a local instance)
- **Brevo API key** (for email verification) from [app.brevo.com](https://app.brevo.com) — or a Gmail App Password (SMTP fallback)
- **Google AI API key** — from [Google AI Studio](https://aistudio.google.com/apikey), only needed for the AI chatbot

### 1. Clone the repository

```bash
git clone https://github.com/LakshyaSoni11/ExpenceTracker.git
cd ExpenceTracker
```

### 2. Install dependencies

```bash
npm --prefix backend install
npm --prefix frontend install
```

(or just `npm run install:all` from the repo root)

### 3. Configure environment variables

Create a `.env` file inside `backend/` — see [`backend/.env.example`](backend/.env.example):

```env
# backend/.env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
JWT_SECRET=<long-random-string>
PORT=5000

# Email verification (prefer Brevo; falls back to SMTP below if unset)
BREVO_API_KEY=xkeysib-...
EMAIL_FROM="Expense Tracker <you@example.com>"
CLIENT_URL=http://localhost:3000

# Optional SMTP fallback (e.g. Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password

# Optional — only for the AI chat assistant
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the backend

```bash
npm --prefix backend run dev
```

The API starts at `http://localhost:5000`.

### 5. Run the frontend

```bash
npm --prefix frontend run dev
```

The app is live at `http://localhost:3000`.

> In development the frontend calls `http://localhost:5000/api` automatically (`VITE_API_URL` is optional locally).

---

## Environment Variables

| Variable | Where | Required | Description |
|---|---|---|---|
| `MONGO_URI` | Backend | Yes | MongoDB connection string |
| `JWT_SECRET` | Backend | Yes | Secret used to sign auth tokens (long random string) |
| `BREVO_API_KEY` | Backend | Yes (for email verification) | Brevo transaction-style API key (`xkeysib-...`) |
| `EMAIL_FROM` | Backend | Yes | Verified sender address used in verification emails |
| `CLIENT_URL` | Backend | Yes | Frontend URL that verification links point to |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Backend | Fallback | Used only when `BREVO_API_KEY` is unset |
| `GEMINI_API_KEY` | Backend | No (for AI) | Google Gemini API key |
| `GEMINI_MODEL` | Backend | No | Gemini model override (defaults to `gemini-3.7-flash`, with fallback chain) |
| `PORT` | Backend | No | Backend port (defaults to `5000`) |
| `VITE_API_URL` | Frontend | Yes (production) | Full backend URL + `/api`, e.g. `https://your-backend.onrender.com/api` |

---

## API Reference

**Base URL:** `http://localhost:5000/api` (locally)

All endpoints except `register` / `login` / `verify-email` / `resend-verification` require an `Authorization: Bearer <token>` header. Group & data endpoints also require a verified email.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register: `{ name, email, password }` |
| `POST` | `/auth/login` | — | Login: `{ email, password }` → `{ token, user }` |
| `POST` | `/auth/verify-email` | — | Verify: `{ email, token }` |
| `POST` | `/auth/resend-verification` | — | Resend email: `{ email }` |
| `GET` | `/auth/me` | Yes | Current authenticated user |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users/search?q=name` | Yes | Search registered users (to add to groups) |

### Groups

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/groups` | Yes | List your groups (with invite metadata) |
| `POST` | `/groups` | Yes | Create group: `{ name, members: [userId, ...] }` |
| `GET` | `/groups/invites` | Yes | Groups that have invited you, still pending |
| `GET` | `/groups/:id` | Yes | Single group |
| `POST` | `/groups/:id/invite/accept` | Yes | Accept a pending invite |
| `POST` | `/groups/:id/invite/decline` | Yes | Decline a pending invite |
| `POST` | `/groups/:id/members` | Yes | Invite a member: `{ userId }` |
| `DELETE` | `/groups/:id/members/:memberId` | Yes | Remove a member |
| `DELETE` | `/groups/:id` | Yes | Delete a group |

### Expenses

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/expenses` | Yes | Add expense (see body below) |
| `GET` | `/expenses` | Yes | List all your expenses |
| `GET` | `/expenses/group/:groupId` | Yes | Expenses of one group |
| `DELETE` | `/expenses/:id` | Yes | Delete an expense |

**Add expense — request body:**

```json
{
  "groupId": "64f...",
  "description": "Dinner",
  "amount": 1500,
  "paidBy": "<userId>",
  "splitType": "equal | exact | percent",
  "splits": [{ "member": "<userId>", "amount": 500 }]
}
```

### Settlements

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/settlements` | Yes | Record settlement: `{ groupId, from: "<userId>", to: "<userId>", amount }` |
| `GET` | `/settlements` | Yes | List all your settlements |
| `GET` | `/settlements/group/:groupId` | Yes | Settlements of one group |

### AI Assistant

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/chat` | Yes | Chat: `{ message, history: [{ role, parts }] }` — returns text or a JSON `ACTION` block to create groups / add expenses |

### Misc

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness + AI / mailer configuration status |
| `GET` | `/api/ai-test` | Probes Gemini models and reports which one responds |

---

## Deployment

The project deploys as **two separate apps**:

- **Frontend (React)** → **Vercel** — static build of [`frontend/`](./frontend) via [`frontend/vercel.json`](./frontend/vercel.json)
- **Backend (Express API)** → **Render** — web service from [`backend/`](./backend) via [`render.yaml`](./render.yaml)

### 1. Backend → Render (Blueprint)

1. Push the code to GitHub.
2. On [render.com](https://render.com) → **New → Blueprint** → connect the `ExpenceTracker` repo. [`render.yaml`](./render.yaml) auto-configures the service (root dir `backend`, `npm install` / `npm start`, `PORT=5000`).
3. In the service's **Environment** tab, set the `sync: false` variables — they won't be copied from the blueprint values:
   `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `BREVO_API_KEY`, `EMAIL_FROM`, `CLIENT_URL` (and optionally `SMTP_USER` / `SMTP_PASS`).
4. Copy the service URL, e.g. `https://expence-tracker-backend.onrender.com`.

**Verify:** open `https://your-backend.onrender.com/api/groups` with a token, or `https://your-backend.onrender.com/api/health` without one.

> **JWT_SECRET matters:** if it changes, all existing sessions are invalidated. Set it once and keep it stable.

### 2. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import `ExpenceTracker`.
2. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend` (this is where [`frontend/vercel.json`](./frontend/vercel.json) lives)
   - Use the **auto-detected** install / build / output commands — do not hardcode an install command (a custom install that also installed the backend was a common source of build failures).
3. Add the environment variable:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` (your Render backend URL + `/api`) |

   > **Required in production** — without it the app calls same-origin `/api`, which does not exist on Vercel. Vercel treats any `VITE_*` variable as **Compiled** (Config type), not Secret — that is expected.

4. Click **Deploy**. The SPA rewrites all routes to `index.html` via [`frontend/vercel.json`](./frontend/vercel.json).

### How routing works

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

The backend enables CORS for all origins, so the Vercel SPA can call the Render API cross-domain, and Socket.IO pushes realtime events back to connected browsers.

---

## Project Structure

```
ExpenceTracker/
├── backend/                    # Express REST API (+ Socket.IO) — deploys to Render
│   ├── config/db.js            # Mongoose connection
│   ├── controllers/            # auth, user, group, expense, ai handlers
│   ├── middleware/auth.js      # authRequired / requireVerified
│   ├── models/                 # User, Group, Expense, Settlement
│   ├── routes/                 # auth, user, group, expense, ai routers
│   ├── utils/                  # access control, group serializer, realtime events
│   ├── app.js                  # Express app + health / ai-test endpoints
│   ├── index.js                # Server entry (http + socket.io)
│   └── .env.example
├── frontend/                   # React + Vite + Tailwind app — deploys to Vercel
│   ├── vercel.json             # Vercel config
│   └── src/
│       ├── api/axios.js        # Axios instance (VITE_API_URL + JWT interceptor)
│       ├── components/         # Dashboard, modals, AI chat, report export, …
│       ├── components/ui/      # shadcn-style primitives
│       ├── context/AuthContext.jsx
│       └── lib/                # members, socket, avatar helpers
├── render.yaml                 # Render Blueprint (backend web service)
├── .gitignore
└── package.json                # root scripts (install:all)
```

---

## Roadmap

- [x] JWT-based authentication & per-user data
- [x] Email verification (Brevo + SMTP fallback)
- [x] Group invites (accept / decline) with realtime updates
- [x] Equal / exact / percentage split types
- [x] Suggested-minimum-transfers in the UI
- [x] PDF & CSV report export
- [ ] Currency support & exchange-rate conversion
- [ ] Group membership management UI (remove members from app UI)
- [ ] Realtime typing indicators / presence in the AI chat
- [ ] Unit & integration tests (Jest / Supertest)

---

## Security Note

- `backend/.env` and `node_modules` are gitignored — never commit secrets.
- If you ever pushed real credentials to a public repository, **rotate them now**: reset the MongoDB Atlas database user password, delete and regenerate `GEMINI_API_KEY` (and Brevo key), and change `JWT_SECRET`.
- Generate strong secrets with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

---

## License

[MIT](LICENSE)