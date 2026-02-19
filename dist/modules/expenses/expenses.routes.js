"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expenses_controller_1 = require("./expenses.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const expensesController = new expenses_controller_1.ExpensesController();
// All expense routes require authentication
router.use(auth_1.authenticate);
// Expense CRUD
router.post('/', (req, res) => expensesController.createExpense(req, res));
router.get('/group/:groupId', (req, res) => expensesController.getGroupExpenses(req, res));
router.get('/:expenseId', (req, res) => expensesController.getExpense(req, res));
router.patch('/:expenseId', (req, res) => expensesController.updateExpense(req, res));
router.delete('/:expenseId', (req, res) => expensesController.deleteExpense(req, res));
// Balance calculation
router.get('/group/:groupId/balances', (req, res) => expensesController.getBalances(req, res));
exports.default = router;
