import { getServerSession } from 'next-auth';
import { verifyRazorpayPayment, getPaymentDetails } from '@/lib/razorpay';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paymentId, signature, startupId, amount } = body;

    if (!orderId || !paymentId || !signature) {
      return Response.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify signature
    const verifyResult = await verifyRazorpayPayment(orderId, paymentId, signature);

    if (!verifyResult.success) {
      return Response.json(
        { success: false, error: verifyResult.error },
        { status: 400 }
      );
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(paymentId);

    if (!paymentDetails.success || !paymentDetails.payment) {
      return Response.json(
        { success: false, error: 'Failed to fetch payment details' },
        { status: 500 }
      );
    }

    const payment = paymentDetails.payment as { amount: string | number; status: string };

    // Get user ID from email
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!profileData) {
      return Response.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Log transaction in database
    const finalAmount = amount || (Number(payment.amount) / 100);
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        sender_id: profileData.id,
        startup_id: startupId,
        amount: finalAmount,
        message: `Payment via Razorpay (${paymentId})`,
        timestamp: new Date().toISOString(),
        payment_id: paymentId,
        order_id: orderId,
        payment_status: payment.status,
      });

    if (transactionError) {
      console.error('Transaction logging error:', transactionError);
      // Don't fail the request - payment was successful even if logging failed
    }

    return Response.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId,
      orderId,
      amount: finalAmount,
      transactionId: paymentId,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
