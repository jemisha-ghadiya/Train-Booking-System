import { Router } from 'express';
import { updateProfile } from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth';
import { registerUser,loginUser,verifyAndUpdateProfile,resetPassword ,logoutUser} from '../controllers/user.controller';
const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.use(verifyToken);
router.put('/profile',  updateProfile);
router.post('/profile/verify', verifyAndUpdateProfile);
router.put('/password',  resetPassword);
router.post('/logout', logoutUser);

// Protected routes (require authentication)
// router.put('/profile', verifyToken, updateProfile);

export default router; 