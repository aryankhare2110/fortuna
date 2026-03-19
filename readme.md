[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-14354C?style=for-the-badge&logo=python&logoColor=white)](#)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](#)

# FORTUNA CASINO
**A Full-Stack Casino Management System**

## Overview

Fortuna is a highly scalable, role-based Casino platform designed with a premium, physics-inspired UI and a robust relational database backend. 

The application partitions the ecosystem into three distinct user roles, ensuring secure and segregated access to game logic, wallet management, and administrative configurations.

### Key Features

#### Interactive Games
- **Roulette:** Physics-driven SVG roulette wheel with complex multi-betting capabilities (Red/Black, Odd/Even, Numbers).
- **Blackjack:** Card simulation against the Dealer with dynamic Hit/Stand logic and push mechanics.
- **Coin Toss:** Flipping mechanics with instant 2x multipliers.

#### Three-Tier Ecosystem
1. **Player Dashboard:** Access wallet (deposits & withdrawals), redeem reward points for cash, and jump into live game lobbies. Features transaction histories and personal betting analytics.
2. **Dealer Dashboard:** Manage live game sessions and analyze active player metrics. Features an automated "Suspicious Activity" flagger to detect card counting or high-risk behaviors.
3. **Admin Dashboard:** Control global operations. Instantly tweak dynamic Minimum and Maximum Table Limits, ban or unban players from the platform, and monitor total Gross Revenue and House Edge metrics.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS (for premium physics-inspired layouts)
- **Backend:** Python, Flask (lightweight, rapid API development)
- **Database:** PostgreSQL (with `psycopg2` for parameterized queries)
- **Architecture Pattern:** RESTful API with native SQL Triggers for ACID compliance

---

## Getting Started

Follow these instructions to run the Fortuna ecosystem locally on your machine.

### Prerequisites
Make sure you have the following installed:
* [Node.js](https://nodejs.org/) (v16+)
* [Python](https://www.python.org/downloads/) (v3.10+)
* [PostgreSQL](https://www.postgresql.org/download/)

### 1. Database Setup

1. Open your PostgreSQL terminal or pgAdmin.
2. Create a new database for the project:

   ```sql
   CREATE DATABASE fortuna;
   ```
3. Connect to the new database and initialize the schema and tables by running the provided SQL files exactly in this order:
   * First: `database/schema.sql` (Builds tables, views, and functions)
   * Second: `database/seed.sql` (Populates dummy accounts and test data)

### 2. Backend Setup (Python / Flask)

The backend powers the REST API and database connectivity.

1. Open a new terminal and navigate to the backend folder:
   ```bash
   cd fortuna-backend
   ```

2. **Create a Virtual Environment**
   * **Mac/Linux:** `python3 -m venv venv`
   * **Windows:** `python -m venv venv`

3. **Activate the Virtual Environment**
   * **Mac/Linux:** `source venv/bin/activate`
   * **Windows:** `.\venv\Scripts\activate`

4. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure Environment Variables**
   Create a new file named `.env` inside the `fortuna-backend` folder and add your database credentials:
   ```env
   DB_NAME=fortuna
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=super_secret_jwt_key
   ```

6. **Run the Server**
   ```bash
   python app.py
   ```
   *The backend should now be running on `http://localhost:5000`.*

### 3. Frontend Setup (React)

The frontend handles the UI and user experiences.

1. Open a *second* terminal and navigate to the frontend folder:
   ```bash
   cd fortuna-frontend
   ```

2. **Install Node Modules**
   ```bash
   npm install
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```
   *The application should now be live! Open your browser to `http://localhost:5173`.*

---

## Demo Credentials

Thanks to the `seed.sql` file, you already have test accounts to explore every facet of the casino.

**Disclaimer:** All seeded accounts use the exact same password:
Password: `Password@123`

* **Player:** `aryan@players.com` (High Roller) or `akash@players.com`
* **Dealer:** `amit.dealer@fortuna.com` or `sneha.dealer@fortuna.com`
* **Admin:** `rohan.admin@fortuna.com` or `priya.admin@fortuna.com`

---

*The house always wins but today, fortune favours the bold.*