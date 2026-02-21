import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './modules/auth/auth.routes';
import groupsRoutes from './modules/groups/groups.routes';
import expensesRoutes from './modules/expenses/expenses.routes';
import settlementsRoutes from './modules/settlements/settlements.routes';
import friendsRoutes from './modules/friends/friends.routes';
import { swaggerSpec } from './config/swagger';

const app = express();

// Middleware
app.use(helmet());

// Allow multiple frontend origins
const allowedOrigins = [
  'http://192.168.1.41:3000',
  'http://localhost:3000',  // Next.js frontend
  'http://localhost:5173',  // Vite frontend
  'http://localhost:5174',  // Alternative Vite port
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Expense App API Documentation',
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/settlements', settlementsRoutes);
app.use('/api/friends', friendsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
