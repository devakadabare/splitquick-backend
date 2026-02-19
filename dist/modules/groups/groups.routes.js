"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groups_controller_1 = require("./groups.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const groupsController = new groups_controller_1.GroupsController();
// All group routes require authentication
router.use(auth_1.authenticate);
// Group CRUD
router.post('/', (req, res) => groupsController.createGroup(req, res));
router.get('/', (req, res) => groupsController.getUserGroups(req, res));
router.get('/:groupId', (req, res) => groupsController.getGroup(req, res));
router.delete('/:groupId', (req, res) => groupsController.deleteGroup(req, res));
// Member management
router.post('/:groupId/members', (req, res) => groupsController.addMember(req, res));
router.delete('/:groupId/members/:memberId', (req, res) => groupsController.removeMember(req, res));
router.patch('/:groupId/members/:memberId/role', (req, res) => groupsController.updateMemberRole(req, res));
exports.default = router;
