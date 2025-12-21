# 💸 Expense Sharing Application (Splitwise-like)

A simplified **Expense Sharing Application** built using the **MERN Stack (MongoDB, Express, React, Node.js)**. This project allows users to create groups, add shared expenses, track balances, and settle dues — similar to Splitwise.

This project is designed for **backend/system design interviews** and demonstrates clean architecture, balance calculation, and simplification logic.

---

## 🎯 Objective

Build a backend-focused expense sharing system that supports:

* Creating groups
* Adding shared expenses
* Multiple split types
* Tracking who owes whom
* Simplifying balances

---

## ✨ Features

### 👥 Groups

* Create a group
* Add multiple users to a group

### 💰 Expenses

* Add expenses inside a group
* Specify who paid
* Supported split types:

  * **Equal Split** – amount divided equally
  * **Exact Split** – exact amounts per user
  * **Percentage Split** – percentage-based split

### 📊 Balance Tracking

* Tracks **who owes whom**
* Each user can see:

  * How much they owe others
  * How much others owe them
* Balances are **simplified (netted)**

### 🤝 Settlements (Extensible)

* Can easily add settle-up logic

---

## 🧠 Balance Simplification Logic

Instead of showing multiple transactions:

```
A owes B 100
B owes C 50
```

The system simplifies balances to:

```
A owes C 50
```

This is achieved by calculating **net balance per user**.

---

## 🏗️ Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Frontend

* React (Vite)
* Axios

## 🚀 Getting Started

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/expense-sharing-app.git
cd expense-sharing-app
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```
MONGO_URI=your_mongodb_connection_string
```

Start backend server:

```bash
npm run dev
```

Server runs on:

```
http://localhost:5000
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🔌 API Overview

### ➕ Add Expense

```
POST /api/expenses
```

Request Body:

```json
{
  "description": "Dinner",
  "amount": 300,
  "paidBy": "userId",
  "splitType": "EQUAL",
  "splits": []
}
```

---

## 📌 Assumptions

* Authentication is **out of scope**
* Users are pre-created
* All expenses belong to a group
* Currency is assumed to be INR

---

## 🔮 Future Improvements

* JWT Authentication
* Expense settlement endpoint
* UI improvements
* Transaction history
* Unit & integration tests

---

## 👨‍💻 Author

Built for **Machine Coding / Backend Interview Assignments**.

---

## ✅ Interview Ready

This project demonstrates:

* Clean architecture
* Business logic separation
* Balance simplification
* Real-world system design

Feel free to fork and extend 🚀
