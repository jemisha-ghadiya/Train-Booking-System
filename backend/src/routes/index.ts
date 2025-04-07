import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import trainRoutes from './train.routes';


const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// User routes (protected)
// router.use('/users', userRoutes);

// Train routes
router.use('/trains', trainRoutes);

export default router; 