# Expense Sharing Application - Backend API

Backend API for the expense sharing application - "The ACTUALLY Free Splitwise Alternative"

## Features

- JWT-based authentication with bcrypt password hashing
- Group management with admin/member roles
- Guest user support (no signup required for viewing)
- Quick expense entry with multiple split methods (equal, percentage, custom)
- Balance-first dashboard with real-time calculations
- Settlement simplification algorithm (minimizes transactions)
- Dual confirmation modes (two-way and one-way settlement)
- Soft delete architecture for audit trail
- PostgreSQL database with Prisma ORM

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Security**: Helmet.js, CORS

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 15 or higher
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory (see `.env` for template):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_app?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-min-32-characters-random"
JWT_EXPIRES_IN="24h"
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

3. Set up database:
```bash
# Create database
createdb expense_app

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:4000

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt-token"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Groups

#### Create Group
```http
POST /api/groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Weekend Trip",
  "currency": "USD"
}
```

#### Get User's Groups
```http
GET /api/groups
Authorization: Bearer {token}
```

#### Get Group Details
```http
GET /api/groups/:groupId
Authorization: Bearer {token}
```

#### Add Member to Group
```http
POST /api/groups/:groupId/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "friend@example.com"
}
```

#### Remove Member
```http
DELETE /api/groups/:groupId/members/:memberId
Authorization: Bearer {token}
```

#### Update Member Role
```http
PATCH /api/groups/:groupId/members/:memberId/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "admin"
}
```

#### Delete Group
```http
DELETE /api/groups/:groupId
Authorization: Bearer {token}
```

### Expenses

#### Create Expense (Quick Add)
```http
POST /api/expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "groupId": "group-uuid",
  "title": "Dinner",
  "amount": 120.00,
  "paidBy": "user-uuid",
  "splitMethod": "equal",
  "category": "food",
  "note": "Pizza place",
  "date": "2026-02-10T19:00:00Z",
  "splits": [
    { "userId": "user-1-uuid" },
    { "userId": "user-2-uuid" },
    { "userId": "user-3-uuid" }
  ]
}
```

Split methods:
- `equal` - Split equally among all participants
- `percentage` - Split by percentage (must sum to 100)
- `custom` - Custom amounts (must sum to total)

Example with percentage split:
```json
{
  "groupId": "group-uuid",
  "amount": 100.00,
  "paidBy": "user-uuid",
  "splitMethod": "percentage",
  "splits": [
    { "userId": "user-1-uuid", "percentage": 50 },
    { "userId": "user-2-uuid", "percentage": 30 },
    { "userId": "user-3-uuid", "percentage": 20 }
  ]
}
```

#### Get Group Expenses
```http
GET /api/expenses/group/:groupId?limit=50&offset=0
Authorization: Bearer {token}
```

#### Get Expense Details
```http
GET /api/expenses/:expenseId
Authorization: Bearer {token}
```

#### Update Expense
```http
PATCH /api/expenses/:expenseId
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated title",
  "category": "travel"
}
```

#### Delete Expense
```http
DELETE /api/expenses/:expenseId
Authorization: Bearer {token}
```

#### Get Group Balances
```http
GET /api/expenses/group/:groupId/balances
Authorization: Bearer {token}
```

Response:
```json
{
  "groupId": "group-uuid",
  "balances": [
    {
      "userId": "user-1-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "balance": 50.00,
      "status": "owed"
    },
    {
      "userId": "user-2-uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "balance": -50.00,
      "status": "owes"
    }
  ],
  "totalExpenses": 150.00,
  "expenseCount": 5
}
```

### Settlements

#### Get Simplified Settlements
```http
GET /api/settlements/group/:groupId/simplified
Authorization: Bearer {token}
```

Response shows optimized settlement transactions:
```json
{
  "groupId": "group-uuid",
  "simplifiedSettlements": [
    {
      "from": "user-2-uuid",
      "fromName": "Jane Smith",
      "to": "user-1-uuid",
      "toName": "John Doe",
      "amount": 50.00
    }
  ],
  "totalTransactions": 1,
  "detailedBalances": [...]
}
```

#### Record Settlement
```http
POST /api/settlements
Authorization: Bearer {token}
Content-Type: application/json

{
  "groupId": "group-uuid",
  "fromUserId": "debtor-uuid",
  "toUserId": "creditor-uuid",
  "amount": 50.00,
  "note": "Cash payment"
}
```

Settlement confirmation modes:
- **Two-way**: If debtor records payment, status is "pending" until creditor confirms
- **One-way**: If creditor records receipt, status is "confirmed" immediately

#### Confirm Settlement
```http
PATCH /api/settlements/:settlementId/confirm
Authorization: Bearer {token}
```

Only the creditor can confirm a pending settlement.

#### Get Group Settlements
```http
GET /api/settlements/group/:groupId
Authorization: Bearer {token}
```

#### Delete Settlement
```http
DELETE /api/settlements/:settlementId
Authorization: Bearer {token}
```

Only the recorder or group admin can delete.

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T12:00:00.000Z"
}
```

## Database Schema

### Core Models

- **User** - User accounts with authentication
- **Group** - Expense groups (soft delete enabled)
- **GroupMember** - User-group relationships with roles (admin/member) and guest status
- **Expense** - Expense records (soft delete enabled)
- **ExpenseSplit** - Individual split amounts per expense
- **Settlement** - Payment records with confirmation status

### Settlement Algorithm

The settlement simplification algorithm uses a greedy approach:

1. Calculate net balance for each person (amount owed - amount owing)
2. Separate into creditors (positive) and debtors (negative)
3. Sort both lists by absolute amount (descending)
4. Match largest creditor with largest debtor repeatedly
5. Continue until all balances are settled

**Example:**
- Input: A paid $3000, B paid $6000, split 3 ways (each owes $3000)
- Balances: A = $0, B = +$3000, C = -$3000
- Output: C pays B $3000 (1 transaction instead of multiple)

Time Complexity: O(n log n)

## Security Features

- **JWT Authentication**: 24-hour token expiration
- **Password Hashing**: bcrypt with 10 salt rounds
- **Input Validation**: All inputs validated
- **CORS**: Configured for frontend origin
- **Helmet.js**: Security headers
- **SQL Injection Protection**: Prisma ORM with prepared statements
- **Soft Deletes**: Audit trail preservation

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message description"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request / validation error
- `401` - Unauthorized / invalid token
- `404` - Resource not found
- `500` - Server error

## Development Tools

### Prisma Studio

View and edit database data:
```bash
npm run prisma:studio
```

Opens at http://localhost:5555

### Database Migrations

Create a new migration:
```bash
npx prisma migrate dev --name migration_name
```

Apply migrations in production:
```bash
npx prisma migrate deploy
```

Reset database (development only):
```bash
npx prisma migrate reset
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Set environment variables on your hosting platform

3. Run database migrations:
```bash
npx prisma migrate deploy
```

4. Start the server:
```bash
npm start
```

Recommended platforms:
- **Railway** - Easy deployment with PostgreSQL
- **Heroku** - With Heroku Postgres addon
- **DigitalOcean** - App Platform with managed database

## Project Structure

```
expense-app-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client
│   │   └── jwt.ts             # JWT utilities
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   ├── modules/
│   │   ├── auth/              # Authentication module
│   │   ├── groups/            # Group management module
│   │   ├── expenses/          # Expense management module
│   │   └── settlements/       # Settlement module
│   ├── utils/
│   │   └── settlement-algorithm.ts  # Settlement simplification
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

## Author

Devaka

## Support

For issues and questions, please open an issue in the repository.
