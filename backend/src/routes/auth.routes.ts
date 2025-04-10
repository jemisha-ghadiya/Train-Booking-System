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
  resetPasswordWithOTP
} from '../controllers/user.controller';
import jwt from 'jsonwebtoken';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOTP);

// Auth check route (public)
router.get('/check', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(200).json({ authenticated: false });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.status(200).json({ authenticated: true });
  } catch (error) {
    res.status(200).json({ authenticated: false });
  }
});

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