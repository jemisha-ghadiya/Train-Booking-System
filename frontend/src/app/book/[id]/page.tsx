'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { jwtDecode } from 'jwt-decode';
import { loadStripe } from '@stripe/stripe-js';
import PaymentModal from './components/PaymentModal';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

interface JwtPayload {
  id: number;
  email: string;
}

export default function BookTrain({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [train, setTrain] = useState<Train | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [availableSeats, setAvailableSeats] = useState<Seat[]>([]);
  const [selectedClass, setSelectedClass] = useState<'GENERAL' | 'SLEEPER' | 'AC'>('GENERAL');
  const [clientSecret, setClientSecret] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    passengerName: '',
    passengerAge: '',
    seatNumber: '',
    class: 'GENERAL',
    bookingDate: new Date().toISOString().split('T')[0],
    status: 'confirmed'
  });

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      setUserId(decoded.id);
    }

    const fetchTrain = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/trains/${params.id}`, {
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
  }, [params.id, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
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

      setError('');

      const response = await fetch('http://localhost:3000/api/trains/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          trainId: train?.id,
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

      router.push('/dashboard/bookings');
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

  const handlePayment = async () => {
    try {
      // Validate form data first
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

      setError('');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Calculate amount based on seat class
      const baseFare = train?.fare || 0;
      const fareMultiplier = bookingData.class === 'GENERAL' ? 1 : bookingData.class === 'SLEEPER' ? 1.5 : 2;
      const amount = Math.round(baseFare * fareMultiplier * 100); // Convert to paise

      const response = await fetch(`${baseUrl}/api/trains/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          trainId: params.id,
          seatNumber: bookingData.seatNumber,
          seatClass: bookingData.class
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const { clientSecret, amount: confirmedAmount } = await response.json();
      setClientSecret(clientSecret);
      setSelectedAmount(confirmedAmount / 100); // Convert back to rupees for display
      setShowPaymentModal(true);
    } catch (err: any) {
      setError(err.message || 'Error processing payment');
      console.error('Payment Error:', err);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      await handleSubmit();
      setShowPaymentModal(false);
      router.push('/bookings');
    } catch (err) {
      setError('Error completing booking');
      console.error(err);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setClientSecret('');
  };

  const filteredSeats = availableSeats.filter(seat => seat.class === selectedClass);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!train) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-600">Train not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Train Ticket</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{train.trainName}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Train Number</p>
                <p className="font-medium">{train.trainNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Route</p>
                <p className="font-medium">{train.source} → {train.destination}</p>
              </div>
              <div>
                <p className="text-gray-600">Departure</p>
                <p className="font-medium">{new Date(train.departureTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Arrival</p>
                <p className="font-medium">{new Date(train.arrivalTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Available Seats</p>
                <p className="font-medium">{train.availableSeats}</p>
              </div>
              <div>
                <p className="text-gray-600">Base Fare</p>
                <p className="font-medium">₹{train.fare}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-8">
            <div className="space-y-6">
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {error && bookingData.passengerName.length < 2 && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
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
                  min="1"
                  max="120"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {error && (isNaN(Number(bookingData.passengerAge)) || Number(bookingData.passengerAge) < 1 || Number(bookingData.passengerAge) > 120) && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {selectedClass} Class - ₹{(train.fare * (selectedClass === 'GENERAL' ? 1 : selectedClass === 'SLEEPER' ? 1.5 : 2)).toFixed(2)}
                </h3>
                <div className="grid grid-cols-8 gap-2">
                  {filteredSeats.map((seat) => (
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

              {bookingData.seatNumber && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Selected Seat: {bookingData.seatNumber}</p>
                      <p className="text-sm text-gray-600">Class: {bookingData.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Amount:</p>
                      <p className="font-bold text-lg">₹{selectedAmount}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Final amount</p>
                  <p className="font-bold">₹{selectedAmount}</p>
                </div>
                <button
                  type="button"
                  onClick={handlePayment}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {showPaymentModal && clientSecret && (
          <PaymentModal
            clientSecret={clientSecret}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        )}
      </div>
    </div>
  );
} 