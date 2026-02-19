import { Router } from 'express';
import { GroupsController } from './groups.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const groupsController = new GroupsController();

// All group routes require authentication
router.use(authenticate);

// Group CRUD
router.post('/', (req, res) => groupsController.createGroup(req, res));
router.get('/', (req, res) => groupsController.getUserGroups(req, res));
router.get('/:groupId', (req, res) => groupsController.getGroup(req, res));
router.delete('/:groupId', (req, res) => groupsController.deleteGroup(req, res));

// Member management
router.post('/:groupId/members', (req, res) => groupsController.addMember(req, res));
router.delete('/:groupId/members/:memberId', (req, res) => groupsController.removeMember(req, res));
router.patch('/:groupId/members/:memberId/role', (req, res) => groupsController.updateMemberRole(req, res));

export default router;
