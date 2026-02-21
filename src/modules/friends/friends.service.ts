import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

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

    let netBalance = 0;
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
        netBalance += pairBalance;
      }
    }

    return {
      friendId: friend.id,
      friendName: friend.name,
      friendEmail: friend.email,
      netBalance: Math.round(netBalance * 100) / 100,
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
    note?: string
  ) {
    const balanceData = await this.getFriendBalances(userId, friendId);

    if (Math.abs(balanceData.netBalance) < 0.01) {
      throw new Error('No outstanding balance with this friend');
    }

    if (totalAmount > Math.abs(balanceData.netBalance) + 0.01) {
      throw new Error(
        `Settlement amount (${totalAmount}) exceeds net balance (${Math.abs(balanceData.netBalance).toFixed(2)})`
      );
    }

    // Proportional settlement across ALL groups (both directions).
    // Each group gets its balance reduced by the same ratio, and the
    // settlement direction matches that group's balance direction.
    //
    // Example: Group A user owes friend 5000, Group B friend owes user 1500
    //   net = -3500. Settling 3500 → ratio = 1.0
    //   Group A: settlement user→friend 5000 (zeros it out)
    //   Group B: settlement friend→user 1500 (zeros it out)
    //   Net cash: 5000 - 1500 = 3500 ✓
    const ratio = totalAmount / Math.abs(balanceData.netBalance);

    const allocations: Array<{
      groupId: string;
      groupName: string;
      fromUserId: string;
      toUserId: string;
      amount: number;
    }> = [];

    for (const group of balanceData.groupBreakdown) {
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
}
