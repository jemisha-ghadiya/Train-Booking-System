import { Router } from 'express';
import { createTrain ,getTrainById,deleteTrain,updateTrain,createPaymentIntent} from '../controllers/train.controller';
import { verifyToken } from '../middleware/auth';
import {
  getAllTrains,
  searchTrains,
  createBooking,
  getUserBookings,
  cancelBooking
} from '../controllers/train.controller';

const router = Router();

// Public routes
router.get('/', getAllTrains);
router.get('/search', searchTrains);
router.get('/:id', getTrainById);

// Protected routes (require authentication)
router.use(verifyToken); // Apply verifyToken middleware to all routes below
router.post('/create-payment-intent', createPaymentIntent);
router.post('/bookings', createBooking);
router.get('/user/bookings', getUserBookings);
router.put('/bookings/:bookingId/cancel', cancelBooking);

// Admin routes (require admin authentication)
router.post('/', createTrain);
router.put('/:id', updateTrain);
router.delete('/:id', deleteTrain);

export default router; 