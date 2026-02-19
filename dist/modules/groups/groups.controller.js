"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsController = void 0;
const groups_service_1 = require("./groups.service");
const groupsService = new groups_service_1.GroupsService();
class GroupsController {
    async createGroup(req, res) {
        try {
            const { name, currency } = req.body;
            const userId = req.user.id;
            if (!name || !currency) {
                return res.status(400).json({ error: 'Name and currency are required' });
            }
            const group = await groupsService.createGroup(name, currency, userId);
            return res.status(201).json(group);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async getGroup(req, res) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;
            const group = await groupsService.getGroupById(groupId, userId);
            return res.json(group);
        }
        catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }
    async getUserGroups(req, res) {
        try {
            const userId = req.user.id;
            const groups = await groupsService.getUserGroups(userId);
            return res.json(groups);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async addMember(req, res) {
        try {
            const { groupId } = req.params;
            const { email } = req.body;
            const userId = req.user.id;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            const member = await groupsService.addMember(groupId, userId, email, userId);
            return res.status(201).json(member);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async removeMember(req, res) {
        try {
            const { groupId, memberId } = req.params;
            const userId = req.user.id;
            const result = await groupsService.removeMember(groupId, memberId, userId);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async updateMemberRole(req, res) {
        try {
            const { groupId, memberId } = req.params;
            const { role } = req.body;
            const userId = req.user.id;
            if (!role) {
                return res.status(400).json({ error: 'Role is required' });
            }
            const member = await groupsService.updateMemberRole(groupId, memberId, role, userId);
            return res.json(member);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async deleteGroup(req, res) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;
            const result = await groupsService.deleteGroup(groupId, userId);
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}
exports.GroupsController = GroupsController;
