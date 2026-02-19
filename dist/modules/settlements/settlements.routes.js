"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settlements_controller_1 = require("./settlements.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const settlementsController = new settlements_controller_1.SettlementsController();
// All settlement routes require authentication
router.use(auth_1.authenticate);
// Get simplified settlements for a group
router.get('/group/:groupId/simplified', (req, res) => settlementsController.getSimplifiedSettlements(req, res));
// Settlement CRUD
router.post('/', (req, res) => settlementsController.recordSettlement(req, res));
router.get('/group/:groupId', (req, res) => settlementsController.getGroupSettlements(req, res));
router.patch('/:settlementId/confirm', (req, res) => settlementsController.confirmSettlement(req, res));
router.delete('/:settlementId', (req, res) => settlementsController.deleteSettlement(req, res));
exports.default = router;
