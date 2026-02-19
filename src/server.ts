import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`\n🚀 Expense Sharing API Server`);
  console.log(`================================`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`\n📝 Available Endpoints:\n`);

  console.log(`Authentication:`);
  console.log(`  POST   /api/auth/register`);
  console.log(`  POST   /api/auth/login`);
  console.log(`  GET    /api/auth/me`);

  console.log(`\nGroups:`);
  console.log(`  POST   /api/groups`);
  console.log(`  GET    /api/groups`);
  console.log(`  GET    /api/groups/:id`);
  console.log(`  DELETE /api/groups/:id`);
  console.log(`  POST   /api/groups/:id/members`);

  console.log(`\nExpenses:`);
  console.log(`  POST   /api/expenses`);
  console.log(`  GET    /api/expenses/group/:groupId`);
  console.log(`  GET    /api/expenses/group/:groupId/balances`);
  console.log(`  PATCH  /api/expenses/:id`);
  console.log(`  DELETE /api/expenses/:id`);

  console.log(`\nSettlements:`);
  console.log(`  GET    /api/settlements/group/:groupId/simplified`);
  console.log(`  POST   /api/settlements`);
  console.log(`  PATCH  /api/settlements/:id/confirm`);
  console.log(`  GET    /api/settlements/group/:groupId`);

  console.log(`\n================================`);
  console.log(`📚 See README.md for full API documentation`);
  console.log(`⚡ Ready to accept requests!\n`);
});
