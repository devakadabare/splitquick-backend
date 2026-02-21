import { Request, Response } from 'express';
import { FriendsService } from './friends.service';

const friendsService = new FriendsService();

export class FriendsController {
  async getFriends(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const friends = await friendsService.getFriends(userId);
      return res.json(friends);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async searchFriends(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const query = (req.query.q as string) || '';
      const results = await friendsService.searchFriends(userId, query);
      return res.json(results);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getFriendsWithBalances(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const data = await friendsService.getFriendsWithBalances(userId);
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async settleFriend(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { friendId } = req.params;
      const { amount, note, currency } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'A positive amount is required' });
      }

      const results = await friendsService.settleFriend(
        userId,
        friendId,
        parseFloat(amount),
        note,
        currency
      );
      return res.status(201).json({ settlements: results });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async createDirectExpense(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { friendId } = req.params;
      const { title, amount, paidBy, currency, category, note, date } = req.body;

      if (!title || !amount || !paidBy || !currency) {
        return res.status(400).json({
          error: 'title, amount, paidBy, and currency are required',
        });
      }

      if (!['me', 'friend'].includes(paidBy)) {
        return res.status(400).json({
          error: 'paidBy must be "me" or "friend"',
        });
      }

      const expense = await friendsService.createDirectExpense(userId, friendId, {
        title,
        amount: parseFloat(amount),
        paidBy,
        currency,
        category,
        note,
        date,
      });

      return res.status(201).json(expense);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getDirectExpenses(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { friendId } = req.params;

      const expenses = await friendsService.getDirectExpenses(userId, friendId);
      return res.json(expenses);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
