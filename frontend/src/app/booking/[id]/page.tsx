'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { loadStripe } from '@stripe/stripe-js';
import PaymentModal from './components/paymentModal';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface JwtPayload {
  id: number;
  email: string;
}

interface Train {
  id: number;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  fare: number;
}

interface Seat {
  number: string;
  isAvailable: boolean;
  class: 'GENERAL' | 'SLEEPER' | 'AC';
  fare: number;
}

interface BookingResponse {
  id: number;
  trainId: number;
  userId: number;
  passengerName: string;
  passengerAge: number;
  seatNumber: string;
  class: string;
  bookingDate: string;
  status: string;
}

export default function BookingPage() {
  const params = useParams();
  const trainId = params.id;
  const router = useRouter();
  const [train, setTrain] = useState<Train | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [bookingData, setBookingData] = useState({
    passengerName: '',
    passengerAge: '',
    seatNumber: '',
    class: 'GENERAL',
    bookingDate: new Date().toISOString().split('T')[0],
    status: 'confirmed'
  });

  const [selectedAmount, setSelectedAmount] = useState(0);
  const [availableSeats, setAvailableSeats] = useState<Seat[]>([]);
  const [clientSecret, setClientSecret] = useState('');
  const [selectedClass, setSelectedClass] = useState<'GENERAL' | 'SLEEPER' | 'AC'>('GENERAL');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Define the state or replace it with the correct variable
  const address = 'Your Address Here'; // Replace with actual address logic

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      setUserId(decoded.id);
    }

    const fetchTrain = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/trains/${trainId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch train details');
        }
        const data = await response.json();
        setTrain(data);
        
        // Generate seats with class-wise distribution and fares
        const seats: Seat[] = [];
        // Generate GENERAL seats (1-8)
        for (let i = 1; i <= 8; i++) {
          seats.push({
            number: `G${i}`,
            isAvailable: true,
            class: 'GENERAL',
            fare: data.fare
          });
        }
        // Generate SLEEPER seats (1-6)
        for (let i = 1; i <= 6; i++) {
          seats.push({
            number: `S${i}`,
            isAvailable: true,
            class: 'SLEEPER',
            fare: data.fare * 1.5
          });
        }
        // Generate AC seats (1-6)
        for (let i = 1; i <= 6; i++) {
          seats.push({
            number: `A${i}`,
            isAvailable: true,
            class: 'AC',
            fare: data.fare * 2
          });
        }
        setAvailableSeats(seats);
      } catch (err) {
        setError('Error loading train details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrain();
  }, [trainId, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      // Validate passenger details
      if (!bookingData.passengerName || bookingData.passengerName.length < 2) {
        setError('Passenger name must be at least 2 characters long.');
        return;
      }
      if (!bookingData.passengerAge || isNaN(Number(bookingData.passengerAge)) || Number(bookingData.passengerAge) < 1 || Number(bookingData.passengerAge) > 120) {
        setError('Passenger age must be a number between 1 and 120.');
        return;
      }
      if (!bookingData.seatNumber) {
        setError('Please select a seat.');
        return;
      }

      // Clear any previous error
      setError('');

      const response = await fetch('http://localhost:3000/api/trains/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          trainId: trainId,
          userId: userId, // Use the user ID from the token
          passengerName: bookingData.passengerName,
          passengerAge: parseInt(bookingData.passengerAge),
          seatNumber: bookingData.seatNumber,
          class: bookingData.class,
          bookingDate: bookingData.bookingDate,
          status: bookingData.status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const data = await response.json();
      alert('Booking created successfully!');
      // Redirect to a confirmation page or show success message
    //   router.push(`/booking/confirmation/${data.booking.id}`);
    } catch (err) {
      setError('Error creating booking');
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSeatSelect = (seat: Seat) => {
    setBookingData(prev => ({
      ...prev,
      seatNumber: seat.number,
      class: seat.class
    }));
    setSelectedAmount(seat.fare);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value as 'GENERAL' | 'SLEEPER' | 'AC');
  };

  const filteredSeats = availableSeats.filter((seat: Seat) => seat.class === selectedClass);

  // Update the handlePayment function
  const handlePayment = async () => {
    try {
      // Validate passenger details first
      if (!bookingData.passengerName || bookingData.passengerName.length < 2) {
        setError('Passenger name must be at least 2 characters long.');
        return;
      }
      if (!bookingData.passengerAge || isNaN(Number(bookingData.passengerAge)) || Number(bookingData.passengerAge) < 1 || Number(bookingData.passengerAge) > 120) {
        setError('Passenger age must be a number between 1 and 120.');
        return;
      }
      if (!bookingData.seatNumber) {
        setError('Please select a seat.');
        return;
      }

      // Clear any previous error
      setError('');

      // Create a payment intent on the server
      const response = await fetch('http://localhost:3000/api/trains/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: selectedAmount * 100, // Convert to smallest currency unit (paise)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
      setShowPaymentModal(true); // Show the payment modal
    } catch (err: any) {
      setError(err.message || 'Error processing payment');
      console.error('Payment error:', err);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // First create the booking
      const response = await fetch('http://localhost:3000/api/trains/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          trainId: trainId,
          userId: userId,
          passengerName: bookingData.passengerName,
          passengerAge: parseInt(bookingData.passengerAge),
          seatNumber: bookingData.seatNumber,
          class: bookingData.class,
          bookingDate: bookingData.bookingDate,
          status: bookingData.status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const createdBooking: BookingResponse = await response.json();
      
      // Close the payment modal
      setShowPaymentModal(false);
      
      // Show success message
      alert('Booking created successfully!');
      
      // Redirect to the bookings page with a small delay to ensure the booking is saved
      setTimeout(() => {
        router.push('/dashboard/bookings');
      }, 1000);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking after payment');
      setShowPaymentModal(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setClientSecret('');
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
  if (!train) return <div className="text-center p-8">Train not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Train Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Train Name:</p>
            <p>{train.trainName}</p>
          </div>
          <div>
            <p className="font-semibold">Train Number:</p>
            <p>{train.trainNumber}</p>
          </div>
          <div>
            <p className="font-semibold">From:</p>
            <p>{train.source}</p>
          </div>
          <div>
            <p className="font-semibold">To:</p>
            <p>{train.destination}</p>
          </div>
          <div>
            <p className="font-semibold">Departure:</p>
            <p>{new Date(train.departureTime).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">Arrival:</p>
            <p>{new Date(train.arrivalTime).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">Available Seats:</p>
            <p>{train.availableSeats}</p>
          </div>
          <div>
            <p className="font-semibold">Fare:</p>
            <p>${train.fare}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Passenger Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="passengerName" className="block text-sm font-medium text-gray-700">
              Passenger Name
            </label>
            <input
              type="text"
              id="passengerName"
              name="passengerName"
              value={bookingData.passengerName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {error && bookingData.passengerName.length < 2 && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div>
            <label htmlFor="passengerAge" className="block text-sm font-medium text-gray-700">
              Passenger Age
            </label>
            <input
              type="number"
              id="passengerAge"
              name="passengerAge"
              value={bookingData.passengerAge}
              onChange={handleChange}
              required
              min="1"
              max="120"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {error && (isNaN(Number(bookingData.passengerAge)) || Number(bookingData.passengerAge) < 1 || Number(bookingData.passengerAge) > 120) && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div>
            <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700">
              Booking Date
            </label>
            <input
              type="date"
              id="bookingDate"
              name="bookingDate"
              value={bookingData.bookingDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="classSelection" className="block text-sm font-medium text-gray-700">
              Select Class
            </label>
            <select
              id="classSelection"
              value={selectedClass}
              onChange={handleClassChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="GENERAL">General</option>
              <option value="SLEEPER">Sleeper</option>
              <option value="AC">AC</option>
            </select>
          </div>

          {/* Seat Selection Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-2">{selectedClass} Class - ₹{(train.fare * (selectedClass === 'GENERAL' ? 1 : selectedClass === 'SLEEPER' ? 1.5 : 2)).toFixed(2)}</h3>
            <div className="grid grid-cols-8 gap-2">
              {filteredSeats.map((seat: Seat) => (
                <button
                  key={seat.number}
                  type="button"
                  onClick={() => handleSeatSelect(seat)}
                  className={`p-2 rounded-md text-center ${
                    bookingData.seatNumber === seat.number
                      ? 'bg-blue-600 text-white'
                      : seat.isAvailable
                      ? 'bg-green-100 hover:bg-green-200'
                      : 'bg-gray-200 cursor-not-allowed'
                  }`}
                  disabled={!seat.isAvailable}
                >
                  {seat.number}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Seat and Amount Display */}
          {bookingData.seatNumber && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Selected Seat: {bookingData.seatNumber}</p>
                  <p className="text-sm text-gray-600">Class: {bookingData.class}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Amount:</p>
                  <p className="font-bold text-lg">₹ {selectedAmount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={bookingData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Updated Buttons Section */}
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Final amount will be calculated at payment</p>
              <p className="font-bold">Amount: ₹ {selectedAmount}</p>
            </div>
            <div className="space-x-4">
              <button
                type="button"
                onClick={handlePayment}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                CONFIRM TICKET
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Update the PaymentModal rendering */}
      {showPaymentModal && clientSecret && (
        <PaymentModal 
          clientSecret={clientSecret} 
          address={address}
          onSuccess={handlePaymentSuccess}
          onClose={handleClosePaymentModal}
        />
      )}
    </div>
  );
} 