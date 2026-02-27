"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const library_1 = require("@prisma/client/runtime/library");
class ExpensesService {
    async createExpense(data, createdBy) {
        const { groupId, title, amount, paidBy, splitMethod, category, note, date, splits } = data;
        // Verify user is member of group
        const membership = await database_1.default.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: createdBy
                }
            }
        });
        if (!membership) {
            throw new Error('User is not a member of this group');
        }
        // Validate splits
        if (splitMethod === 'equal') {
            const splitAmount = amount / splits.length;
            splits.forEach(split => {
                split.amount = splitAmount;
                split.percentage = (1 / splits.length) * 100;
            });
        }
        else if (splitMethod === 'percentage') {
            const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                throw new Error('Split percentages must sum to 100');
            }
            splits.forEach(split => {
                split.amount = (amount * (split.percentage || 0)) / 100;
            });
        }
        else if (splitMethod === 'custom') {
            const totalAmount = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
            if (Math.abs(totalAmount - amount) > 0.01) {
                throw new Error('Split amounts must sum to total amount');
            }
            splits.forEach(split => {
                split.percentage = ((split.amount || 0) / amount) * 100;
            });
        }
        // Create expense with splits
        const expense = await database_1.default.expense.create({
            data: {
                groupId,
                title: title || 'Expense',
                amount: new library_1.Decimal(amount),
                paidBy,
                splitMethod,
                category,
                note,
                date: date || new Date(),
                splits: {
                    create: splits.map(split => ({
                        userId: split.userId,
                        amount: new library_1.Decimal(split.amount),
                        percentage: split.percentage ? new library_1.Decimal(split.percentage) : null
                    }))
                }
            },
            include: {
                payer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                splits: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });
        return expense;
    }
    async getGroupExpenses(groupId, userId, limit = 50, offset = 0) {
        // Verify user is member
        const membership = await database_1.default.groupMember.findUnique({
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
        const expenses = await database_1.default.expense.findMany({
            where: {
                groupId,
                deletedAt: null
            },
            include: {
                payer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                splits: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            },
            orderBy: {
                date: 'desc'
            },
            take: limit,
            skip: offset
        });
        return expenses;
    }
    async getExpenseById(expenseId, userId) {
        const expense = await database_1.default.expense.findUnique({
            where: { id: expenseId },
            include: {
                payer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                splits: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                group: {
                    include: {
                        members: true
                    }
                }
            }
        });
        if (!expense || expense.deletedAt) {
            throw new Error('Expense not found');
        }
        // Verify user is member
        const isMember = expense.group.members.some(m => m.userId === userId);
        if (!isMember) {
            throw new Error('Access denied');
        }
        return expense;
    }
    async updateExpense(expenseId, data, userId) {
        const expense = await this.getExpenseById(expenseId, userId);
        // Update expense
        const updatedExpense = await database_1.default.expense.update({
            where: { id: expenseId },
            data: {
                title: data.title,
                amount: data.amount ? new library_1.Decimal(data.amount) : undefined,
                category: data.category,
                note: data.note,
                date: data.date
            },
            include: {
                payer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                splits: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });
        return updatedExpense;
    }
    async deleteExpense(expenseId, userId) {
        const expense = await this.getExpenseById(expenseId, userId);
        // Only the expense creator or a group admin can delete
        const isExpenseCreator = expense.paidBy === userId;
        const membership = expense.group.members.find(m => m.userId === userId);
        const isGroupAdmin = membership?.role === 'admin';
        if (!isExpenseCreator && !isGroupAdmin) {
            throw new Error('Only the expense creator or group admin can delete this expense');
        }
        // Soft delete
        await database_1.default.expense.update({
            where: { id: expenseId },
            data: {
                deletedAt: new Date()
            }
        });
        return { message: 'Expense deleted successfully' };
    }
    async calculateBalances(groupId, userId) {
        // Verify user is member and get group currency
        const membership = await database_1.default.groupMember.findUnique({
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
        const group = await database_1.default.group.findUnique({
            where: { id: groupId },
            select: { currency: true }
        });
        // Get all expenses and settlements
        const expenses = await database_1.default.expense.findMany({
            where: {
                groupId,
                deletedAt: null
            },
            include: {
                splits: true
            }
        });
        const settlements = await database_1.default.settlement.findMany({
            where: {
                groupId,
                status: 'confirmed'
            }
        });
        // Get all group members
        const members = await database_1.default.groupMember.findMany({
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
        // Calculate balances for each member
        const balances = {};
        members.forEach(member => {
            balances[member.userId] = 0;
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
        // Apply settlements
        settlements.forEach(settlement => {
            balances[settlement.fromUserId] += Number(settlement.amount);
            balances[settlement.toUserId] -= Number(settlement.amount);
        });
        // Format response
        const formattedBalances = members.map(member => ({
            userId: member.userId,
            name: member.user?.name || member.guestEmail || 'Guest',
            email: member.user?.email || member.guestEmail,
            balance: balances[member.userId],
            status: balances[member.userId] > 0 ? 'owed' : balances[member.userId] < 0 ? 'owes' : 'settled'
        }));
        return {
            groupId,
            currency: group?.currency || 'USD',
            balances: formattedBalances,
            totalExpenses: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
            expenseCount: expenses.length
        };
    }
}
exports.ExpensesService = ExpensesService;
