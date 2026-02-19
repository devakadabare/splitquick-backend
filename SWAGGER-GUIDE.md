# Swagger API Documentation Guide

## Overview

This project now includes comprehensive Swagger/OpenAPI 3.0 documentation for all backend APIs. The interactive documentation is automatically generated and can be accessed through your web browser.

## Accessing the Documentation

Once your server is running, you can access the Swagger UI at:

```
http://localhost:5000/api-docs
```

## Features

The Swagger documentation provides:

- **Interactive API Testing**: Test all endpoints directly from the browser
- **Request/Response Examples**: See example payloads for all API calls
- **Authentication**: Built-in JWT token authentication support
- **Schema Definitions**: Detailed data models and validation rules
- **Error Responses**: Complete error code documentation

## How to Use

### 1. Start the Server

```bash
npm run dev
```

### 2. Open Swagger UI

Navigate to [http://localhost:5000/api-docs](http://localhost:5000/api-docs) in your browser.

### 3. Authenticate (for Protected Endpoints)

Most endpoints require authentication. Here's how to set it up:

1. **Register a new user** or **Login** using the Authentication endpoints
2. Copy the JWT token from the response
3. Click the **"Authorize"** button at the top of the Swagger UI
4. Enter your token in the format: `Bearer <your-token>`
5. Click **"Authorize"** and then **"Close"**

Now you can test all protected endpoints!

### 4. Test Endpoints

1. Click on any endpoint to expand it
2. Click **"Try it out"** button
3. Fill in the required parameters
4. Click **"Execute"** to send the request
5. View the response below

## API Categories

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user's groups
- `GET /api/groups/{groupId}` - Get group details
- `DELETE /api/groups/{groupId}` - Delete group
- `POST /api/groups/{groupId}/members` - Add member
- `DELETE /api/groups/{groupId}/members/{memberId}` - Remove member
- `PATCH /api/groups/{groupId}/members/{memberId}/role` - Update role

### Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/group/{groupId}` - Get group expenses
- `GET /api/expenses/{expenseId}` - Get expense details
- `PATCH /api/expenses/{expenseId}` - Update expense
- `DELETE /api/expenses/{expenseId}` - Delete expense
- `GET /api/expenses/group/{groupId}/balances` - Get balances

### Settlements
- `GET /api/settlements/group/{groupId}/simplified` - Get simplified settlements
- `POST /api/settlements` - Record settlement
- `GET /api/settlements/group/{groupId}` - Get settlements history
- `PATCH /api/settlements/{settlementId}/confirm` - Confirm settlement
- `DELETE /api/settlements/{settlementId}` - Delete settlement

### Health
- `GET /health` - Health check

## Example Workflows

### Creating and Testing an Expense

1. **Register/Login** to get a JWT token
2. **Create a Group** using `POST /api/groups`
3. **Add Members** using `POST /api/groups/{groupId}/members`
4. **Create an Expense** using `POST /api/expenses` with split details
5. **View Balances** using `GET /api/expenses/group/{groupId}/balances`
6. **Get Simplified Settlements** using `GET /api/settlements/group/{groupId}/simplified`

### Recording a Settlement

1. **Create a Settlement** using `POST /api/settlements`
   - If debtor records: Status will be "pending"
   - If creditor records: Status will be "confirmed"
2. **Confirm Settlement** (if pending) using `PATCH /api/settlements/{settlementId}/confirm`

## Split Methods Examples

The documentation includes examples for all three split methods:

### Equal Split
```json
{
  "splitMethod": "equal",
  "amount": 150.00,
  "splits": [
    { "userId": "user1", "amount": 50.00 },
    { "userId": "user2", "amount": 50.00 },
    { "userId": "user3", "amount": 50.00 }
  ]
}
```

### Percentage Split
```json
{
  "splitMethod": "percentage",
  "amount": 300.00,
  "splits": [
    { "userId": "user1", "amount": 150.00, "percentage": 50.00 },
    { "userId": "user2", "amount": 90.00, "percentage": 30.00 },
    { "userId": "user3", "amount": 60.00, "percentage": 20.00 }
  ]
}
```

### Custom Split
```json
{
  "splitMethod": "custom",
  "amount": 85.50,
  "splits": [
    { "userId": "user1", "amount": 30.00 },
    { "userId": "user2", "amount": 55.50 }
  ]
}
```

## Response Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Validation error or bad data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found

## Production Configuration

When deploying to production:

1. Update the server URL in [src/config/swagger.ts](src/config/swagger.ts:15)
2. Replace with your actual production URL
3. Optionally disable Swagger in production by adding environment check:

```typescript
// In src/app.ts
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

## Files Structure

```
expense-app-backend/
├── src/
│   ├── config/
│   │   └── swagger.ts          # Swagger configuration and schemas
│   ├── swagger/
│   │   ├── auth.yaml           # Authentication endpoints
│   │   ├── groups.yaml         # Group management endpoints
│   │   ├── expenses.yaml       # Expense management endpoints
│   │   ├── settlements.yaml    # Settlement endpoints
│   │   └── health.yaml         # Health check endpoint
│   └── app.ts                  # Swagger UI integration
├── SWAGGER-GUIDE.md           # This file
└── package.json               # Added swagger dependencies
```

## Additional Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI 3.0 Guide](https://swagger.io/docs/specification/about/)

## Support

For questions or issues with the API documentation, please refer to the main [README.md](README.md) or contact the development team.

---

**Happy API Testing!** 🚀
