import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { Appearance, StripeElementsOptions } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  clientSecret: string;
  address: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ clientSecret, address, onSuccess, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a payment intent in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get("payment_intent");
    
    if (paymentIntentId) {
      // If there's a payment intent in the URL, it means we're returning from a redirect
      // We should check the status and call onSuccess if it's succeeded
      const checkPaymentStatus = async () => {
        try {
          const stripe = await stripePromise;
          if (!stripe) return;
          
          const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
          
          if (paymentIntent?.status === "succeeded") {
            onSuccess?.();
          }
        } catch (err) {
          console.error("Error checking payment status:", err);
          setError("Failed to verify payment status");
        } finally {
          setIsLoading(false);
        }
      };
      
      checkPaymentStatus();
    } else {
      setIsLoading(false);
    }
  }, [clientSecret, onSuccess]);

  if (isLoading) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <p className="text-center">Verifying payment status...</p>
      </div>
    </div>;
  }

  if (error) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <p className="text-center text-red-500">{error}</p>
        <button 
          onClick={onClose}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>;
  }

  if (!clientSecret) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <p className="text-center">Loading payment information...</p>
      </div>
    </div>;
  }

  // ✅ Use Stripe types explicitly
  const appearance: Appearance = {
    theme: 'stripe', // Valid themes: 'stripe', 'flat', 'night', 'none'
    variables: {
      colorPrimary: '#0F766E',
      colorBackground: '#ffffff',
      colorText: '#30313d',
    }
  };

  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm 
        address={address} 
        onSuccess={onSuccess}
        onClose={onClose}
      />
    </Elements>
  );
};

export default PaymentModal;
