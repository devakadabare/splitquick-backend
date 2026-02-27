import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import { ExpensesService } from '../expenses/expenses.service';

const expensesService = new ExpensesService();

export class FriendsService {
  // Ensure canonical ordering: userAId < userBId for unique constraint
  private canonical(id1: string, id2: string): [string, string] {
    return id1 < id2 ? [id1, id2] : [id2, id1];
  }

  async addFriend(userId: string, friendUserId: string): Promise<void> {
    if (userId === friendUserId) return;

    const [userAId, userBId] = this.canonical(userId, friendUserId);

    await prisma.friendship.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: {},
    });
  }

  async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, name: true, email: true } },
        userB: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => {
      const friend = f.userAId === userId ? f.userB : f.userA;
      return {
        friendshipId: f.id,
        friendId: friend.id,
        friendName: friend.name,
        friendEmail: friend.email,
        createdAt: f.createdAt,
      };
    });
  }

  async searchFriends(userId: string, query: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, name: true, email: true } },
        userB: { select: { id: true, name: true, email: true } },
      },
    });

    const lowerQuery = query.toLowerCase();
    return friendships
      .map((f) => {
        const friend = f.userAId === userId ? f.userB : f.userA;
        return {
          friendId: friend.id,
          friendName: friend.name,
          friendEmail: friend.email,
        };
      })
      .filter(
        (f) =>
          f.friendName.toLowerCase().includes(lowerQuery) ||
          f.friendEmail.toLowerCase().includes(lowerQuery)
      );
  }

  async getFriendBalances(userId: string, friendId: string) {
    // Find all groups where both users are members
    const sharedGroups = await prisma.group.findMany({
      where: {
        deletedAt: null,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: friendId } } },
        ],
      },
      include: {
        expenses: {
          where: { deletedAt: null },
          include: { splits: true },
        },
        settlements: {
          where: { status: 'confirmed' },
        },
      },
    });

    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, name: true, email: true },
    });

    if (!friend) throw new Error('Friend not found');

    const groupBreakdown: Array<{
      groupId: string;
      groupName: string;
      currency: string;
      balance: number;
    }> = [];

    for (const group of sharedGroups) {
      // Pairwise balance: positive = friend owes user
      let pairBalance = 0;

      for (const expense of group.expenses) {
        if (expense.paidBy === userId) {
          const friendSplit = expense.splits.find((s) => s.userId === friendId);
          if (friendSplit) pairBalance += Number(friendSplit.amount);
        } else if (expense.paidBy === friendId) {
          const userSplit = expense.splits.find((s) => s.userId === userId);
          if (userSplit) pairBalance -= Number(userSplit.amount);
        }
      }

      for (const settlement of group.settlements) {
        if (settlement.fromUserId === friendId && settlement.toUserId === userId) {
          pairBalance -= Number(settlement.amount);
        } else if (settlement.fromUserId === userId && settlement.toUserId === friendId) {
          pairBalance += Number(settlement.amount);
        }
      }

      if (Math.abs(pairBalance) > 0.01) {
        groupBreakdown.push({
          groupId: group.id,
          groupName: group.name,
          currency: group.currency,
          balance: Math.round(pairBalance * 100) / 100,
        });
      }
    }

    // Aggregate balances by currency
    const currencyMap: Record<string, number> = {};
    for (const g of groupBreakdown) {
      currencyMap[g.currency] = (currencyMap[g.currency] || 0) + g.balance;
    }
    const currencyBalances = Object.entries(currencyMap)
      .map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 }))
      .filter((cb) => Math.abs(cb.amount) > 0.01);

    return {
      friendId: friend.id,
      friendName: friend.name,
      friendEmail: friend.email,
      currencyBalances,
      groupBreakdown,
    };
  }

  async getFriendsWithBalances(userId: string) {
    const friends = await this.getFriends(userId);

    const results = await Promise.all(
      friends.map((f) => this.getFriendBalances(userId, f.friendId))
    );

    return results;
  }

  async settleFriend(
    userId: string,
    friendId: string,
    totalAmount: number,
    note?: string,
    currency?: string
  ) {
    const balanceData = await this.getFriendBalances(userId, friendId);

    // Filter groups by currency if specified
    const relevantGroups = currency
      ? balanceData.groupBreakdown.filter((g) => g.currency === currency)
      : balanceData.groupBreakdown;

    // Calculate net balance for the relevant groups
    const netBalance = relevantGroups.reduce((sum, g) => sum + g.balance, 0);
    const absNetBalance = Math.round(Math.abs(netBalance) * 100) / 100;

    if (absNetBalance < 0.01) {
      throw new Error(
        currency
          ? `No outstanding ${currency} balance with this friend`
          : 'No outstanding balance with this friend'
      );
    }

    if (totalAmount > absNetBalance + 0.01) {
      throw new Error(
        `Settlement amount (${totalAmount}) exceeds net balance (${absNetBalance.toFixed(2)})`
      );
    }

    // Check for pending settlements in any of the relevant groups between these users
    const groupIds = relevantGroups.map(g => g.groupId);
    const pendingSettlements = await prisma.settlement.findMany({
      where: {
        groupId: { in: groupIds },
        status: 'pending',
        OR: [
          { fromUserId: userId, toUserId: friendId },
          { fromUserId: friendId, toUserId: userId },
        ],
      },
    });

    if (pendingSettlements.length > 0) {
      throw new Error(
        'There are pending settlements between you and this friend. Please confirm or delete them before settling via the friend tab.'
      );
    }

    // Proportional settlement across relevant groups (both directions).
    const ratio = totalAmount / absNetBalance;

    const allocations: Array<{
      groupId: string;
      groupName: string;
      fromUserId: string;
      toUserId: string;
      amount: number;
    }> = [];

    for (const group of relevantGroups) {
      const settleAmount = Math.round(Math.abs(group.balance) * ratio * 100) / 100;
      if (settleAmount < 0.01) continue;

      // balance > 0: friend owes user in this group → friend pays user
      // balance < 0: user owes friend in this group → user pays friend
      allocations.push({
        groupId: group.groupId,
        groupName: group.groupName,
        fromUserId: group.balance > 0 ? friendId : userId,
        toUserId: group.balance > 0 ? userId : friendId,
        amount: settleAmount,
      });
    }

    // Create all settlements atomically
    const results = await prisma.$transaction(
      allocations.map((alloc) =>
        prisma.settlement.create({
          data: {
            groupId: alloc.groupId,
            fromUserId: alloc.fromUserId,
            toUserId: alloc.toUserId,
            amount: new Decimal(alloc.amount),
            note: note || 'Cross-group settlement with friend',
            status: 'confirmed',
            recordedBy: userId,
            confirmedAt: new Date(),
          },
        })
      )
    );

    return results.map((settlement, i) => ({
      groupId: settlement.groupId,
      groupName: allocations[i].groupName,
      settlementId: settlement.id,
      amount: Number(settlement.amount),
    }));
  }

  async findOrCreateDirectGroup(userId: string, friendId: string, currency: string) {
    // Look for an existing direct group between these two users
    const existing = await prisma.group.findFirst({
      where: {
        isDirect: true,
        deletedAt: null,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: friendId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (existing) return existing;

    // Create a new direct group
    const group = await prisma.group.create({
      data: {
        name: 'Direct',
        currency,
        createdBy: userId,
        isDirect: true,
        members: {
          createMany: {
            data: [
              { userId, role: 'admin', isGuest: false },
              { userId: friendId, role: 'member', isGuest: false },
            ],
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return group;
  }

  async createDirectExpense(
    userId: string,
    friendId: string,
    data: {
      title: string;
      amount: number;
      paidBy: 'me' | 'friend';
      currency: string;
      category?: string;
      note?: string;
      date?: string;
    }
  ) {
    // Verify friendship exists
    const [userAId, userBId] = this.canonical(userId, friendId);
    const friendship = await prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });

    if (!friendship) {
      throw new Error('You are not friends with this user');
    }

    const group = await this.findOrCreateDirectGroup(userId, friendId, data.currency);

    const payerId = data.paidBy === 'me' ? userId : friendId;
    const splitAmount = data.amount / 2;

    const expense = await expensesService.createExpense(
      {
        groupId: group.id,
        title: data.title,
        amount: data.amount,
        paidBy: payerId,
        splitMethod: 'equal',
        category: data.category,
        note: data.note,
        date: data.date ? new Date(data.date) : undefined,
        splits: [
          { userId, amount: splitAmount },
          { userId: friendId, amount: splitAmount },
        ],
      },
      userId
    );

    return expense;
  }

  async getDirectExpenses(userId: string, friendId: string) {
    const group = await prisma.group.findFirst({
      where: {
        isDirect: true,
        deletedAt: null,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: friendId } } },
        ],
      },
    });

    if (!group) return [];

    return expensesService.getGroupExpenses(group.id, userId);
  }
}
