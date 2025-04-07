import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { registerUser } from '../controllers/user.controller';
const router = Router();
import { 
    
    logoutUser, 
    updateProfile, 
    verifyAndUpdateProfile, 
    resetPassword 
  } from '../controllers/user.controller';


router.post('/register', registerUser);

// Profile update routes (protected by JWT authentication)

// router.post('/logout', verifyToken, logoutUser);
// router.put('/profile', verifyToken, updateProfile);
// router.post('/profile/verify', verifyToken, verifyAndUpdateProfile);
// router.put('/password', verifyToken, resetPassword);
export default router; 