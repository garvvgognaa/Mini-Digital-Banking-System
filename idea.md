# Project Idea: Mini Digital Banking System (MDBS)

## Overview

**MDBS** is a full-stack digital banking platform that digitizes core banking operations. It allows customers to open accounts, manage funds, transfer money, apply for loans, and manage cards — all through a secure, role-based web application built in **TypeScript**.

---

## Problem Statement

Traditional banking involves manual paperwork, branch visits, and slow processes. MDBS digitizes these operations, providing customers with 24/7 access to their accounts, instant fund transfers, loan applications, and real-time notifications — while giving bank staff tools to manage KYC, accounts, and loans efficiently.

---

## Scope

### In Scope
- Customer registration with KYC verification
- Multi-type bank accounts (Savings, Current, Fixed Deposit)
- Fund transfers (within MDBS), deposits, withdrawals
- Loan application and EMI payment tracking
- Debit/Credit card management
- Beneficiary management for quick transfers
- Transaction history and downloadable statements
- Real-time notifications (transaction alerts, loan updates)
- Admin panel for user management and analytics
- Bank Teller portal for KYC and cash operations
- Full audit logging for compliance

### Out of Scope (v1)
- Inter-bank NEFT/RTGS/IMPS integration
- Real payment gateway (Razorpay/Stripe)
- Mobile app (iOS/Android)
- AI-based fraud detection

---

## Key Features

### 👤 Customer
- Register & Login (JWT Auth)
- Open Savings / Current / Fixed Deposit account
- Check account balance & transaction history
- Transfer funds to registered beneficiaries
- Deposit & withdraw money
- Apply for Personal / Home / Auto loan
- Pay loan EMIs and track remaining balance
- Request and manage Debit/Credit cards
- Add and manage beneficiaries
- Download account statement (PDF)
- View real-time notifications

### 🏦 Bank Teller
- Verify customer KYC documents (Aadhaar, PAN, Passport)
- Approve or reject account opening requests
- Process cash deposits and withdrawals at branch
- Approve or reject loan applications

### 🔐 Admin
- View and manage all users and accounts
- Freeze or unfreeze accounts
- Manage loan products (interest rates, types)
- View platform-wide analytics (total deposits, loans, transactions)
- View full audit logs for compliance

### ⚙️ System (Automated)
- Send transaction notifications
- Generate monthly account statements
- Calculate loan EMI and interest
- Log all user actions for audit trail

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Language** | TypeScript (strict mode) |
| **Backend Framework** | Node.js + Express.js |
| **ORM** | Prisma ORM |
| **Database** | PostgreSQL |
| **Authentication** | JWT (JSON Web Tokens) + bcrypt |
| **Validation** | Zod |
| **Architecture** | Layered: Routes → Controllers → Services → Repositories |
| **Design Patterns** | Repository, Factory, Strategy, Singleton, Observer |
| **Frontend** | React.js + TypeScript + plain CSS |
| **API Style** | RESTful API |
| **Dev Tools** | ts-node-dev, ESLint, Prettier |
| **Version Control** | Git + GitHub |

---

## OOP Principles Applied

| Principle | Application |
|---|---|
| **Encapsulation** | `AccountService` hides all balance logic; repositories hide DB queries |
| **Abstraction** | `IAccountRepository`, `ITransactionRepository` interfaces abstract data access |
| **Inheritance** | `User` base class extended by `Customer`, `BankTeller`, `Admin` |
| **Polymorphism** | `NotificationService` handles SMS/email/in-app via a common `INotifier` interface |

---

## Design Patterns Used

| Pattern | Where |
|---|---|
| **Repository Pattern** | All DB access through typed repository classes |
| **Factory Pattern** | `UserFactory` creates correct user type based on role |
| **Strategy Pattern** | `InterestCalculationStrategy` — different strategies for loan types |
| **Singleton Pattern** | Prisma DB client shared across the app |
| **Observer Pattern** | `EventEmitter` triggers notifications on transaction events |

---

## Core Entities

- **User** (Customer, BankTeller, Admin) — role-based
- **Account** — Savings / Current / Fixed Deposit
- **Transaction** — Deposit / Withdrawal / Transfer / Payment
- **Loan** — Personal / Home / Auto with EMI tracking
- **LoanPayment** — individual EMI payment records
- **Card** — Debit / Credit linked to account
- **Beneficiary** — saved payees for quick transfer
- **KYCDocument** — Aadhaar / PAN / Passport verification
- **Notification** — real-time alerts
- **AuditLog** — compliance trail of all actions

---

## Project Structure (Backend)

```
src/
├── config/           # DB config, env, constants
├── controllers/      # HTTP request handlers
├── services/         # Business logic
├── repositories/     # Data access layer (Prisma)
├── routes/           # Express route definitions
├── middlewares/      # Auth, error handling, validation
├── models/           # TypeScript interfaces & types
├── utils/            # Helpers (JWT, bcrypt, EMI calculator)
└── app.ts            # Express app entry point
```
