# API Overview

## Quick Reference

**Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

## Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **Authentication** | | | |
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/me` | ✅ | Get current user |
| **Groups** | | | |
| POST | `/api/groups` | ✅ | Create group |
| GET | `/api/groups` | ✅ | Get user's groups |
| GET | `/api/groups/:groupId` | ✅ | Get group details |
| DELETE | `/api/groups/:groupId` | ✅ | Delete group (admin) |
| POST | `/api/groups/:groupId/members` | ✅ | Add member |
| DELETE | `/api/groups/:groupId/members/:memberId` | ✅ | Remove member (admin) |
| PATCH | `/api/groups/:groupId/members/:memberId/role` | ✅ | Update role (admin) |
| **Expenses** | | | |
| POST | `/api/expenses` | ✅ | Create expense |
| GET | `/api/expenses/group/:groupId` | ✅ | Get group expenses |
| GET | `/api/expenses/:expenseId` | ✅ | Get expense details |
| PATCH | `/api/expenses/:expenseId` | ✅ | Update expense |
| DELETE | `/api/expenses/:expenseId` | ✅ | Delete expense |
| GET | `/api/expenses/group/:groupId/balances` | ✅ | Calculate balances |
| **Settlements** | | | |
| GET | `/api/settlements/group/:groupId/simplified` | ✅ | Get simplified settlements |
| POST | `/api/settlements` | ✅ | Record settlement |
| GET | `/api/settlements/group/:groupId` | ✅ | Get settlements history |
| PATCH | `/api/settlements/:settlementId/confirm` | ✅ | Confirm settlement |
| DELETE | `/api/settlements/:settlementId` | ✅ | Delete settlement |
| **Health** | | | |
| GET | `/health` | ❌ | Health check |

**Total**: 22 endpoints

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Server

```bash
npm run dev
```

### 3. Access Documentation

Open [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

### 4. Test the API

#### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Create a Group (use token from login)
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Weekend Trip",
    "currency": "USD"
  }'
```

#### Create an Expense
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "groupId": "GROUP_ID_HERE",
    "title": "Dinner",
    "amount": 150.00,
    "paidBy": "USER_ID_HERE",
    "splitMethod": "equal",
    "category": "Food",
    "splits": [
      { "userId": "USER_1_ID", "amount": 50.00 },
      { "userId": "USER_2_ID", "amount": 50.00 },
      { "userId": "USER_3_ID", "amount": 50.00 }
    ]
  }'
```

## Data Models

### User
```typescript
{
  id: string (uuid)
  email: string
  name: string
  createdAt: datetime
  updatedAt: datetime
}
```

### Group
```typescript
{
  id: string (uuid)
  name: string
  currency: string
  createdBy: string (uuid)
  createdAt: datetime
  updatedAt: datetime
  deletedAt: datetime | null
}
```

### Expense
```typescript
{
  id: string (uuid)
  groupId: string (uuid)
  title: string
  amount: decimal
  paidBy: string (uuid)
  splitMethod: 'equal' | 'percentage' | 'custom'
  category: string | null
  note: string | null
  date: datetime
  createdAt: datetime
  updatedAt: datetime
  deletedAt: datetime | null
  splits: ExpenseSplit[]
}
```

### Settlement
```typescript
{
  id: string (uuid)
  groupId: string (uuid)
  fromUserId: string (uuid)
  toUserId: string (uuid)
  amount: decimal
  note: string | null
  status: 'pending' | 'confirmed'
  recordedBy: string (uuid)
  recordedAt: datetime
  confirmedAt: datetime | null
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get your token by:
1. Registering at `/api/auth/register`
2. Or logging in at `/api/auth/login`

## Features

✅ JWT Authentication (24-hour expiration)
✅ Password hashing (bcrypt)
✅ Role-based access (admin/member)
✅ Soft deletes for groups and expenses
✅ Three split methods (equal, percentage, custom)
✅ Balance calculation
✅ Settlement simplification algorithm
✅ Two-way settlement confirmation
✅ Guest user support
✅ Pagination for expenses
✅ CORS enabled
✅ Security headers (Helmet)
✅ Input validation

## Environment Variables

Create a `.env` file:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/expense_app
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Database Schema

See [prisma/schema.prisma](prisma/schema.prisma) for complete schema.

Models:
- User
- Group
- GroupMember
- Expense
- ExpenseSplit
- Settlement

## Response Format

### Success Response
```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2"
}
```

### Error Response
```json
{
  "error": "Error message here"
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found

## Documentation

- **Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Swagger Guide**: [SWAGGER-GUIDE.md](SWAGGER-GUIDE.md)
- **Setup Guide**: [SETUP.md](SETUP.md)
- **Full README**: [README.md](README.md)
- **Implementation Status**: [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md)

---

**Built with**: Node.js, Express, TypeScript, Prisma, PostgreSQL
