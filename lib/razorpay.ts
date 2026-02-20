import Razorpay from 'razorpay';

// Initialize Razorpay instance
export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Generate Razorpay order for startup funding
 */
export async function createRazorpayOrder(
  amount: number, // in rupees
  startupId: string,
  startupName: string,
  userEmail: string,
  userName: string
) {
  try {
    // Generate short receipt (max 40 chars)
    // Format: startup-[short-id]-[timestamp] (e.g., startup-abc123-1708416000)
    const shortId = startupId.slice(0, 8); // First 8 chars of UUID
    const timestamp = Math.floor(Date.now() / 1000); // Seconds since epoch
    const receipt = `startup-${shortId}-${timestamp}`.slice(0, 40);

    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects amount in paise (1 rupee = 100 paise)
      currency: 'INR',
      receipt,
      notes: {
        startup_id: startupId,
        startup_name: startupName,
        user_email: userEmail,
        user_name: userName,
      },
    });

    return {
      success: true,
      orderId: order.id,
      amount: Number(order.amount) / 100, // Convert back to rupees
      currency: order.currency,
    };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}

/**
 * Verify Razorpay payment signature
 */
export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    const crypto = await import('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === signature;

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid payment signature',
      };
    }

    return {
      success: true,
      orderId,
      paymentId,
      verified: true,
    };
  } catch (error) {
    console.error('Razorpay payment verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment',
    };
  }
}
