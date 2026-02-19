import { Request, Response } from 'express';
import { ExpensesService } from './expenses.service';

const expensesService = new ExpensesService();

export class ExpensesController {
  async createExpense(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
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
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getGroupExpenses(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { groupId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const expenses = await expensesService.getGroupExpenses(groupId, userId, limit, offset);
      return res.json(expenses);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getExpense(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { expenseId } = req.params;

      const expense = await expensesService.getExpenseById(expenseId, userId);
      return res.json(expense);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async updateExpense(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { expenseId } = req.params;
      const updateData = req.body;

      const expense = await expensesService.updateExpense(expenseId, updateData, userId);
      return res.json(expense);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteExpense(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { expenseId } = req.params;

      const result = await expensesService.deleteExpense(expenseId, userId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getBalances(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { groupId } = req.params;

      const balances = await expensesService.calculateBalances(groupId, userId);
      return res.json(balances);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
