"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesController = void 0;
const expenses_service_1 = require("./expenses.service");
const expensesService = new expenses_service_1.ExpensesService();
class ExpensesController {
    async createExpense(req, res) {
        try {
            const userId = req.user.id;
            const { groupId, title, amount, paidBy, splitMethod, category, note, date, splits } = req.body;
            if (!groupId || !amount || !paidBy || !splitMethod || !splits) {
                return res.status(400).json({
                    error: 'groupId, amount, paidBy, splitMethod, and splits are required'
                });
            }
            const expense = await expensesService.createExpense({
                groupId,
                title,
                amount: parseFloat(amount),
                paidBy,
                splitMethod,
                category,
                note,
                date: date ? new Date(date) : undefined,
                splits
            }, userId);
            return res.status(201).json(expense);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getGroupExpenses(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            const expenses = await expensesService.getGroupExpenses(groupId, userId, limit, offset);
            return res.json(expenses);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getExpense(req, res) {
        try {
            const userId = req.user.id;
            const { expenseId } = req.params;
            const expense = await expensesService.getExpenseById(expenseId, userId);
            return res.json(expense);
        }
        catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }
    async updateExpense(req, res) {
        try {
            const userId = req.user.id;
            const { expenseId } = req.params;
            const updateData = req.body;
            const expense = await expensesService.updateExpense(expenseId, updateData, userId);
            return res.json(expense);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async deleteExpense(req, res) {
        try {
            const userId = req.user.id;
            const { expenseId } = req.params;
            const result = await expensesService.deleteExpense(expenseId, userId);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getBalances(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const balances = await expensesService.calculateBalances(groupId, userId);
            return res.json(balances);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.ExpensesController = ExpensesController;
