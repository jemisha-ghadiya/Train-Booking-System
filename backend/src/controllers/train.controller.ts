import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Train from '../models/train.model';
import Booking from '../models/booking.model';
import { verifyToken } from '../middleware/auth';
import User from '../models/user.model';
import Stripe from 'stripe';
import { sendBookingConfirmationEmail } from '../utils/emailUtils';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// Initialize Stripe with your secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-03-31.basil',
});
// Get all available trains
// export const getAllTrains = async (req: Request, res: Response) => {
//   try {
//     const trains = await Train.findAll();
//     res.status(200).json(trains);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching trains', error });
//   }
// };

// Search trains by source, destination, and departure date
export const searchTrains = async (req: Request, res: Response) => {
  try {
    const { source, destination, departureDate } = req.body;

    // Validate required parameters
    if (!source || !destination || !departureDate) {
      return res.status(400).json({
        message: 'Missing required search parameters',
        required: {
          source: 'Source station is required',
          destination: 'Destination station is required',
          departureDate: 'Departure date is required'
        },
        provided: {
          source: source || 'Not provided',
          destination: destination || 'Not provided',
          departureDate: departureDate || 'Not provided'
        }
      });
    }

    // Validate date format
    const parsedDate = new Date(departureDate as string);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid date format',
        error: 'Please provide a valid date in YYYY-MM-DD format',
        providedDate: departureDate
      });
    }

    // Set the date range for the search
    const startDate = new Date(parsedDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(parsedDate);
    endDate.setHours(23, 59, 59, 999);

    // Build the where clause for the search
    const whereClause = {
      source: source.toString().trim(),
      destination: destination.toString().trim(),
      departureTime: {
        [Op.between]: [startDate, endDate]
      }
    };

    console.log('Search parameters:', whereClause); // Debug log

    // Find trains matching the search criteria
    const trains = await Train.findAll({
      where: whereClause,
      order: [['departureTime', 'ASC']]
    });

    console.log('Found trains:', trains.length); // Debug log

    if (trains.length === 0) {
      return res.status(404).json({
        message: 'No trains found matching the search criteria',
        searchParams: {
          source: source.toString().trim(),
          destination: destination.toString().trim(),
          departureDate: departureDate.toString().trim()
        },
        suggestion: 'Try adjusting your search parameters or check for alternative dates'
      });
    }

    return res.status(200).json({
      message: 'Trains found successfully',
      count: trains.length,
      searchParams: {
        source: source.toString().trim(),
        destination: destination.toString().trim(),
        departureDate: departureDate.toString().trim()
      },
      trains: trains.map(train => ({
        id: train.id,
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        source: train.source,
        destination: train.destination,
        departureTime: train.departureTime,
        arrivalTime: train.arrivalTime,
        totalSeats: train.totalSeats,
        availableSeats: train.availableSeats,
        fare: train.fare
      }))
    });
  } catch (error) {
    console.error('Error searching trains:', error);
    return res.status(500).json({
      message: 'Error searching trains',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};




// Book a train ticket
// export const createBooking = async (req: Request, res: Response) => {
//   const {
//     trainId,
//     userId,
//     passengerName,
//     passengerAge,
//     seatNumber,
//     class: bookingClass,
//     status
//   } = req.body;

//   try {
//     // Check if the train exists
//     const train = await Train.findByPk(trainId);
//     if (!train) {
//       return res.status(404).json({ message: 'Train not found' });
//     }

//     // Check if the user exists
//     const user = await User.findByPk(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Validate status
//     if (status !== 'confirmed' && status !== 'cancelled') {
//       return res.status(400).json({
//         message: 'Invalid status. It must be either "confirmed" or "cancelled".'
//       });
//     }

//     // Optionally validate class (e.g., restrict to specific values)
//     const allowedClasses = ['Economy', 'Business', 'Sleeper', 'AC First Class'];
//     if (!allowedClasses.includes(bookingClass)) {
//       return res.status(400).json({
//         message: `Invalid class. Allowed values: ${allowedClasses.join(', ')}.`
//       });
//     }

//     // Create the booking
//     const newBooking = await Booking.create({
//       trainId,
//       userId,
//       passengerName,
//       passengerAge,
//       seatNumber,
//       class: bookingClass,
//       status
//     });

//     return res.status(201).json({
//       message: 'Booking created successfully',
//       booking: newBooking
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Error creating booking', error });
//   }
// };

export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  const {
    trainId,
    passengerName,
    passengerAge,
    seatNumber,
    class: bookingClass,
    status
  } = req.body;

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const train = await Train.findByPk(trainId);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (status !== 'confirmed' && status !== 'cancelled') {
      return res.status(400).json({
        message: 'Invalid status. It must be either "confirmed" or "cancelled".'
      });
    }

    const allowedClasses = ['GENERAL', 'SLEEPER', 'AC'];
    if (!allowedClasses.includes(bookingClass)) {
      return res.status(400).json({
        message: `Invalid class. Allowed values: ${allowedClasses.join(', ')}.`
      });
    }

    // Create booking
    const booking = await Booking.create({
      trainId,
      userId,
      passengerName,
      passengerAge,
      seatNumber,
      class: bookingClass,
      status,
      bookingDate: new Date() // Ensure this field is available in your model
    });

    // Send confirmation email (only if status is confirmed)
    if (status === 'confirmed') {
      await sendBookingConfirmationEmail(user.email, booking, train);
    }

    return res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    console.error('Booking creation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's bookings
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user || typeof user.id !== 'number') {
      return res.status(400).json({ message: 'Invalid or missing user ID' });
    }

    const bookings = await Booking.findAll({
      where: { userId: user.id },
      include: [
        {
          model: Train,
          as: 'Train',
        },
      ],
    });

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error('Error retrieving user bookings:', error);
    return res.status(500).json({
      message: 'Error retrieving user bookings',
      error,
    });
  }
};

