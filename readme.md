# Fortuna — Online Casino Management System

A full-stack casino management system built as a DBMS course project.
Demonstrates ER modeling, normalization, triggers, indexing, transactions,
and complex SQL queries through a role-based, transaction-intensive web app.

**Team:** Aryan Khare (2024124) · Akash Adur (2024053) · Pranshu Prakash (2024426)
**Tutorial Group:** 6 · **Group Number:** 79

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Database   | PostgreSQL                        |
| Backend    | Python · Flask · psycopg2         |
| Frontend   | React · Vite                      |
| Auth       | JWT (PyJWT) · bcrypt              |

---

## Features

**Players** — Register, login, deposit funds, play Blackjack / Roulette / Coin Toss,
view game history, wallet transactions, and leaderboard rankings.

**Dealers** — Monitor game sessions, view payout stats, ban/unban suspicious players.

**Admins** — Full platform control: manage users, configure games, view revenue
reports and leaderboard summaries.

---

## Project Structure

```
fortuna/
├── backend/
│   ├── app.py              # Flask app factory + entry point
│   ├── auth.py             # JWT helpers, bcrypt, age validation
│   ├── config.py           # Loads .env into Config class
│   ├── db.py               # psycopg2 connection pool + query helpers
│   ├── requirements.txt
│   ├── .env.example        # Environment variable template
│   └── routes/
│       ├── auth_routes.py  # /api/auth/* — login & register
│       ├── player_routes.py
│       ├── dealer_routes.py
│       ├── admin_routes.py
│       └── game_routes.py
├── database/
│   ├── schema.sql          # All tables, constraints, triggers, indexes
│   └── seed.sql            # Sample data (15 players, 4 dealers, ~80 bets)
└── frontend/               # React + Vite (Phase 5)
```

---

## Database Schema

9 tables across 3 categories:

**Strong entities** — `Player`, `Dealer`, `Admin`, `Game`

**Weak entities** — `Bet` (identified by BetTime + PlayerID + SessionID),
`Leaderboard` (identified by PlayerID + MetricType),
`Game_Session`

**Relationship tables** — `Ban_Log` (Dealer ↔ Player),
`Game_Config_Log` (Admin ↔ Game),
`Wallet_Transaction`

---

## Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 15+ with pgAdmin 4
- Node.js 18+ (for frontend, Phase 5)

### 1. Database

Open pgAdmin, create a database named `fortuna`, then run in order:

```sql
-- In pgAdmin Query Tool:
\i database/schema.sql
\i database/seed.sql
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set DB_PASSWORD and JWT_SECRET_KEY
```

### 3. Run

```bash
# Backend (runs on port 5000)
python app.py

# Health check
curl http://localhost:5000/api/health
# → {"status": "ok", "project": "Fortuna"}
```

---

## API Overview

All protected routes require:
```
Authorization: Bearer <token>
```

| Method | Endpoint                      | Role   | Description              |
|--------|-------------------------------|--------|--------------------------|
| POST   | /api/auth/player/register     | —      | Player registration      |
| POST   | /api/auth/player/login        | —      | Player login             |
| POST   | /api/auth/dealer/login        | —      | Dealer login             |
| POST   | /api/auth/admin/login         | —      | Admin login              |
| GET    | /api/player/profile           | Player | Profile + wallet summary |
| GET    | /api/player/history           | Player | Bet history              |
| POST   | /api/player/deposit           | Player | Deposit funds            |
| GET    | /api/leaderboard              | Any    | Top 10 rankings          |
| GET    | /api/dealer/dashboard         | Dealer | Session + payout stats   |
| POST   | /api/dealer/ban/:player_id    | Dealer | Ban a player             |
| GET    | /api/admin/dashboard          | Admin  | Platform revenue report  |
| PATCH  | /api/admin/game/:game_id      | Admin  | Update game config       |

*(Full route list added as Phase 4 is completed)*

---

## Key Database Concepts Demonstrated

- **Triggers** — bet limit enforcement, wallet debit/credit, player and dealer
  stat updates, block status sync, wallet transaction logging
- **Indexes** — on PlayerID, SessionID, Result, TxnTime for fast dashboard queries
- **Window functions** — `RANK() OVER (...)` for all three leaderboard metrics
- **CTEs** — admin revenue summary using `WITH` clauses
- **Aggregate filters** — `COUNT(*) FILTER (WHERE Result = 'win')` for win rates
- **Transactions** — all bet placements wrapped in atomic DB transactions
- **Constraints** — CHECK, UNIQUE, FOREIGN KEY with appropriate ON DELETE rules

---

## Seed Data Summary

| Entity   | Count |
|----------|-------|
| Players  | 15 (1 blocked) |
| Dealers  | 4    |
| Admins   | 3    |
| Games    | 3 (Blackjack, Roulette, Coin Toss) |
| Sessions | 12   |
| Bets     | ~80  |