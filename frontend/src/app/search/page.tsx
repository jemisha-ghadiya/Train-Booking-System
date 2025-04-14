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

export default function SearchResults() {
  const router = useRouter();
  const [trains, setTrains] = useState<Train[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrains = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/trains', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trains');
        }

        const data = await response.json();
        setTrains(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrains();
  }, []);

  const handleBookNow = async (trainId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/auth/check-auth`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.authenticated) {
        // If not authenticated, redirect to login page with return URL
        router.push(`/login?returnUrl=/book/${trainId}`);
        return;
      }

      // If authenticated, proceed to booking page
      router.push(`/book/${trainId}`);
    } catch (error) {
      console.error('Error checking authentication:', error);
      router.push('/login');
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

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Trains</h1>
        
        <div className="space-y-6">
          {trains.map((train) => (
            <div
              key={train.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{train.trainName}</h2>
                  <p className="text-gray-600 mt-2">
                    Train Number: {train.trainNumber}
                  </p>
                  <p className="text-gray-600">
                    From: {train.source} - To: {train.destination}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">₹{train.fare}</p>
                  <p className="text-sm text-gray-500">{train.availableSeats} seats left</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Departure: <span className="font-semibold">{new Date(train.departureTime).toLocaleString()}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Arrival: <span className="font-semibold">{new Date(train.arrivalTime).toLocaleString()}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleBookNow(train.id)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 