# ✈️ Travel Itinerary & Expense Tracker (Practical 10)

A full-stack web application designed to plan trips, track travel expenses, and visualize destinations interactively on maps. Built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, **Tailwind CSS**, and **Leaflet.js (OpenStreetMap)**.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Application Flow & Usage](#-application-flow--usage)
- [Troubleshooting](#-troubleshooting)

---

## 📖 Overview

The **Travel Itinerary & Expense Tracker** provides a centralized dashboard for travelers and travel administrators to organize trips, maintain budgets, and inspect journey routes. It features full CRUD operations for travel itineraries and expenses, integrated GPS geolocation and reverse geocoding, and map rendering.

---

## ✨ Key Features

- **🔐 Admin Authentication & Security**
  - Secure registration and login workflows (`signup.html`, `login.html`).
  - Passwords hashed using **bcrypt** (salt rounds = 10).
  - Stateless authentication tokens via **JSON Web Tokens (JWT)**.
  - Client-side session tracking via browser `localStorage`.

- **📍 Geolocation & Interactive Map Preview**
  - **Browser GPS Integration**: One-click "Detect Location" using the HTML5 Geolocation API.
  - **Reverse Geocoding**: Automatically resolves detected coordinates to address names using OpenStreetMap Nominatim.
  - **Mini Map Picker**: Embedded Leaflet mini-map with a draggable marker to pinpoint destinations manually.
  - **Global Map View**: Full tabbed map plotting all planned itineraries with custom popups showing destination, traveler name, travel dates, and status.

- **🗓️ Itinerary Management (CRUD)**
  - Create trips with Trip ID, destination, traveler name, travel/return dates, status (`Planned`, `Ongoing`, `Completed`, `Cancelled`), notes, and GPS coordinates.
  - View all trips in a clean tabular view.
  - In-place updates for trip details and coordinates.
  - Delete itineraries with **cascading deletion** (associated expenses are automatically purged).

- **💵 Expense Tracking**
  - Log expenses linked to specific itineraries.
  - Categorized spending: Flight, Hotel, Food, Transport, Activities, Shopping, and Misc.
  - Dynamic total expense calculation per trip.
  - Modal view to inspect individual expense breakdowns and delete single expenses.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, JavaScript (Vanilla ES6+), [Tailwind CSS](https://tailwindcss.com/) (CDN), [Leaflet.js](https://leafletjs.com/) (OpenStreetMap) |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [CORS](https://www.npmjs.com/package/cors) |
| **Database** | [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/) |
| **Authentication** | [bcrypt](https://www.npmjs.com/package/bcrypt), [jsonwebtoken (JWT)](https://www.npmjs.com/package/jsonwebtoken) |

---

## 📂 Project Structure

```text
travel_itinerary_p10/
├── app.js                 # Express server, MongoDB connection, Mongoose models & API routes
├── package.json           # Node.js project manifest & dependencies
├── package-lock.json      # Dependency lockfile
├── login.html             # Admin Login page
├── signup.html            # Admin Signup / Registration page
├── dashboard.html         # Main dashboard (Itineraries, Expenses, Table, Leaflet Map)
└── node_modules/          # Installed npm packages
```

---

## 🗄️ Database Schema

The database (`travel_tracker_db`) consists of three Mongoose models:

### 1. `Admin`
```javascript
{
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true }, // bcrypt hashed
  createdAt: { type: Date, default: Date.now }
}
```

### 2. `Itinerary`
```javascript
{
  tripId:       { type: String, required: true },
  destination:  { type: String, required: true },
  travelerName: { type: String, required: true },
  travelDate:   { type: Date, required: true },
  returnDate:   { type: Date, required: true },
  status:       { type: String, enum: ['Planned', 'Ongoing', 'Completed', 'Cancelled'], default: 'Planned' },
  notes:        { type: String, default: '' },
  latitude:     { type: Number, default: null },
  longitude:    { type: Number, default: null },
  createdAt:    { type: Date, default: Date.now }
}
```

### 3. `Expense`
```javascript
{
  itineraryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary', required: true },
  category:    { type: String, required: true },
  description: { type: String },
  amount:      { type: Number, required: true },
  expenseDate: { type: Date, required: true },
  createdAt:   { type: Date, default: Date.now }
}
```

---

## 🔌 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `POST` | `/api/admin/register` | Register a new admin | `{ name, email, password }` |
| `POST` | `/api/admin/login` | Log in existing admin & issue JWT | `{ email, password }` |

### ✈️ Itineraries
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/itineraries` | Create a new trip itinerary |
| `GET` | `/api/itineraries` | Retrieve all itineraries (aggregated with `totalExpense`) |
| `GET` | `/api/itineraries/:id` | Retrieve single itinerary details |
| `PUT` | `/api/itineraries/:id` | Update itinerary details & coordinates |
| `DELETE`| `/api/itineraries/:id` | Delete itinerary and all its associated expenses |

### 💳 Expenses
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/expenses` | Add an expense to an itinerary |
| `GET` | `/api/expenses/:itineraryId` | Retrieve all expenses for a specific itinerary |
| `DELETE`| `/api/expenses/:id` | Delete a single expense |

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v14.x or later installed)
   ```bash
   node -v
   npm -v
   ```
2. **MongoDB** installed and running locally on default port `27017`:
   - Start MongoDB service:
     - **Windows**: Start the MongoDB service via `services.msc` or run `net start MongoDB` in admin terminal.
     - **macOS / Linux**: `sudo systemctl start mongod` or `brew services start mongodb-community`.

### Installation

1. Open your terminal and navigate to the project directory:
   ```bash
   cd travel_itinerary_p10/travel_itinerary_p10
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. Start the Express server:
   ```bash
   npm start
   # or
   node app.js
   ```

2. When the server launches, you will see:
   ```text
   Connected to MongoDB - Travel Tracker DB
   Server running on http://localhost:5000
   ```

3. Open your web browser and navigate to:
   - **Signup**: [http://localhost:5000/signup.html](http://localhost:5000/signup.html)
   - **Login**: [http://localhost:5000/login.html](http://localhost:5000/login.html)
   - **Dashboard**: [http://localhost:5000/dashboard.html](http://localhost:5000/dashboard.html)

---

## 🖥️ Application Flow & Usage

1. **Create an Account**:
   - Go to `http://localhost:5000/signup.html`, enter your name, email, and password, and register.
2. **Sign In**:
   - Sign in on `login.html`. Upon successful login, the JWT and admin username are saved in `localStorage`, and you are redirected to `dashboard.html`.
3. **Add an Itinerary**:
   - Click the **Itinerary Form** tab.
   - Enter trip details (Trip ID, destination, traveler, departure & return dates, notes).
   - Click **"Detect Location"** to fetch GPS coordinates automatically, or drag the pin on the mini-map to adjust coordinates.
   - Click **"Save Itinerary"**.
4. **Log Expenses**:
   - Switch to the **Expense Form** tab.
   - Select the target trip from the dropdown.
   - Choose the category (Flight, Hotel, Food, etc.), enter the cost, date, and description.
   - Click **"Add Expense"**.
5. **Review Records**:
   - Navigate to the **All Records** tab to view all trips and their total accumulated costs.
   - Click **"View Expenses"** to see itemized receipts with delete options.
   - Click **"Edit"** to modify trip data or **"Delete"** to remove the trip and its expenses.
6. **Inspect Interactive Map**:
   - Switch to the **Map View** tab to see all your destinations marked with interactive pins across the world map.

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `MongoDB Connection Error` | MongoDB service is stopped or port `27017` is blocked | Ensure MongoDB is running locally (`mongod` or through Windows Services). |
| `EADDRINUSE: address already in use :::5000` | Another process is using port 5000 | Terminate the process using port 5000 (`Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process`) or change the port in `app.js`. |
| Geolocation not populating | Browser denied location access or HTTP restriction | Click the lock/site settings icon in your browser URL bar and set **Location** permission to **Allow**. |
| Map tiles not displaying | No active internet connection | Leaflet relies on OpenStreetMap CDN tiles; ensure you have internet access. |
