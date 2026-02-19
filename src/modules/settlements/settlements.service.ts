import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import { simplifySettlements, calculateNetBalances } from '../../utils/settlement-algorithm';

interface RecordSettlementData {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  note?: string;
}

export class SettlementsService {
  async getSimplifiedSettlements(groupId: string, userId: string) {
    // Verify user is member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership) {
      throw new Error('User is not a member of this group');
    }

    // Get all expenses
    const expenses = await prisma.expense.findMany({
      where: {
        groupId,
        deletedAt: null
      },
      include: {
        splits: true
      }
    });

    // Get confirmed settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        groupId,
        status: 'confirmed'
      }
    });

    // Get all group members
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Calculate net balances
    const balances: { [userId: string]: number } = {};
    const memberMap: { [userId: string]: { name: string; email: string } } = {};

    members.forEach(member => {
      balances[member.userId] = 0;
      memberMap[member.userId] = {
        name: member.user?.name || member.guestEmail || 'Guest',
        email: member.user?.email || member.guestEmail || ''
      };
    });

    // Add amounts paid
    expenses.forEach(expense => {
      balances[expense.paidBy] += Number(expense.amount);
    });

    // Subtract amounts owed
    expenses.forEach(expense => {
      expense.splits.forEach(split => {
        balances[split.userId] -= Number(split.amount);
      });
    });

    // Apply confirmed settlements
    settlements.forEach(settlement => {
      balances[settlement.fromUserId] += Number(settlement.amount);
      balances[settlement.toUserId] -= Number(settlement.amount);
    });

    // Convert to balance array format
    const balanceArray = Object.keys(balances)
      .map(uid => ({
        userId: uid,
        name: memberMap[uid].name,
        amount: balances[uid]
      }))
      .filter(b => Math.abs(b.amount) > 0.01);

    // Get simplified settlements
    const simplifiedTransactions = simplifySettlements(balanceArray);

    return {
      groupId,
      simplifiedSettlements: simplifiedTransactions,
      totalTransactions: simplifiedTransactions.length,
      detailedBalances: balanceArray
    };
  }

  async recordSettlement(data: RecordSettlementData, recordedBy: string) {
    const { groupId, fromUserId, toUserId, amount, note } = data;

    // Verify user is member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: recordedBy
        }
      }
    });

    if (!membership) {
      throw new Error('User is not a member of this group');
    }

    // Verify both users are members
    const fromMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: fromUserId
        }
      }
    });

    const toMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: toUserId
        }
      }
    });

    if (!fromMember || !toMember) {
      throw new Error('Invalid users for settlement');
    }

    // Determine initial status based on who is recording
    // If debtor (fromUser) records, requires creditor confirmation (two-way)
    // If creditor (toUser) records, auto-confirmed (one-way)
    const status = recordedBy === fromUserId ? 'pending' : 'confirmed';

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        fromUserId,
        toUserId,
        amount: new Decimal(amount),
        note,
        status,
        recordedBy,
        confirmedAt: status === 'confirmed' ? new Date() : null
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return settlement;
  }

  async confirmSettlement(settlementId: string, userId: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        group: {
          include: {
            members: true
          }
        }
      }
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    // Verify user is member
    const isMember = settlement.group.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new Error('Access denied');
    }

    // Only creditor (toUser) can confirm
    if (settlement.toUserId !== userId) {
      throw new Error('Only the creditor can confirm this settlement');
    }

    // Already confirmed
    if (settlement.status === 'confirmed') {
      throw new Error('Settlement already confirmed');
    }

    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'confirmed',
        confirmedAt: new Date()
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return updatedSettlement;
  }

  async getGroupSettlements(groupId: string, userId: string) {
    // Verify user is member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership) {
      throw new Error('User is not a member of this group');
    }

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        recordedAt: 'desc'
      }
    });

    return settlements;
  }

  async deleteSettlement(settlementId: string, userId: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        group: {
          include: {
            members: true
          }
        }
      }
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    // Verify user is member and has permission (either recorder or admin)
    const member = settlement.group.members.find(m => m.userId === userId);
    if (!member) {
      throw new Error('Access denied');
    }

    const canDelete = settlement.recordedBy === userId || member.role === 'admin';
    if (!canDelete) {
      throw new Error('Only the recorder or group admin can delete this settlement');
    }

    await prisma.settlement.delete({
      where: { id: settlementId }
    });

    return { message: 'Settlement deleted successfully' };
  }
}
