import { Router } from 'express';
import { updateProfile, getUserData } from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth';
import { 
  registerUser,
  loginUser,
  verifyAndUpdateProfile,
  resetPassword,
  logoutUser,
  forgotPassword,
  resetPasswordWithOTP,
  checkAuth
} from '../controllers/user.controller';
import jwt from 'jsonwebtoken';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOTP);
router.get('/check-auth', checkAuth);


// Protected routes
router.use(verifyToken);
router.put('/profile', updateProfile);
router.post('/profile/verify', verifyAndUpdateProfile);
router.put('/password',  resetPassword);
router.post('/logout', logoutUser);
router.get('/user', getUserData);

// Protected routes (require authentication)
// router.put('/profile', verifyToken, updateProfile);

export default router; 