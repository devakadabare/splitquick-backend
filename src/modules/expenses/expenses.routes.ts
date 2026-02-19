import { Router } from 'express';
import { ExpensesController } from './expenses.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const expensesController = new ExpensesController();

// All expense routes require authentication
router.use(authenticate);

// Expense CRUD
router.post('/', (req, res) => expensesController.createExpense(req, res));
router.get('/group/:groupId', (req, res) => expensesController.getGroupExpenses(req, res));
router.get('/:expenseId', (req, res) => expensesController.getExpense(req, res));
router.patch('/:expenseId', (req, res) => expensesController.updateExpense(req, res));
router.delete('/:expenseId', (req, res) => expensesController.deleteExpense(req, res));

// Balance calculation
router.get('/group/:groupId/balances', (req, res) => expensesController.getBalances(req, res));

export default router;
