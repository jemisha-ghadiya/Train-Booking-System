'use client'

import React, { useEffect, useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

interface CheckoutFormProps {
    address: string;
    onSuccess?: () => void;
    onClose?: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ address, onSuccess, onClose }) => {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);

    useEffect(() => {
        if (!stripe) return;

        const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
        if (!clientSecret) return;

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent?.status) {
                case "succeeded":
                    setMessage("Payment succeeded!");
                    setPaymentComplete(true);
                    onSuccess?.();
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
    }, [stripe, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            setMessage("Stripe has not loaded yet. Please try again.");
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            // First check the current status of the payment intent
            const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
            if (clientSecret) {
                const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
                
                // If payment is already succeeded, don't try to confirm it again
                if (paymentIntent?.status === "succeeded") {
                    setMessage("Payment already completed!");
                    setPaymentComplete(true);
                    onSuccess?.();
                    setIsLoading(false);
                    return;
                }
            }

            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.href, // stay on same page
                    payment_method_data: {
                        billing_details: {
                            address: {
                                line1: address
                            }
                        }
                    }
                },
                redirect: 'if_required'
            });

            if (error) {
                // Handle specific error types
                if (error.type === 'card_error' || error.type === 'validation_error') {
                    setMessage(error.message || "An error occurred with your card.");
                } else if (error.type === 'invalid_request_error' && error.code === 'payment_intent_unexpected_state') {
                    // Handle the case when payment is already succeeded
                    setMessage("Payment already completed!");
                    setPaymentComplete(true);
                    onSuccess?.();
                } else {
                    setMessage("An unexpected error occurred. Please try again.");
                }
                console.error("Payment error:", error);
            }
        } catch (err: any) {
            setMessage(err.message || "A processing error occurred. Please try again.");
            console.error("Payment processing error:", err);
        } finally {
            setIsLoading(false);
        }
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

                {!paymentComplete ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-2xl font-bold mb-4">Complete Your Payment</h2>
                        <PaymentElement />
                        <button
                            disabled={isLoading || !stripe || !elements}
                            className={`w-full py-2 px-4 rounded-md text-white font-semibold ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {isLoading ? "Processing..." : "Pay now"}
                        </button>
                        {message && (
                            <div className="mt-4 text-center text-sm text-gray-600">
                                {message}
                            </div>
                        )}
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
                        <p className="text-gray-700">Thank you for your payment.</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckoutForm;
