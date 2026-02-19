import { Request, Response } from 'express';
import { SettlementsService } from './settlements.service';

const settlementsService = new SettlementsService();

export class SettlementsController {
  async getSimplifiedSettlements(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { groupId } = req.params;

      const result = await settlementsService.getSimplifiedSettlements(groupId, userId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async recordSettlement(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { groupId, fromUserId, toUserId, amount, note } = req.body;

      if (!groupId || !fromUserId || !toUserId || !amount) {
        return res.status(400).json({
          error: 'groupId, fromUserId, toUserId, and amount are required'
        });
      }

      const settlement = await settlementsService.recordSettlement({
        groupId,
        fromUserId,
        toUserId,
        amount: parseFloat(amount),
        note
      }, userId);

      return res.status(201).json(settlement);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async confirmSettlement(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { settlementId } = req.params;

      const settlement = await settlementsService.confirmSettlement(settlementId, userId);
      return res.json(settlement);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getGroupSettlements(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { groupId } = req.params;

      const settlements = await settlementsService.getGroupSettlements(groupId, userId);
      return res.json(settlements);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteSettlement(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { settlementId } = req.params;

      const result = await settlementsService.deleteSettlement(settlementId, userId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