// Cancel a booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const booking = await Booking.findOne({
      where: { id: bookingId, userId }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.update({ status: 'cancelled' });
    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error });
  }
};

// export const cancelBooking = async (req: Request, res: Response) => {
//   try {
//     const { bookingId } = req.params;
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json({ message: 'User not authenticated' });
//     }

//     const booking = await Booking.findOne({ where: { id: bookingId, userId } });

//     if (!booking) {
//       return res.status(404).json({ message: 'Booking not found' });
//     }

//     const train = await Train.findByPk(booking.trainId);

//     if (!train) {
//       return res.status(404).json({ message: 'Associated train not found' });
//     }

//     const departureTime = new Date(train.departureTime);
//     const now = new Date();

//     const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

//     if (hoursUntilDeparture < 24) {
//       return res.status(400).json({ message: 'Cannot delete booking less than 24 hours before departure' });
//     }

//     await booking.destroy();

//     return res.status(200).json({ message: 'Booking deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting booking:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };

export const createTrain = async (req: Request, res: Response) => {
  try {
    const { trainNumber, trainName, source, destination, departureTime, arrivalTime, totalSeats, availableSeats, fare } = req.body;

    // Create the new train record
    const newTrain = await Train.create({
      trainNumber,
      trainName,  // Updated from 'name' to 'trainName'
      source,
      destination,
      departureTime,
      arrivalTime,
      totalSeats,
      availableSeats,
      fare,
    });

    return res.status(201).json({ message: 'Train created successfully', train: newTrain });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating train', error });
  }
};
// Get all trains
export const getAllTrains = async (req: Request, res: Response) => {
  try {
    const trains = await Train.findAll();
    return res.status(200).json(trains);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error retrieving trains', error });
  }
};

// Get a specific train by its ID
export const getTrainById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const train = await Train.findByPk(id);
    if (train) {
      return res.status(200).json(train);
    } else {
      return res.status(404).json({ message: 'Train not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error retrieving train', error });
  }
};

// Update a train's details
export const updateTrain = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { trainNumber, name, source, destination, departureTime, arrivalTime, totalSeats, availableSeats, fare } = req.body;

  try {
    const train = await Train.findByPk(id);
    if (train) {
      train.trainNumber = trainNumber || train.trainNumber;
      train.trainName = name || train.trainName;
      train.source = source || train.source;
      train.destination = destination || train.destination;
      train.departureTime = departureTime || train.departureTime;
      train.arrivalTime = arrivalTime || train.arrivalTime;
      train.totalSeats = totalSeats || train.totalSeats;
      train.availableSeats = availableSeats || train.availableSeats;
      train.fare = fare || train.fare;

      await train.save();
      return res.status(200).json({ message: 'Train updated successfully', train });
    } else {
      return res.status(404).json({ message: 'Train not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating train', error });
  }
};

// Delete a train
export const deleteTrain = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const train = await Train.findByPk(id);
    if (train) {
      await train.destroy();
      return res.status(200).json({ message: 'Train deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Train not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error deleting train', error });
  }
};

// Create a payment intent
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, bookingId } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        message: 'Invalid amount. Please provide a valid positive number.',
      });
    }

    // Convert to smallest currency unit (paise)
    const amountInPaise = Math.round(amount);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId: bookingId || 'pending',
        userId: req.user?.id || 'unknown'
      }
    });

    // Return the client secret to the frontend
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      message: 'PaymentIntent created successfully',
      paymentIntentId: paymentIntent.id
    });

  } catch (error: any) {
    console.error('Stripe error:', error.message);
    res.status(500).json({
      message: 'Failed to create PaymentIntent',
      error: error.message,
    });
  }
};