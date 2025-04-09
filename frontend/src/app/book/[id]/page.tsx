'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

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

export default function BookTrain({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [train, setTrain] = useState<Train | null>(null);
  const [formData, setFormData] = useState({
    passengerName: '',
    passengerAge: '',
    seatNumber: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchTrain = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/trains/${params.id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch train details');
        }

        const data = await response.json();
        setTrain(data);
      } catch (error) {
        console.error('Error fetching train:', error);
        setErrors({ fetch: 'Failed to load train details' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrain();
  }, [params.id]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.passengerName.trim()) {
      newErrors.passengerName = 'Passenger name is required';
    }

    if (!formData.passengerAge) {
      newErrors.passengerAge = 'Passenger age is required';
    } else if (isNaN(Number(formData.passengerAge)) || Number(formData.passengerAge) < 1 || Number(formData.passengerAge) > 100) {
      newErrors.passengerAge = 'Please enter a valid age between 1 and 100';
    }

    if (!formData.seatNumber) {
      newErrors.seatNumber = 'Seat number is required';
    } else if (isNaN(Number(formData.seatNumber)) || Number(formData.seatNumber) < 1 || Number(formData.seatNumber) > (train?.totalSeats || 0)) {
      newErrors.seatNumber = `Please enter a valid seat number between 1 and ${train?.totalSeats}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3000/api/trains/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          trainId: train?.id,
          passengerName: formData.passengerName,
          passengerAge: Number(formData.passengerAge),
          seatNumber: Number(formData.seatNumber),
          status: 'confirmed'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      setSuccessMessage('Booking created successfully!');
      // Clear form
      setFormData({
        passengerName: '',
        passengerAge: '',
        seatNumber: '',
      });

      // Redirect to bookings page after 2 seconds
      setTimeout(() => {
        router.push('/bookings');
      }, 2000);
    } catch (error: any) {
      setErrors({
        submit: error.message || 'Failed to create booking'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (isLoading) {
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

  if (errors.fetch) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{errors.fetch}</p>
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

          {/* Train Details */}
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
                <p className="text-gray-600">Fare</p>
                <p className="font-medium">₹{train.fare}</p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          {successMessage ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-600">{successMessage}</p>
            </div>
          ) : (
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
                    value={formData.passengerName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.passengerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.passengerName}</p>
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
                    value={formData.passengerAge}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.passengerAge && (
                    <p className="mt-1 text-sm text-red-600">{errors.passengerAge}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="seatNumber" className="block text-sm font-medium text-gray-700">
                    Seat Number
                  </label>
                  <input
                    type="number"
                    id="seatNumber"
                    name="seatNumber"
                    value={formData.seatNumber}
                    onChange={handleChange}
                    min="1"
                    max={train.totalSeats}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.seatNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.seatNumber}</p>
                  )}
                </div>

                {errors.submit && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 