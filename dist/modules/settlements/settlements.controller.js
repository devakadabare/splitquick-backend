"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementsController = void 0;
const settlements_service_1 = require("./settlements.service");
const settlementsService = new settlements_service_1.SettlementsService();
class SettlementsController {
    async getSimplifiedSettlements(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const result = await settlementsService.getSimplifiedSettlements(groupId, userId);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async recordSettlement(req, res) {
        try {
            const userId = req.user.id;
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
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async confirmSettlement(req, res) {
        try {
            const userId = req.user.id;
            const { settlementId } = req.params;
            const settlement = await settlementsService.confirmSettlement(settlementId, userId);
            return res.json(settlement);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async getGroupSettlements(req, res) {
        try {
            const userId = req.user.id;
            const { groupId } = req.params;
            const settlements = await settlementsService.getGroupSettlements(groupId, userId);
            return res.json(settlements);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async deleteSettlement(req, res) {
        try {
            const userId = req.user.id;
            const { settlementId } = req.params;
            const result = await settlementsService.deleteSettlement(settlementId, userId);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.SettlementsController = SettlementsController;
