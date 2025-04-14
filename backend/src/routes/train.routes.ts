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
router.post('/create-payment-intent', createPaymentIntent);
// Public routes
router.get('/', getAllTrains);
router.post('/search', searchTrains);
router.get('/:id', getTrainById);

// Protected routes
router.use(verifyToken);
router.post('/trains_create', createTrain);

// Route to get a specific train by ID
router.get('/trains/:id', getTrainById);

// Route to update a train by ID
router.put('/trains/:id', updateTrain);

// Route to delete a train by ID
router.delete('/trains/:id',verifyToken, deleteTrain);


// Protected routes (require authentication)
router.post('/bookings', createBooking);
router.get('/user/bookings',  getUserBookings);
router.put('/bookings/:bookingId/cancel',  cancelBooking);

export default router; 