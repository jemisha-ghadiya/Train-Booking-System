'use client'

import React, { useEffect, useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
    address: string;
    onSuccess?: () => void;
    onClose?: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ address, onSuccess, onClose }) => {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!stripe) {
            return;
        }

        const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
        if (!clientSecret) {
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent?.status) {
                case "succeeded":
                    setMessage("Payment succeeded! Redirecting to your bookings...");
                    onSuccess?.();
                    setTimeout(() => {
                        router.push('/dashboard/bookings');
                    }, 2000);
                    break;
                case "processing":
                    setMessage("Your payment is processing.");
                    break;
                case "requires_payment_method":
                    setMessage("Please provide payment details.");
                    break;
                default:
                    setMessage("Something went wrong.");
                    break;
            }
        });
    }, [stripe, router, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/dashboard/bookings`,
                payment_method_data: {
                    billing_details: {
                        address: {
                            line1: address
                        }
                    }
                }
            }
        });

        if (error) {
            setMessage(error.message ?? "An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-2xl font-bold mb-4">Complete Your Payment</h2>
                    <PaymentElement />
                    <button
                        disabled={isLoading || !stripe || !elements}
                        className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
                            isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isLoading ? "Processing..." : "Pay now"}
                    </button>
                    {message && (
                        <div className={`mt-4 text-center text-sm ${
                            message.includes('succeeded') ? 'text-green-600' : 'text-gray-600'
                        }`}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CheckoutForm;
