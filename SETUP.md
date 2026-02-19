# Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 15+ installed and running
- [ ] Git (optional, for version control)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- express, cors, helmet (server)
- @prisma/client, prisma (database)
- bcrypt, jsonwebtoken (authentication)
- typescript, ts-node, nodemon (development)

### 2. Configure Environment

The `.env` file is already created. Update these values if needed:

```env
# Database connection (update if you have different credentials)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/expense_app?schema=public"

# JWT secret (MUST change this for production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-min-32-characters-random"

# Other settings (usually OK as-is for development)
JWT_EXPIRES_IN="24h"
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 3. Set Up Database

#### Option A: Using existing PostgreSQL installation

```bash
# Create database (if using psql command line)
createdb expense_app

# OR using SQL
psql -U postgres
CREATE DATABASE expense_app;
\q

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

#### Option B: Using Docker PostgreSQL

```bash
# Start PostgreSQL container
docker run --name expense-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# Wait a few seconds, then run migrations
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:4000
📊 Health check: http://localhost:4000/health
📝 API endpoints:
   POST http://localhost:4000/api/auth/register
   POST http://localhost:4000/api/auth/login
   GET  http://localhost:4000/api/auth/me
```

### 5. Test the API

#### Test health check
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-10T..."}
```

#### Register a test user
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com"
  },
  "token": "eyJhbGc..."
}
```

#### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Get current user (replace TOKEN with your JWT)
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Common Issues

### Issue: "Cannot connect to database"

**Solution**: Make sure PostgreSQL is running and credentials in `.env` are correct.

```bash
# Check if PostgreSQL is running
pg_isready

# Or on Windows
pg_ctl status
```

### Issue: "Module not found"

**Solution**: Make sure all dependencies are installed:

```bash
npm install
npx prisma generate
```

### Issue: "Port 4000 already in use"

**Solution**: Change the PORT in `.env` file or kill the process using port 4000:

```bash
# Find process on port 4000
lsof -i :4000  # Mac/Linux
netstat -ano | findstr :4000  # Windows

# Kill the process
kill -9 PID  # Mac/Linux
taskkill /PID PID /F  # Windows
```

### Issue: "Prisma migration failed"

**Solution**: Reset the database and try again:

```bash
npx prisma migrate reset
npx prisma migrate dev --name init
```

## Next Steps

1. **Explore the API**: Use the [README.md](README.md) for full API documentation
2. **Use Prisma Studio**: View database data with `npm run prisma:studio`
3. **Build Frontend**: Follow the frontend setup guide once available
4. **Add Sample Data**: Use the API to create groups and expenses

## Development Workflow

```bash
# Start dev server (auto-reloads on changes)
npm run dev

# View database (opens http://localhost:5555)
npm run prisma:studio

# After schema changes
npx prisma migrate dev --name describe_changes
npx prisma generate

# Build for production
npm run build

# Start production server
npm start
```

## API Testing with Postman/Insomnia

1. Import endpoints from [README.md](README.md)
2. Create environment variables:
   - `BASE_URL`: http://localhost:4000
   - `TOKEN`: (set after login)
3. Test in this order:
   - Register → Login → Get Me
   - Create Group → Get Groups
   - Create Expense → Get Balances
   - Get Simplified Settlements

## Need Help?

- Check [README.md](README.md) for detailed API documentation
- Review [Technical Architecture](../_bmad-output/brainstorming/expense-app-technical-architecture.md)
- Inspect database with Prisma Studio
- Check server logs in terminal

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npx prisma studio` | Open database GUI |
| `npx prisma migrate dev` | Create and apply migration |
| `npx prisma generate` | Generate Prisma client |

## Ready to Deploy?

See [README.md](README.md) deployment section for production setup instructions.
