import { Router } from 'express';
import { SettlementsController } from './settlements.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const settlementsController = new SettlementsController();

// All settlement routes require authentication
router.use(authenticate);

// Get simplified settlements for a group
router.get('/group/:groupId/simplified', (req, res) =>
  settlementsController.getSimplifiedSettlements(req, res)
);

// Settlement CRUD
router.post('/', (req, res) => settlementsController.recordSettlement(req, res));
router.get('/group/:groupId', (req, res) => settlementsController.getGroupSettlements(req, res));
router.patch('/:settlementId/confirm', (req, res) => settlementsController.confirmSettlement(req, res));
router.delete('/:settlementId', (req, res) => settlementsController.deleteSettlement(req, res));

export default router;
