import { Request, Response } from 'express';
import { GroupsService } from './groups.service';

const groupsService = new GroupsService();

export class GroupsController {
  async createGroup(req: Request, res: Response) {
    try {
      const { name, currency } = req.body;
      const userId = (req as any).user.id;

      if (!name || !currency) {
        return res.status(400).json({ error: 'Name and currency are required' });
      }

      const group = await groupsService.createGroup(name, currency, userId);
      return res.status(201).json(group);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getGroup(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user.id;

      const group = await groupsService.getGroupById(groupId, userId);
      return res.json(group);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async getUserGroups(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const groups = await groupsService.getUserGroups(userId);
      return res.json(groups);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async addMember(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const { email } = req.body;
      const userId = (req as any).user.id;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const member = await groupsService.addMember(groupId, userId, email, userId);
      return res.status(201).json(member);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { groupId, memberId } = req.params;
      const userId = (req as any).user.id;

      const result = await groupsService.removeMember(groupId, memberId, userId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateMemberRole(req: Request, res: Response) {
    try {
      const { groupId, memberId } = req.params;
      const { role } = req.body;
      const userId = (req as any).user.id;

      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }

      const member = await groupsService.updateMemberRole(groupId, memberId, role, userId);
      return res.json(member);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteGroup(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user.id;

      const result = await groupsService.deleteGroup(groupId, userId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
