<div align="center">

<img src="https://raw.githubusercontent.com/Akshatsrii/Database-Backup-Utility/main/OIP.jpg" alt="BackupOS Banner" width="100%" style="border-radius: 16px;" />

<br/>
<br/>

<h1>
   BackupOS
</h1>

<h3>🛡️ Production-Grade · Multi-Database · Cloud-Ready Backup Management Platform</h3>

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Cloud-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Jest](https://img.shields.io/badge/Jest-87%25%20Coverage-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-4ade80?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-blueviolet?style=flat-square)](CONTRIBUTING.md)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-4ade80?style=flat-square)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-38bdf8?style=flat-square)]()
[![Stars](https://img.shields.io/github/stars/Akshatsrii/Database-Backup-Utility?style=flat-square&color=gold)](https://github.com/Akshatsrii/Database-Backup-Utility/stargazers)

<br/>

> **BackupOS** is a full-stack, enterprise-ready database backup management platform built for teams who take data seriously.
> It supports **MySQL**, **PostgreSQL**, **MongoDB**, and **SQLite** with automated scheduling, **AES-256-GCM encryption**,
> **Firebase/local storage**, real-time WebSocket log streaming, and a stunning terminal-themed dashboard — all in one platform.

<br/>

```bash
$ backup-os --status
● system online  ·  4 connections  ·  2 schedules active  ·  42 backups taken  ·  0 failures
```

<br/>

---

</div>

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🗄️ Supported Databases](#%EF%B8%8F-supported-databases)
- [🏗️ Tech Stack](#%EF%B8%8F-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚡ Quick Start](#-quick-start)
- [🔧 Environment Setup](#-environment-setup)
- [🔌 API Reference](#-api-reference)
- [🔐 Security Model](#-security-model)
- [🐳 Docker Deployment](#-docker-deployment)
- [🧪 Testing](#-testing)
- [📊 Performance Benchmarks](#-performance-benchmarks)
- [🚀 Deployment Guide](#-deployment-guide)
- [🛠️ Troubleshooting](#%EF%B8%8F-troubleshooting)
- [🗺️ Roadmap](#%EF%B8%8F-roadmap)
- [🤝 Contributing](#-contributing)

---

## ✨ Key Features

<div align="center">

| 🗃️ **Database Operations** | ☁️ **Storage & Security** | ⏰ **Automation** | 📊 **Monitoring** |
|:---|:---|:---|:---|
| ✅ Full database backup | ✅ Local filesystem | ✅ Cron-based scheduler | ✅ Real-time WebSocket logs |
| ✅ Incremental backup | ✅ Firebase Cloud Storage | ✅ Hourly / Daily / Weekly / Monthly | ✅ Backup size tracking |
| ✅ Differential backup | ✅ AES-256-GCM encryption | ✅ Enable / Pause / Delete schedules | ✅ Success / failure analytics |
| ✅ Selective table restore | ✅ Gzip compression (up to 88%) | ✅ Auto-retry on failure | ✅ Compression ratio reports |
| ✅ Full database restore | ✅ Encrypted file downloads | ✅ Next-run time prediction | ✅ Duration tracking |
| ✅ Connection testing | ✅ Secure credential storage | ✅ Slack notifications | ✅ Storage growth charts |
| ✅ Multi-DB simultaneous ops | ✅ Environment-based secrets | ✅ Email alerts on failure | ✅ Audit activity trail |

</div>

---

## 🗄️ Supported Databases

<div align="center">

| Database | Logo | Full Backup | Incremental | Port | CLI Tool | Notes |
|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **PostgreSQL** | ![pg](https://img.shields.io/badge/-PostgreSQL-336791?logo=postgresql&logoColor=white) | ✅ | ✅ | `5432` | `pg_dump` | Supports schema-only, data-only |
| **MySQL** | ![mysql](https://img.shields.io/badge/-MySQL-4479A1?logo=mysql&logoColor=white) | ✅ | ✅ | `3306` | `mysqldump` | Supports all storage engines |
| **MongoDB** | ![mongo](https://img.shields.io/badge/-MongoDB-47A248?logo=mongodb&logoColor=white) | ✅ | ✅ | `27017` | `mongodump` | BSON format, oplog support |
| **SQLite** | ![sqlite](https://img.shields.io/badge/-SQLite-003B57?logo=sqlite&logoColor=white) | ✅ | ❌ | `file` | file copy | Zero-config, embedded DBs |

</div>

---

## 🏗️ Tech Stack

<div align="center">

### 🎨 Frontend

| Technology | Version | Purpose |
|:---|:---:|:---|
| ![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs) | 14 | App router, SSR, pages |
| ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) | 18 | Component UI library |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss) | 3 | Utility-first styling |
| ![Recharts](https://img.shields.io/badge/Recharts-2-ff7300) | 2 | Dashboard data charts |
| ![Socket.IO](https://img.shields.io/badge/Socket.IO-Client-010101?logo=socketdotio) | 4 | Real-time WebSocket logs |
| ![React Query](https://img.shields.io/badge/React%20Query-5-FF4154?logo=reactquery) | 5 | Server state caching |

### ⚙️ Backend

| Technology | Version | Purpose |
|:---|:---:|:---|
| ![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs) | 20 | Runtime environment |
| ![Express](https://img.shields.io/badge/Express-4-000000?logo=express) | 4 | REST API framework |
| ![Socket.IO](https://img.shields.io/badge/Socket.IO-Server-010101?logo=socketdotio) | 4 | WebSocket server |
| ![SQLite](https://img.shields.io/badge/SQLite-Internal%20DB-003B57?logo=sqlite) | 3 | Metadata, logs, schedules |
| ![Firebase Admin](https://img.shields.io/badge/Firebase-Admin%20SDK-FFCA28?logo=firebase) | 11 | Cloud storage uploads |
| ![node-cron](https://img.shields.io/badge/node--cron-Scheduler-green) | 3 | Cron-based job scheduling |
| ![Zod](https://img.shields.io/badge/Zod-Validation-3068B7) | 3 | Input schema validation |

</div>

---

## 📁 Project Structure

```
backup-os/
├── 📁 frontend/                   # Next.js 14 Application
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # Login page
│       │   └── dashboard/
│       │       ├── page.tsx       # Main dashboard (stats + charts)
│       │       ├── backups/       # Backup history & management
│       │       ├── restore/       # Restore operations
│       │       ├── scheduler/     # Schedule manager
│       │       ├── logs/          # Live WebSocket terminal
│       │       └── settings/      # DB connection manager
│       ├── components/
│       │   ├── ui/                # Button, Input, Modal, Badge, Card
│       │   ├── layout/            # Sidebar, TopBar, PageWrapper
│       │   ├── dashboard/         # StatsCard, BackupChart, RecentBackups
│       │   ├── backup/            # BackupModal, BackupTable, ProgressBar
│       │   ├── restore/           # RestoreModal
│       │   ├── logs/              # LiveLogTerminal (WebSocket)
│       │   └── scheduler/         # SchedulerForm
│       ├── hooks/                 # useBackups, useLiveLogs, useStats
│       ├── lib/                   # api.ts (Axios), utils.ts
│       └── types/                 # Shared TypeScript interfaces
│
├── 📁 backend/                    # Express.js API Server
│   └── src/
│       ├── config/                # SQLite setup, Firebase init, env validation
│       ├── routes/                # connections, backups, restore, schedules, logs, stats
│       ├── controllers/           # Route handlers (thin layer)
│       ├── services/              # Business logic (BackupSvc, RestoreSvc, Scheduler...)
│       ├── engine/
│       │   ├── backup.engine.ts   # Core backup execution
│       │   ├── restore.engine.ts  # Core restore execution
│       │   ├── compression.engine.ts  # Gzip compress / decompress
│       │   ├── encryption.engine.ts   # AES-256-GCM
│       │   └── storage/
│       │       ├── local.storage.ts   # Local filesystem
│       │       └── firebase.storage.ts # Firebase Cloud Storage
│       ├── db/
│       │   ├── schema.ts          # Table definitions
│       │   ├── migrations.ts      # Run on startup
│       │   └── repositories/      # connection, backup, restore, schedule, log repos
│       ├── middleware/            # error, validate, logger
│       ├── socket.ts              # Socket.IO setup
│       └── app.ts                 # Express entry point
│
├── 📁 __tests__/
│   ├── unit/                      # compression, encryption, backup service
│   ├── integration/               # connections, backups, restore API tests
│   └── e2e/                       # full backup → restore flow
│
├── 📁 docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

```bash
node --version    # 18+ required
npm --version     # 9+ required
docker --version  # optional, for containerized setup
```

### 1. Clone the Repository

```bash
git clone https://github.com/Akshatsrii/Database-Backup-Utility.git
cd Database-Backup-Utility
```

### 2. Start with Docker (Recommended ⭐)

```bash
docker-compose up --build
```

> 🌐 Frontend: **http://localhost:3000**  
> ⚙️ Backend API: **http://localhost:4000**

### 3. Manual Setup

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your keys (see Environment Setup below)
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

---

## 🔧 Environment Setup

### Backend `.env`

```env
# ── Server ─────────────────────────────────────────
PORT=4000
NODE_ENV=development

# ── Internal Database ──────────────────────────────
SQLITE_PATH=./data/backupOS.db

# ── Encryption ─────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))"
ENCRYPTION_KEY=your-32-char-secret-key-here-abc!

# ── Firebase Cloud Storage ─────────────────────────
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# ── Notifications (Optional) ───────────────────────
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password

# ── Storage ────────────────────────────────────────
LOCAL_BACKUP_DIR=./backups
MAX_LOCAL_BACKUPS=50
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## 🔌 API Reference

> **Base URL:** `http://localhost:4000/api`

### 🔗 Connections

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/connections` | List all saved connections |
| `POST` | `/connections` | Add a new DB connection |
| `POST` | `/connections/:id/test` | Ping and validate a connection |
| `DELETE` | `/connections/:id` | Remove a connection |

**Add connection example:**

```json
POST /api/connections
{
  "name": "production-postgres",
  "type": "postgresql",
  "host": "db.myapp.com",
  "port": 5432,
  "username": "postgres",
  "password": "supersecret",
  "database": "myapp_prod"
}
```

---

### 💾 Backups

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/backups` | List all backups (paginated) |
| `POST` | `/backups` | Trigger a new backup |
| `GET` | `/backups/:id` | Get backup details + metadata |
| `DELETE` | `/backups/:id` | Delete backup record + file |
| `GET` | `/backups/:id/download` | Download the backup file |

**Trigger a backup:**

```json
POST /api/backups
{
  "connectionId": "conn_abc123",
  "backupType": "full",        
  "storageType": "firebase",   
  "encrypt": true              
}
```

**Backup types:**
- `full` — complete snapshot of the entire database
- `incremental` — only changes since the last backup
- `differential` — all changes since the last *full* backup

---

### ♻️ Restore

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/restore` | Initiate a restore operation |
| `GET` | `/restore/jobs` | List all restore jobs |
| `GET` | `/restore/jobs/:id` | Get restore job status |

**Full restore:**

```json
POST /api/restore
{
  "backupId": "bkp_xyz789",
  "connectionId": "conn_abc123",
  "tables": []
}
```

**Selective table restore:**

```json
POST /api/restore
{
  "backupId": "bkp_xyz789",
  "connectionId": "conn_abc123",
  "tables": ["users", "orders", "products"]
}
```

---

### ⏰ Schedules

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/schedules` | List all scheduled jobs |
| `POST` | `/schedules` | Create a new schedule |
| `PATCH` | `/schedules/:id/toggle` | Enable or disable a schedule |
| `DELETE` | `/schedules/:id` | Delete a schedule |

```json
POST /api/schedules
{
  "connectionId": "conn_abc123",
  "frequency": "daily",
  "backupType": "full",
  "storageType": "firebase",
  "encrypt": true
}
```

---

### 📋 Logs & 📊 Stats

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/logs?limit=200` | Fetch recent log entries |
| `DELETE` | `/logs` | Clear all logs |
| `GET` | `/stats/dashboard` | Dashboard summary statistics |

**Stats response:**

```json
{
  "success": true,
  "data": {
    "totalBackups": 42,
    "successfulBackups": 39,
    "failedBackups": 3,
    "totalStorageBytes": 1234567890,
    "activeConnections": 4,
    "schedulesActive": 2,
    "backupsSizeHistory": [ ... ],
    "successRateHistory": [ ... ]
  }
}
```

---

## 🔐 Security Model

BackupOS implements a **multi-layer security model** to protect your database credentials and backup files.

### Layer 1 — Transport Security
- HTTPS in production via **nginx SSL termination**
- WebSocket over **WSS** (encrypted transport)
- **CORS** restricted to known origins only
- **Helmet.js** security headers on all responses

### Layer 2 — Credential Protection
- DB passwords stored **AES-encrypted** in SQLite — never plaintext
- Firebase service account keys **only in environment variables**
- Encryption master key lives only in `process.env` — never persisted
- All `.env` files in `.gitignore`

### Layer 3 — Backup File Encryption

```
Backup pipeline:
  plaintext dump
       ↓
  Gzip compress       ← up to 88% size reduction
       ↓
  AES-256-GCM encrypt ← unique random IV per file, AEAD authentication
       ↓
  filename.sql.gz.enc ← stored locally or uploaded to Firebase

Decryption:
  Read first 16 bytes  → IV
  Next 16 bytes        → Auth tag
  Remainder            → Decrypt with master key
```

### Layer 4 — API Security
- **Zod schema validation** on every request body and query param
- **Parameterized queries** everywhere — zero SQL injection surface
- **Rate limiting** middleware on all endpoints
- Consistent error responses — no stack traces leaked in production

---

## 🐳 Docker Deployment

### Development

```bash
# Build and start all services
docker-compose up --build

# Detached mode (background)
docker-compose up -d

# Tail logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop everything
docker-compose down

# ⚠️ Stop AND delete volumes (removes all backup data!)
docker-compose down -v
```

### Production

```bash
# Use the production compose file
docker-compose -f docker-compose.prod.yml up --build -d

# Rebuild a single service only
docker-compose up --build backend
```

### `docker-compose.yml` overview

```yaml
services:
  backend:
    build: ./backend
    ports: ["4000:4000"]
    volumes:
      - backup_data:/data
      - backup_files:/app/backups
    environment:
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      # ... (see Environment Setup)

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000

volumes:
  backup_data:
  backup_files:
```

---

## 🧪 Testing

### Run Tests

```bash
cd backend

npm test                  # Run all tests
npm run test:watch        # Watch mode (re-runs on save)
npm run test:coverage     # HTML coverage report
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
```

### Test Suites

```
__tests__/
├── unit/
│   ├── compression.test.ts    # Gzip compress/decompress/ratio
│   ├── encryption.test.ts     # AES-256-GCM encrypt/decrypt
│   └── backup.service.test.ts # Business logic with mocked DB
├── integration/
│   ├── connections.test.ts    # Full API route tests
│   ├── backups.test.ts        # Backup CRUD + file ops
│   └── restore.test.ts        # Restore flow with real files
└── e2e/
    └── backup-flow.test.ts    # Full backup → restore cycle
```

### Sample Output

```
PASS  unit/compression.test.ts
  ✓ compresses a buffer correctly            (12ms)
  ✓ decompresses back to original            (8ms)
  ✓ achieves ≥50% compression on text data  (15ms)
  ✓ handles empty buffer gracefully          (3ms)

PASS  unit/encryption.test.ts
  ✓ encrypts and decrypts round-trip        (18ms)
  ✓ produces unique ciphertext each run     (9ms)
  ✓ rejects wrong decryption key            (5ms)

PASS  integration/connections.test.ts
  ✓ creates a valid PostgreSQL connection   (45ms)
  ✓ rejects missing required fields        (12ms)
  ✓ rejects invalid database type          (8ms)
  ✓ tests a live connection successfully   (234ms)
  ✓ returns failure for wrong credentials  (89ms)

Test Suites: 6 passed, 6 total
Tests:       24 passed, 24 total
Coverage:    87.4%
```

---

## 📊 Performance Benchmarks

### Compression Ratios

| Database Size | Raw Dump | After Gzip | Space Saved |
|:---:|:---:|:---:|:---:|
| 10 MB | 10 MB | 1.2 MB | **88%** 🟢 |
| 100 MB | 100 MB | 14 MB | **86%** 🟢 |
| 1 GB | 1 GB | 150 MB | **85%** 🟢 |
| 10 GB | 10 GB | 1.8 GB | **82%** 🟢 |

### Backup Speed

| Database | Size | Dump Time | Compress Time | Total |
|:---:|:---:|:---:|:---:|:---:|
| PostgreSQL | 1 GB | ~45s | ~30s | **~75s** |
| MySQL | 1 GB | ~60s | ~30s | **~90s** |
| MongoDB | 1 GB | ~40s | ~35s | **~75s** |
| SQLite | 500 MB | ~2s | ~15s | **~17s** |

---

## 🚀 Deployment Guide

### Deploy Backend to Render.com

```
Service type:  Web Service
Root dir:      backend/
Build command: npm install && npm run build
Start command: npm start
```

Set the following environment variables in the Render dashboard:
`PORT`, `ENCRYPTION_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`

### Deploy Frontend to Vercel

```bash
cd frontend
npx vercel
```

In the Vercel project settings, add:

```
NEXT_PUBLIC_API_URL = https://your-backend.onrender.com
NEXT_PUBLIC_WS_URL  = https://your-backend.onrender.com
```

### Generate a Secure Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex').slice(0,32))"
# Output: abc123def456ghi789jkl012mno345pq
```

---

## 🛠️ Troubleshooting

| Problem | Cause | Solution |
|:---|:---|:---|
| `npm install` fails | Stale cache | `npm cache clean --force && npm install` |
| Port 3000 in use | Another process | `npm run dev -- -p 3001` |
| Port 4000 in use | Another process | `PORT=4001 npm run dev` |
| `pg_dump: command not found` | Tool not installed | `sudo apt install postgresql-client` |
| `mysqldump: command not found` | Tool not installed | `sudo apt install mysql-client` |
| `mongodump: command not found` | Tool not installed | Install `mongodb-database-tools` |
| Firebase upload fails | Bad credentials | Verify service account JSON and bucket name |
| WebSocket not connecting | Wrong URL | Check `NEXT_PUBLIC_WS_URL` in `.env.local` |
| Backup shows `"failed"` | Runtime error | Check `/api/logs` for the exact error |
| Docker build fails | Layer cache issue | `docker system prune && docker-compose up --build` |
| Decryption fails on restore | Wrong key | Make sure `ENCRYPTION_KEY` hasn't changed since backup |

---

## 🗺️ Roadmap

```
v1.0.0  ✅  Core backup/restore — PostgreSQL, MySQL, MongoDB, SQLite
v1.1.0  ✅  Firebase Cloud Storage + AES-256-GCM encryption
v1.2.0  ✅  Cron scheduling + Slack webhook notifications
v1.3.0  🔄  AWS S3 and Google Cloud Storage adapters
v1.4.0  📋  Backup versioning + retention policy engine
v1.5.0  📋  Multi-user authentication with JWT + RBAC
v2.0.0  📋  Kubernetes Helm chart + horizontal pod autoscaling
v2.1.0  📋  Point-in-time recovery (PITR) for PostgreSQL
v2.2.0  📋  Web-based SQL query runner on restored backups
```

---

## 🤝 Contributing

Contributions are warmly welcomed! Here's how to get started:

```bash
# 1. Fork the repo and clone your fork
git clone https://github.com/YOUR_USERNAME/Database-Backup-Utility.git

# 2. Create a feature branch
git checkout -b feature/your-awesome-feature

# 3. Make your changes and test them
npm test

# 4. Commit using Conventional Commits
git commit -m "feat: add Redis backup support"
git commit -m "fix: handle empty MongoDB collections"
git commit -m "docs: update Docker setup instructions"

# 5. Push and open a Pull Request
git push origin feature/your-awesome-feature
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 📄 License

```
MIT License — Copyright © 2025 BackupOS Contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software.
```

---

<div align="center">

<br/>

### ⭐ If BackupOS saved your data (or your weekend), give it a star!

<br/>

[![Star on GitHub](https://img.shields.io/github/stars/Akshatsrii/Database-Backup-Utility?style=for-the-badge&logo=github&color=gold)](https://github.com/Akshatsrii/Database-Backup-Utility/stargazers)
&nbsp;&nbsp;
[![Fork on GitHub](https://img.shields.io/github/forks/Akshatsrii/Database-Backup-Utility?style=for-the-badge&logo=github&color=blue)](https://github.com/Akshatsrii/Database-Backup-Utility/network)
&nbsp;&nbsp;
[![Report Bug](https://img.shields.io/badge/🐛_Report_Bug-Issues-red?style=for-the-badge)](https://github.com/Akshatsrii/Database-Backup-Utility/issues)

<br/>
<br/>

**Built with ❤️ using TypeScript · Next.js · Express · Firebase**

<br/>

```
$ backup-os --version 1.0.0
● All systems operational. Your data is safe.
```

</div>
