'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ clientSecret, onSuccess, onCancel }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!stripe || !elements) {
      return;
    }
  
    setIsLoading(true);
    setErrorMessage('');
  
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: 'if_required',
      });
  
      if (error) {
        setErrorMessage(error.message || 'An error occurred');
      } else if (paymentIntent) {
        switch (paymentIntent.status) {
          case 'succeeded':
            // Payment completed successfully
            onSuccess();
            break;
          case 'processing':
            setErrorMessage('Payment is processing. Please wait.');
            break;
          case 'requires_payment_method':
            setErrorMessage('Payment failed. Please try another payment method.');
            break;
          default:
            setErrorMessage('Unexted payment status.');
            break;
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          {errorMessage && (
            <div className="text-red-600 text-sm">{errorMessage}</div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !stripe || !elements}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentModal({ clientSecret, onSuccess, onCancel }: PaymentModalProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm clientSecret={clientSecret} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
