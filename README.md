# Task Management Application

A full-stack task management app with a React (Next.js) frontend and an Express backend.
The backend uses in-memory data structures (`Map` + arrays/lists) instead of an external database.

## Features

- Create tasks with:
  - Title
  - Deadline
  - Priority (`Low`, `Medium`, `High`)
- Read tasks grouped as:
  - Pending
  - Completed
- Update tasks:
  - Edit title, deadline, and priority
  - Mark task as done or move back to pending
- Delete tasks:
  - Remove finished or abandoned tasks
- Priority color labels:
  - Low = green
  - Medium = yellow
  - High = red
- Single-page frontend UI for all CRUD operations

## Tech Stack

- **Frontend:** Next.js + React + TypeScript
- **Backend:** Express (Node.js)
- **Storage:** In-memory `Map` and arrays/lists

## Project Structure

```text
.
├── backend/
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   └── globals.css
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm

## Setup Instructions

### 1) Install dependencies

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Start the backend server

In one terminal:

```bash
cd backend
npm run dev
```

Backend runs at: `http://localhost:4000`

### 3) Start the frontend app

In a second terminal:

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 4) Open the app

Visit: `http://localhost:3000`

## Environment Configuration (Optional)

The frontend defaults to calling `http://localhost:4000`.
To change it, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Backend API

Base URL: `http://localhost:4000`

### Create Task

- `POST /api/tasks`
- Body:

```json
{
  "title": "Finish report",
  "deadline": "2026-02-20",
  "priority": "High"
}
```

### Read Tasks

- `GET /api/tasks`
- Response includes grouped lists:
  - `pending`
  - `completed`
  - `all`

### Update Task

- `PUT /api/tasks/:id`
- Body can include:
  - `title`
  - `deadline`
  - `priority`
  - `completed`

### Delete Task

- `DELETE /api/tasks/:id`

## Notes

- Data is stored in memory only.
- Restarting the backend clears all tasks.
- CORS is enabled in backend for local frontend-backend communication.

## Useful Commands

### Frontend

```bash
cd frontend
npm run dev
npm run lint
npm run build
npm run start
```

### Backend

```bash
cd backend
npm run dev
npm run start
```
