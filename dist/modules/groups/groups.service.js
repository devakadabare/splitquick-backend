"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsService = void 0;
const database_1 = __importDefault(require("../../config/database"));
class GroupsService {
    async createGroup(name, currency, createdBy) {
        const group = await database_1.default.group.create({
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
    async getGroupById(groupId, userId) {
        const group = await database_1.default.group.findFirst({
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
    async getUserGroups(userId) {
        const groups = await database_1.default.group.findMany({
            where: {
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
    async addMember(groupId, userId, email, requestedBy) {
        // Check if requestor is admin
        const membership = await database_1.default.groupMember.findUnique({
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
        // Check if user exists
        let targetUser = await database_1.default.user.findUnique({
            where: { email }
        });
        const isGuest = !targetUser;
        const targetUserId = targetUser?.id || userId; // Use temporary ID for guest
        // Check if already a member
        const existingMember = await database_1.default.groupMember.findUnique({
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
        const newMember = await database_1.default.groupMember.create({
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
        return newMember;
    }
    async removeMember(groupId, memberUserId, requestedBy) {
        // Check if requestor is admin
        const membership = await database_1.default.groupMember.findUnique({
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
        await database_1.default.groupMember.delete({
            where: {
                groupId_userId: {
                    groupId,
                    userId: memberUserId
                }
            }
        });
        return { message: 'Member removed successfully' };
    }
    async updateMemberRole(groupId, memberUserId, newRole, requestedBy) {
        // Check if requestor is admin
        const membership = await database_1.default.groupMember.findUnique({
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
        const updatedMember = await database_1.default.groupMember.update({
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
    async deleteGroup(groupId, userId) {
        // Check if user is admin
        const membership = await database_1.default.groupMember.findUnique({
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
        // Soft delete
        const group = await database_1.default.group.update({
            where: { id: groupId },
            data: {
                deletedAt: new Date()
            }
        });
        return { message: 'Group deleted successfully' };
    }
}
exports.GroupsService = GroupsService;
