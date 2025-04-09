'use client'

import React, { useEffect, useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
// import { useNavigate } from "react-router-dom";

const CheckoutForm = ({ address }: { address: string }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // const navigate = useNavigate();

    useEffect(() => {
        if (!stripe) return;

        const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
        if (!clientSecret) return;

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            if (!paymentIntent) {
                setMessage("Something went wrong.");
                return;
            }

            switch (paymentIntent.status) {
                case "succeeded":
                    setMessage("✅ Payment succeeded!");
                    break;
                case "processing":
                    setMessage("🔄 Your payment is processing.");
                    break;
                case "requires_payment_method":
                    setMessage("❌ Payment failed. Please try again.");
                    break;
                default:
                    setMessage("⚠️ Something went wrong.");
                    break;
            }
        });
    }, [stripe]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/success`, // Update with your own success URL
            },
        });

        if (error?.type === "card_error" || error?.type === "validation_error") {
            setMessage(error.message || "An error occurred.");
        } else {
            setMessage("An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" />
            <button disabled={isLoading || !stripe || !elements} id="submit">
                <span id="button-text">
                    {isLoading ? <div className="spinner" id="spinner"></div> : "Pay now"}
                </span>
            </button>
            {message && <div id="payment-message">{message}</div>}
        </form>
    );
};

export default CheckoutForm;
