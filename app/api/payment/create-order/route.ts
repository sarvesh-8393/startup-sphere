import { getServerSession } from 'next-auth';
import { createRazorpayOrder } from '@/lib/razorpay';
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
    const { startupId, startupName, amount } = body;

    if (!startupId || !startupName || !amount) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount (min 1, max 100000)
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 1 || numAmount > 100000) {
      return Response.json(
        { success: false, error: 'Amount must be between ₹1 and ₹100,000' },
        { status: 400 }
      );
    }

    // Get user profile for name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('email', session.user.email)
      .single();

    const userName = profileData?.full_name || session.user.email;

    // Create Razorpay order
    const orderResult = await createRazorpayOrder(
      numAmount,
      startupId,
      startupName,
      session.user.email,
      userName
    );

    if (!orderResult.success) {
      return Response.json(
        { success: false, error: orderResult.error },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      orderId: orderResult.orderId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      userName,
      userEmail: session.user.email,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
