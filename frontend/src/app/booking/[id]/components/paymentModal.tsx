import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { Appearance, StripeElementsOptions } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  clientSecret: string;
  address: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ clientSecret, address }) => {
  if (!clientSecret) {
    return <p>Loading payment information...</p>;
  }

  // ✅ Use Stripe types explicitly
  const appearance: Appearance = {
    theme: 'stripe', // Valid themes: 'stripe', 'flat', 'night', 'none'
  };

  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm address={address} />
    </Elements>
  );
};

export default PaymentModal;
