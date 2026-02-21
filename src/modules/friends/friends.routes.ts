import { Router } from 'express';
import { FriendsController } from './friends.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const friendsController = new FriendsController();

// All friend routes require authentication
router.use(authenticate);

// Get all friends
router.get('/', (req, res) => friendsController.getFriends(req, res));

// Search friends (for autocomplete)
router.get('/search', (req, res) => friendsController.searchFriends(req, res));

// Get friends with cross-group balances
router.get('/balances', (req, res) => friendsController.getFriendsWithBalances(req, res));

// Settle with a friend across groups
router.post('/:friendId/settle', (req, res) => friendsController.settleFriend(req, res));

export default router;
