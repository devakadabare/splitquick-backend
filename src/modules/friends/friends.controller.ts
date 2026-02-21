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
      const { amount, note } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'A positive amount is required' });
      }

      const results = await friendsService.settleFriend(
        userId,
        friendId,
        parseFloat(amount),
        note
      );
      return res.status(201).json({ settlements: results });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
