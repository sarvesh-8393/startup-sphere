'use client';

import { useState } from 'react';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RazorpayPaymentFormProps {
  startupId: string;
  startupName: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  notes?: Record<string, string>;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayPaymentFailure {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: RazorpayPaymentFailure) => void) => void;
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export default function RazorpayPaymentForm({
  startupId,
  startupName,
}: RazorpayPaymentFormProps) {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || Number(amount) < 1) {
      toast.error('Please enter a valid amount (minimum ₹1)');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create order on backend
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId,
          startupName,
          amount: Number(amount),
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        toast.error(orderData.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      // Step 2: Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        // Step 3: Initialize Razorpay checkout
        const options = {
          key: orderData.keyId, // Razorpay Key ID
          amount: orderData.amount * 100, // Amount in paise
          currency: 'INR',
          name: 'StartupSphere',
          description: `Support ${startupName}`,
          image: '/logo.png', // Optional: your logo
          order_id: orderData.orderId, // Order ID from backend
          handler: async (response: RazorpayPaymentResponse) => {
            // Step 4: Verify payment on backend
            try {
              const verifyResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: orderData.orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  startupId,
                  amount: Number(amount),
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                setPaymentSuccess(true);
                toast.success('Payment successful! Thank you for supporting this startup!');
                setAmount('');
                // Reset form after 2 seconds
                setTimeout(() => setPaymentSuccess(false), 2000);
              } else {
                toast.error(verifyData.error || 'Payment verification failed');
              }
            } catch (error) {
              toast.error('Failed to verify payment');
              console.error(error);
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: orderData.userName || 'Guest',
            email: orderData.userEmail || '',
            contact: '', // Optional: prefill contact if available
          },
          theme: {
            color: '#ec4899', // Pink color for theme
          },
          notes: {
            startup_id: startupId,
            startup_name: startupName,
          },
        };

        const rzp = new window.Razorpay(options);

        // Handle payment failures
        rzp.on('payment.failed', function (response: RazorpayPaymentFailure) {
          toast.error(`Payment failed: ${response.error.description}`);
          setLoading(false);
        });

        rzp.open();
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Amount (₹)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-lg font-semibold">
            ₹
          </span>
          <input
            type="number"
            min="1"
            max="100000"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
            disabled={loading || paymentSuccess}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Minimum: ₹1 | Maximum: ₹100,000
        </p>
      </div>

     

      {/* Success Message */}
      {paymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Payment Successful!</p>
            <p className="text-xs text-green-700">
              Your support has been recorded. Thank you!
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !amount || paymentSuccess}
        className="w-full bg-gradient-to-r from-pink-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : paymentSuccess ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Payment Complete
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay Now with Razorpay
          </>
        )}
      </button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-gray-600 text-xs pt-2 border-t border-gray-200">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span>Secure payment powered by Razorpay</span>
      </div>
    </form>
  );
}
