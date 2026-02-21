import prisma from '../../config/database';
import { FriendsService } from '../friends/friends.service';

const friendsService = new FriendsService();

export class GroupsService {
  async createGroup(name: string, currency: string, createdBy: string) {
    const group = await prisma.group.create({
      data: {
        name,
        currency,
        createdBy,
        members: {
          create: {
            userId: createdBy,
            role: 'admin',
            isGuest: false
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return group;
  }

  async getGroupById(groupId: string, userId: string) {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        deletedAt: null,
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      throw new Error('Group not found or access denied');
    }

    return group;
  }

  async getUserGroups(userId: string) {
    const groups = await prisma.group.findMany({
      where: {
        deletedAt: null,
        isDirect: false,
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            expenses: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return groups;
  }

  async addMember(groupId: string, userId: string, email: string, requestedBy: string) {
    // Check if requestor is admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: requestedBy
        }
      }
    });

    if (!membership || membership.role !== 'admin') {
      throw new Error('Only admins can add members');
    }

    // Check if user exists, or create a guest user
    let targetUser = await prisma.user.findUnique({
      where: { email }
    });

    const isGuest = !targetUser;

    if (!targetUser) {
      // Create a guest user placeholder
      targetUser = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          isGuest: true,
        }
      });
    }

    const targetUserId = targetUser.id;

    // Check if already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId
        }
      }
    });

    if (existingMember) {
      throw new Error('User is already a member');
    }

    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUserId,
        role: 'member',
        isGuest,
        guestEmail: isGuest ? email : null
      },
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

    // Auto-add friendship between the requestor and the new member
    await friendsService.addFriend(requestedBy, targetUserId);

    return newMember;
  }

  async removeMember(groupId: string, memberUserId: string, requestedBy: string) {
    // Check if requestor is admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: requestedBy
        }
      }
    });

    if (!membership || membership.role !== 'admin') {
      throw new Error('Only admins can remove members');
    }

    // Cannot remove self if admin (need to transfer ownership first)
    if (memberUserId === requestedBy) {
      throw new Error('Admins cannot remove themselves');
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: memberUserId
        }
      }
    });

    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(groupId: string, memberUserId: string, newRole: string, requestedBy: string) {
    // Check if requestor is admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: requestedBy
        }
      }
    });

    if (!membership || membership.role !== 'admin') {
      throw new Error('Only admins can update roles');
    }

    const updatedMember = await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId: memberUserId
        }
      },
      data: {
        role: newRole
      },
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

    return updatedMember;
  }

  async deleteGroup(groupId: string, userId: string) {
    // Check if user is admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId
        }
      }
    });

    if (!membership || membership.role !== 'admin') {
      throw new Error('Only admins can delete groups');
    }

    // Check for outstanding balances
    const expenses = await prisma.expense.findMany({
      where: { groupId, deletedAt: null },
      include: { splits: true }
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId, status: 'confirmed' }
    });

    const members = await prisma.groupMember.findMany({
      where: { groupId }
    });

    const balances: Record<string, number> = {};
    members.forEach(m => { balances[m.userId] = 0; });

    expenses.forEach(expense => {
      balances[expense.paidBy] += Number(expense.amount);
      expense.splits.forEach(split => {
        balances[split.userId] -= Number(split.amount);
      });
    });

    settlements.forEach(settlement => {
      balances[settlement.fromUserId] += Number(settlement.amount);
      balances[settlement.toUserId] -= Number(settlement.amount);
    });

    const hasOutstandingBalances = Object.values(balances).some(b => Math.abs(b) > 0.01);

    if (hasOutstandingBalances) {
      throw new Error('Cannot delete group with outstanding balances. Please settle all debts first.');
    }

    // Soft delete
    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        deletedAt: new Date()
      }
    });

    return { message: 'Group deleted successfully' };
  }
}
