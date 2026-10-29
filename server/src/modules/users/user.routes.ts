import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/addresses', UserController.getAddresses);
router.post('/addresses', UserController.addAddress);
router.delete('/addresses/:id', UserController.deleteAddress);

export default router;
