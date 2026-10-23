<<<<<<< HEAD
# FitLife — Personalized Fitness & Wellness Platform

[![Frontend Build](https://img.shields.io/badge/Frontend-Vite%20%7C%20React%2019-61DAFB?logo=react&logoColor=black)](#frontend-stack)
[![Backend API](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%205-339933?logo=node.js&logoColor=white)](#backend-stack)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-47A248?logo=mongodb&logoColor=white)](#data-models)
[![Security](https://img.shields.io/badge/Security-JWT%20%7C%20Helmet%20%7C%20Bcrypt-critical)](#security--best-practices)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **FitLife** is a full-stack fitness and wellness management platform engineered for end-to-end workout logging, nutritional macro tracking, goal progression analytics, and guided exercise execution. Built with modern full-stack best practices, secure JWT-based stateless authentication, responsive dark glassmorphic UI, robust RESTful APIs, and automated test coverage.

---

## 📌 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Key Features](#-key-features)
- [System Design & Entity Relationships](#-system-design--entity-relationships)
- [API Reference](#-api-reference)
- [Security Architecture](#-security-architecture)
- [Local Development Setup](#-local-development-setup)
- [Automated Testing](#-automated-testing)
- [Deployment Guide](#-deployment-guide)
- [Placement & Interview Talking Points](#-placement--interview-talking-points)

---

## 🚀 Architecture & Tech Stack

### Frontend Stack
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) for high-speed HMR and optimized production bundles.
- **Styling**: Modern CSS Design System (dark-mode first, glassmorphism, fluid typography, responsive flex/grid layouts) + Tailwind CSS utilities.
- **Routing**: [React Router v7](https://reactrouter.com/) with protected route middleware and automatic unauthenticated redirects.
- **Visualizations**: [Recharts](https://recharts.org/) for interactive weekly workout duration trends, caloric burn distributions, and macronutrient breakdowns.
- **State & Notifications**: React Context API (`AuthContext`), Axios HTTP client with request/response interceptors, and `react-hot-toast` for micro-feedback.

### Backend Stack
- **Runtime & Framework**: [Node.js](https://nodejs.org/) & [Express 5](https://expressjs.com/).
- **Database**: [MongoDB](https://www.mongodb.com/) using [Mongoose ODM](https://mongoosejs.com/) with indexed schemas and relational referential integrity.
- **Security & Middleware**: `jsonwebtoken` (JWT), `bcryptjs` (salt factor 10), `helmet` (HTTP security headers), `cors`, `express-rate-limit` (brute-force defense), and `express-validator` (sanitization & schema verification).
- **Testing**: [Jest](https://jestjs.io/) and [Supertest](https://github.com/ladjs/supertest) for automated integration testing.

```
┌────────────────────────────────────────────────────────┐
│                   FitLife Client (SPA)                 │
│         React 19 + React Router v7 + Recharts          │
└───────────────────────────┬────────────────────────────┘
                            │ Axios (JWT Bearer Auth)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Express 5 REST API                   │
│   Rate Limiter ──> Helmet Security ──> JWT Auth Gate   │
└──────┬────────────────────┬────────────────────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Auth Service │     │ Workout &    │     │ Goal & Meal  │
│ & User Model │     │ Exercise API │     │ Trackers     │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
               ┌────────────────────────┐
               │    MongoDB Database    │
               │ (Indexed Collections)  │
               └────────────────────────┘
```

---

## ✨ Key Features

1. **Secure User Authentication & Profile Governance**
   - User registration and login with client + server validation.
   - Passwords securely hashed with `bcryptjs`.
   - JWT tokens stored in browser localStorage and automatically injected via Axios request interceptors.
   - Profile management with dynamic Body Mass Index (BMI) calculator, health category classification, and secure password updates.

2. **Interactive Analytics Dashboard**
   - High-level metric KPI cards: Total Workouts, Calories Burned, Active Goals, and Calorie Intake.
   - Responsive weekly/monthly activity charts using Recharts.
   - Quick-glance list of upcoming goals and latest workouts.

3. **Workout Logger & Exercise Tracker**
   - Complete CRUD (Create, Read, Update, Delete) operations for training sessions.
   - Support for multiple workout categories (Strength, Cardio, HIIT, Yoga, Flexibility, Sports).
   - Detailed set/rep/weight tracking with note capabilities and duration/calorie counters.

4. **Nutritional & Macronutrient Manager**
   - Log meals by category: Breakfast, Lunch, Dinner, and Snacks.
   - Instant macro breakdown calculation (Protein, Carbohydrates, Fats) with interactive visual charts.
   - Daily calorie consumption tracking against calculated target thresholds.

5. **Goal Setting & Milestone Tracking**
   - Target tracking across weight loss/gain, workout frequency, running distance, or strength benchmarks.
   - Automatic status updates (`active`, `completed`, `abandoned`) when milestones are reached.
   - Visual progress bars showing percentage completed toward target deadlines.

6. **Comprehensive Exercise Library**
   - Pre-seeded database featuring 30+ categorized exercises with instructions, tips, target muscle groups, and difficulty ratings.
   - Real-time search and filter controls by muscle group and difficulty.

---

## 🗄 System Design & Entity Relationships

```
+-----------------------------------+        +-----------------------------------+
|               User                | 1    * |              Workout              |
+-----------------------------------+--------+-----------------------------------+
| _id: ObjectId                     |        | _id: ObjectId                     |
| name: String                      |        | userId: Ref(User) [Indexed]       |
| email: String [Unique, Indexed]   |        | title: String                     |
| password: String (Hashed)         |        | type: Enum (strength, cardio, ..) |
| fitnessLevel: Enum                |        | duration: Number (minutes)        |
| height: Number                    |        | caloriesBurned: Number            |
| weight: Number                    |        | exercises: Array [{name, sets..}] |
| dailyCalorieGoal: Number          |        | date: Date [Indexed]              |
| createdAt, updatedAt: Date        |        | notes: String                     |
+-----------------------------------+        +-----------------------------------+
         | 1                        | 1
         |                          |
         | *                        | *
+-----------------------------------+        +-----------------------------------+
|               Goal                |        |               Meal                |
+-----------------------------------+        +-----------------------------------+
| _id: ObjectId                     |        | _id: ObjectId                     |
| userId: Ref(User) [Indexed]       |        | userId: Ref(User) [Indexed]       |
| title: String                     |        | name: String                      |
| category: Enum (weight, reps, ..) |        | mealType: Enum (breakfast, ..)    |
| targetValue: Number               |        | calories: Number                  |
| currentValue: Number              |        | protein: Number (grams)           |
| unit: String                      |        | carbs: Number (grams)             |
| deadline: Date                    |        | fat: Number (grams)               |
| status: Enum (active, completed)  |        | date: Date [Indexed]              |
+-----------------------------------+        +-----------------------------------+
```

---

## 🔌 API Reference

### 1. Authentication & Profile (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT | No |
| `GET` | `/api/auth/me` | Fetch active user profile | Yes (Bearer) |
| `PUT` | `/api/auth/profile` | Update personal metrics (height, weight, goals) | Yes (Bearer) |
| `PUT` | `/api/auth/change-password` | Update account password securely | Yes (Bearer) |

### 2. Workouts (`/api/workouts`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/workouts` | Retrieve user workouts (supports date & type filtering) | Yes |
| `GET` | `/api/workouts/stats` | Aggregated workout stats for charts & KPIs | Yes |
| `POST` | `/api/workouts` | Log a new workout session | Yes |
| `PUT` | `/api/workouts/:id` | Update an existing workout | Yes |
| `DELETE` | `/api/workouts/:id` | Remove a workout record | Yes |

### 3. Nutrition (`/api/nutrition`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/nutrition` | Get user logged meals (supports date query) | Yes |
| `GET` | `/api/nutrition/daily-summary` | Daily aggregated macros & calories | Yes |
| `POST` | `/api/nutrition` | Log a meal with macros | Yes |
| `PUT` | `/api/nutrition/:id` | Edit meal details | Yes |
| `DELETE` | `/api/nutrition/:id` | Remove a meal log | Yes |

### 4. Goals (`/api/goals`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/goals` | List all goals with current progress | Yes |
| `POST` | `/api/goals` | Create a new fitness goal | Yes |
| `PUT` | `/api/goals/:id` | Update goal details or progress | Yes |
| `DELETE` | `/api/goals/:id` | Delete a goal | Yes |

### 5. Exercises (`/api/exercises`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/exercises` | Browse pre-seeded exercise library with query filters | Yes |
| `GET` | `/api/exercises/:id` | Get single exercise breakdown & instructions | Yes |

---

## 🛡 Security & Best Practices

- **Password Cryptography**: Passwords are salted and hashed using `bcryptjs` with 10 salt rounds before being written to MongoDB. Plain text passwords are never stored or returned in API responses (`select: false` on password field).
- **Stateless Authorization**: All protected endpoints enforce Bearer Token verification using `jsonwebtoken`. Expired or forged tokens receive strict 401 Unauthorized responses.
- **Rate Limiting**: Integrated `express-rate-limit` prevents brute-force credential stuffing attacks on authentication endpoints.
- **HTTP Header Hardening**: Secured with `helmet` to mitigate cross-site scripting (XSS), clickjacking, and MIME sniffing.
- **Input Sanitization**: Request bodies are validated using `express-validator` to guarantee type safety and prevent injection attacks.
- **Scoped User Data**: Database queries explicitly filter by `userId: req.user._id` to prevent Insecure Direct Object References (IDOR).

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI)
- `npm` or `yarn`

### 1. Clone & Setup Backend Server
```bash
# Navigate to the server folder
cd server

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and adjust variables as needed:
# PORT=5000
# MONGODB_URI=mongodb://127.0.0.1:27017/fitlife
# JWT_SECRET=your_super_secret_jwt_key
# CLIENT_URL=http://localhost:5173

# Seed the exercise database with 30+ categorized movements
npm run seed

# Start server in development mode
npm run dev
```

### 2. Setup Frontend Client
```bash
# In the root repository directory
npm install

# Verify your frontend environment variable (.env)
# VITE_API_URL=http://localhost:5000/api

# Run Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Automated Testing

Backend integration test suites are written using Jest and Supertest.

```bash
# Navigate to server
cd server

# Run complete test suite
npm test
```

The test suites validate:
- User registration (valid data, duplicate email rejection, short passwords).
- User authentication and JWT issuance.
- Workout creation, reading, and unauthorized access rejection.
- Data sanitization and error responses.

---

## 🚢 Deployment Guide

### Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. Link your repository in the [Vercel Dashboard](https://vercel.com).
3. Set the Root Directory to `./` and Build Command to `npm run build`.
4. Add environment variable: `VITE_API_URL=https://your-backend-service.onrender.com/api`.
5. The included `vercel.json` ensures client-side routing fallback works out of the box.

### Backend Deployment (Render / Railway)
1. In [Render](https://render.com), create a new **Web Service** pointing to the `server/` directory.
2. Build command: `npm install`
3. Start command: `node src/index.js`
4. Configure Environment Variables in Render:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your-mongodb-atlas-connection-string>`
   - `JWT_SECRET=<strong-random-secret>`
   - `CLIENT_URL=https://your-frontend.vercel.app`
5. Run the seed script once via Render shell or locally pointing to your Atlas DB: `node scripts/seedExercises.js`.

---

## 🎓 Placement & Interview Talking Points

During technical interviews and campus placement rounds, here are architectural decisions and trade-offs you can highlight:

1. **Why JWT over Session Cookies?**
   - Explain stateless authentication: scalability across multiple server instances without shared Redis session state, making cloud deployments cost-efficient and straightforward.
2. **Database Schema Design & Indexing**:
   - Compound indexes on `{ userId: 1, date: -1 }` on `workouts` and `meals` ensure rapid timeline querying for dashboards without triggering collection scans.
3. **Decoupled Frontend / Backend Architecture**:
   - Clean separation of concerns with RESTful API design allows the client application to be swapped (e.g., React Native mobile app) without altering core backend business logic.
4. **Resilient Error Handling & UX Feedback**:
   - Centralized Axios interceptors handle expired sessions (auto-logout and redirect), while `react-hot-toast` provides immediate, non-intrusive error feedback to users.
5. **Chart Performance & Responsiveness**:
   - Utilized Recharts `<ResponsiveContainer>` with memoized aggregates to prevent unnecessary canvas/SVG recalculations during parent component re-renders.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
=======
# 🌟 FitLife – Your Fitness Companion

FitLife is a modern, responsive fitness web application that helps users explore workouts, nutrition tips, and healthy living strategies. Built with React and CSS, it delivers a clean design, engaging UI, and a user-friendly experience for fitness enthusiasts.

🌐 **Live:** [fitlife-liart.vercel.app](https://fitlife-liart.vercel.app)

---

## 🚀 Features

- ✅ **Clean, modern, and fully responsive design**
- ✅ **Easy navigation with a smooth layout**
- ✅ **Nutrition and diet tips for healthier living**
- ✅ **Exercise and workout recommendations**
- ✅ **Simple, intuitive interface**
- ✅ **Optimized for all screen sizes (desktop, tablet, mobile)**



## 🚀 Getting Started

Follow these steps to run the project locally:

  # 1️⃣ Clone the repository
git clone https://github.com/Rashmijoshi18/fitlife.git

# 2️⃣ Navigate to the project directory
cd fitlife

# 3️⃣ Install dependencies
npm install

# 4️⃣ Start the development server
npm run dev




🤝 Contributing
Contributions are welcome!
If you have ideas for new features or want to fix bugs, please feel free to:

Open an issue

Submit a pull request

Stay Fit, Stay Healthy! 💪

                                                          

                

>>>>>>> 09fc67723421aa249b88fc5c1ac6241705de6fb0
