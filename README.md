<div align="center">

# 💸 ExpenceTracker

**A Splitwise-inspired expense sharing app with an AI finance assistant**

Track shared expenses, split bills among friends, settle up with ease, and let Gemini handle your finance questions.

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment on Vercel](#-deployment-on-vercel)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

ExpenceTracker is a full-stack **MERN** application that makes splitting group expenses effortless — just like Splitwise. Create groups, log shared expenses, let the app figure out who owes whom, record settlements, and even talk to an **AI finance chatbot** powered by Google Gemini that can answer questions and manage expenses directly from chat.

> **Note:** Authentication is intentionally out of scope. Members are identified by name.

---

## Features

### 👥 Groups
- Create groups with two or more members
- Delete groups you no longer need

### 💰 Expenses
- Add expenses inside a group with a clear description
- Specify who paid and split the amount among members
- Delete erroneous entries

### 📊 Balance Tracking
- Automatic per-member balance summary — see exactly **who owes you** and **whom you owe**
- Simplification logic nets multiple transactions into minimal transfers

### 🤝 Settlements
- Record when someone pays someone back
- Full settlement history per group

### 📄 Report Export
- Download the complete expense report as a **formatted PDF** (summary stats, expense table, split details, payments by member, and settlement history)
- Download a **CSV** for Excel / Google Sheets (UTF-8, ₹-safe)

### 🤖 AI Chat Assistant *(powered by Google Gemini)*
- Ask natural-language finance questions in a chat UI
- Create groups and add expenses directly through chat
- The assistant has live context of your existing groups

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 7, Tailwind CSS 4, Radix UI, Framer Motion, Axios |
| **Backend** | Node.js, Express 5, Mongoose 9 |
| **Database** | MongoDB Atlas |
| **AI** | Google Gemini (`gemini-2.5-flash`) via `@google/generative-ai` |
| **Deployment** | Vercel (single project, monorepo) |

---

## Architecture

```
React (Vite) ──HTTP──▶ Express API (Serverless on Vercel) ──▶ MongoDB Atlas
     │                          │
     │                          └──▶ Google Gemini API
     └──▶ (Same-origin /api in production, localhost:5000 in dev)
```

- **Backend** exposes a REST API under `/api/` for groups, expenses, settlements, and AI chat.
- **Frontend** consumes that API through a single Axios instance whose base URL switches automatically between local dev and production.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and npm
- **MongoDB** — an [Atlas](https://www.mongodb.com/atlas) cluster (or local instance)
- **Google AI API key** — from [Google AI Studio](https://aistudio.google.com/apikey) *(only needed for the AI chatbot)*

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

### 3. Configure environment variables

Create a `.env` file inside `backend/` (see [`backend/.env.example`](backend/.env.example)):

```env
# backend/.env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
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

> In development the frontend calls `http://localhost:5000/api` automatically; in production it uses the same-origin `/api`.

---

## Environment Variables

| Variable | Where | Required | Description |
|---|---|---|---|
| `MONGO_URI` | Backend (local) / Vercel | ✅ | MongoDB connection string |
| `GEMINI_API_KEY` | Backend (local) / Vercel | ✅ (for AI) | Google Gemini API key |
| `PORT` | Backend | ❌ | Backend port (defaults to `5000`) |
| `VITE_API_URL` | Frontend (Vercel only) | ❌ | API base URL. Defaults to `/api` in production, `http://localhost:5000/api` in dev |

---

## API Reference

Base URL: `http://localhost:5000/api` (locally)

### Groups
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/groups` | List all groups |
| `POST` | `/api/groups` | Create a group |
| `DELETE` | `/api/groups/:id` | Delete a group |

**Create group — request body:**
```json
{ "name": "Weekend Trip", "members": ["Alice", "Bob"] }
```

### Expenses
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/expenses` | Add an expense |
| `GET` | `/api/expenses` | List all expenses |
| `GET` | `/api/expenses/group/:groupId` | List expenses of a group |
| `DELETE` | `/api/expenses/:id` | Delete an expense |

**Add expense — request body:**
```json
{
  "groupId": "64f...",
  "description": "Dinner",
  "amount": 1500,
  "paidBy": "Alice",
  "splits": [{ "member": "Alice", "amount": 500 }, { "member": "Bob", "amount": 1000 }]
}
```

### Settlements
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/settlements` | Record a settlement |
| `GET` | `/api/settlements` | List all settlements |
| `GET` | `/api/settlements/group/:groupId` | List settlements of a group |

### AI Assistant
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Chat with the Gemini finance assistant |

**Chat — request body:**
```json
{ "message": "Who owes the most in the Weekend Trip group?", "history": [] }
```

---

## 🚀 Deployment

This project deploys as **two separate apps**:

- **Frontend (React)** → **Vercel** — static build of [`frontend/`](./frontend) via [`frontend/vercel.json`](./frontend/vercel.json)
- **Backend (Express API)** → **Render** — web service from [`backend/`](./backend) via [`render.yaml`](./render.yaml)

In production the frontend calls the backend through the `VITE_API_URL` environment variable (falls back to `/api` in dev).

### 1. Deploy the backend to Render

1. Push the code to GitHub.
2. Go to [render.com](https://render.com) → **New** → **Blueprint** and connect the `ExpenceTracker` repo. The [`render.yaml`](./render.yaml) auto-configures the service.
   - Or create a **New → Web Service** manually: Root Directory = `backend`, Build Command = `npm install`, Start Command = `npm start`.
3. In the service's **Environment** tab, set:

   | Name | Value |
   |---|---|
   | `PORT` | `5000` |
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `GEMINI_API_KEY` | Your Google Gemini API key |

4. Copy the service URL, e.g. `https://expense-tracker-backend.onrender.com`.

**Verify:** open `https://expense-tracker-backend.onrender.com/api/groups` — it should return `[]` (or your groups).

### 2. Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project** → import `ExpenceTracker`.
2. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend` *(important — this is where [`frontend/vercel.json`](./frontend/vercel.json) lives; the repo root has no Vercel config anymore)*
3. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://expense-tracker-backend.onrender.com/api` *(your Render backend URL + `/api`)* |

   > `VITE_API_URL` is required in production — without it the app calls the same-origin `/api`, which doesn't exist on Vercel.

4. Click **Deploy**.

### How the routing works (frontend/vercel.json)

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The SPA is served from the Vercel domain; the Axios instance (`frontend/src/api/axios.js`) reads `VITE_API_URL` at build time and points all API calls at the Render backend. The backend enables CORS for all origins, so cross-domain requests work out of the box.

### Security & hygiene ⚠️

> **Important:** If you cloned this project, the original repo previously committed `backend/.env` and `node_modules`. These have been removed from tracking and `.gitignore` has been updated. If those values were ever pushed to a public repository, **rotate your credentials now**:
>
> 1. **MongoDB Atlas** → Database Access → reset the database user password.
> 2. **Google AI** → generated `GEMINI_API_KEY` → delete the old key and create a new one.
> 3. Commit the removal:
>
>    ```bash
>    git add -A
>    git commit -m "chore: stop tracking env file and node_modules"
>    git push
>    ```

---

## Project Structure

```
ExpenceTracker/
├── backend/                  # Express REST API (deploys to Render)
│   ├── config/
│   │   └── db.js             # Mongoose connection
│   ├── controllers/          # Route handlers (groups, expenses, AI)
│   ├── models/               # Mongoose models (Group, Expense, Settlement, User)
│   ├── routes/               # Express routers
│   ├── app.js                # Express app
│   ├── index.js              # Server entry (app.listen)
│   └── .env.example
├── frontend/                 # React + Vite + Tailwind app (deploys to Vercel)
│   ├── vercel.json           # Vercel config
│   └── src/
│       ├── api/              # Axios instance (uses VITE_API_URL)
│       ├── components/       # UI components (Dashboard, modals, AI chat …)
│       └── lib/              # Utilities & shadcn/ui helpers
├── render.yaml               # Render Blueprint (backend web service)
├── .gitignore
└── package.json
```

---

## Roadmap

- [ ] JWT-based authentication & per-user data
- [ ] Equal / percentage / exact split types
- [ ] Currency support & exchange-rate conversion
- [ ] Settlement simplification ("A pays B" netting) in the UI
- [ ] Unit & integration tests (Jest / Supertest)

---

## License

This project is licensed under the [MIT License](LICENSE).

---
