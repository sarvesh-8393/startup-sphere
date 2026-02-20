# Razorpay Payment Integration Setup Guide

## Overview
Razorpay integration has been fully implemented for the StartupSphere payment system. The system supports test mode for development and can easily switch to production mode.

## What's Been Implemented

### Backend Components
1. **`lib/razorpay.ts`** - Razorpay client configuration and helper functions
   - `createRazorpayOrder()` - Creates payment orders
   - `verifyRazorpayPayment()` - Verifies payment signatures
   - `getPaymentDetails()` - Fetches payment info

2. **API Endpoints**
   - `POST /api/payment/create-order` - Initialize payment order
   - `POST /api/payment/verify` - Verify and log payment

3. **Database Updates**
   - Extended `transactions` table with payment fields:
     - `payment_id` - Razorpay payment ID
     - `order_id` - Razorpay order ID
     - `payment_status` - Payment status
     - `payment_method` - Payment method used

### Frontend Components
1. **`components/RazorpayPaymentForm.tsx`** - Complete payment form
   - Amount input with validation
   - Razorpay checkout integration
   - Success/error handling
   - Toast notifications

2. **`app/payment/[slug]/page.tsx`** - Updated payment page
   - Integrated RazorpayPaymentForm
   - Test mode information
   - Security notices

## Setup Instructions

### Step 1: Get Razorpay Credentials

1. Go to [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Create a Razorpay account (free tier available)
3. Navigate to **Settings → API Keys**
4. You'll see:
   - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** (keep this secret!)

### Step 2: Update Environment Variables

Copy `.env.example` to `.env.local` and add your Razorpay keys:

```bash
# .env.local
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

### Step 3: Install Dependencies

```bash
npm install razorpay
```

or if you're using yarn:

```bash
yarn add razorpay
```

### Step 4: Update Database Schema (If Needed)

If you already have the `transactions` table, run this SQL in your Supabase SQL Editor:

```sql
-- Add Razorpay fields to existing transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS order_id VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
```

Or if creating fresh, run the entire `schema/schema.sql` file.

### Step 5: Test Payment Flow

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to a startup detail page and click the payment button

3. Use test credentials:
   - **Card Number**: 4111 1111 1111 1111
   - **Expiry**: Any future date (e.g., 12/25)
   - **CVV**: Any 3 digits (e.g., 123)
   - **Name**: Any name

4. A payment of ₹1 will be processed in test mode

5. Check the `transactions` table in Supabase to verify the transaction was logged

## Test Card Details

### For Testing in Test Mode:

| Type | Card Number | Status |
|------|------------|--------|
| Visa (Success) | 4111 1111 1111 1111 | ✅ Success |
| Visa (Failure) | 4012888888881881 | ❌ Failed |
| Mastercard (Success) | 5555 5555 5555 4444 | ✅ Success |
| Mastercard (Failure) | 5105 1051 0510 5100 | ❌ Failed |

**All test cards:**
- Expiry: Any future date
- CVV: Any 3 digits (e.g., 123)
- OTP: 000000

## Production Setup (When Ready)

To switch to production:

1. Complete your Razorpay account verification
2. Go to **Settings → API Keys** and get your **Live** keys
3. Update `.env.local`:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
   ```
4. No code changes needed - the system automatically uses live keys from env variables

## Payment Flow

```
User enters amount → Backend creates order → Razorpay checkout opens
                                                      ↓
                                          User completes payment
                                                      ↓
                                    Razorpay returns payment details
                                                      ↓
                                    Backend verifies signature
                                                      ↓
                                    Transaction logged to database
                                                      ↓
                                          User sees success message
```

## API Reference

### Create Order Endpoint
```
POST /api/payment/create-order

Request:
{
  "startupId": "uuid",
  "startupName": "Startup Name",
  "amount": 1000
}

Response:
{
  "success": true,
  "orderId": "order_xxxxxxxxxxxx",
  "amount": 1000,
  "currency": "INR",
  "keyId": "rzp_test_xxxxxxxxxxxx",
  "userName": "User Name",
  "userEmail": "user@example.com"
}
```

### Verify Payment Endpoint
```
POST /api/payment/verify

Request:
{
  "orderId": "order_xxxxxxxxxxxx",
  "paymentId": "pay_xxxxxxxxxxxx",
  "signature": "xxxxxxxxxxxx",
  "startupId": "uuid",
  "amount": 1000
}

Response:
{
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "pay_xxxxxxxxxxxx",
  "orderId": "order_xxxxxxxxxxxx",
  "amount": 1000,
  "transactionId": "uuid"
}
```

## Troubleshooting

### Issue: "Missing Razorpay credentials"
**Solution**: Check that `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in `.env.local`

### Issue: "Invalid payment signature"
**Solution**: This means the payment wasn't actually processed by Razorpay. Use valid test cards.

### Issue: Payment button not appearing
**Solution**: 
1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Check browser console for errors

### Issue: "Order creation failed"
**Solution**: 
1. Verify your Razorpay credentials are correct
2. Check that you're not exceeding rate limits
3. Ensure amount is between ₹1 and ₹100,000

## Security Considerations

1. **Signature Verification**: All payments are verified using HMAC-SHA256
2. **Keys**: Never commit `.env.local` to git (already in .gitignore)
3. **HTTPS**: Always use HTTPS in production
4. **Amount Validation**: Backend validates amount ranges (₹1 - ₹100,000)
5. **User Authentication**: All payment endpoints require user login

## Monitoring

To monitor payments:

1. **Razorpay Dashboard**: View all transactions at [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. **Database**: Query `transactions` table:
   ```sql
   SELECT * FROM transactions WHERE payment_id IS NOT NULL ORDER BY timestamp DESC LIMIT 10;
   ```

## Future Enhancements

- [ ] Webhooks for real-time payment notifications
- [ ] Subscription support for recurring payments
- [ ] Payout system for founders
- [ ] Invoice generation and email
- [ ] Payment analytics dashboard
- [ ] Refund processing interface
- [ ] Multiple currency support

## Support

For Razorpay-specific issues:
- **Documentation**: https://razorpay.com/docs/
- **Support**: https://razorpay.com/support/

For StartupSphere issues:
- Check existing GitHub issues
- Review the implementation files:
  - `lib/razorpay.ts` - Business logic
  - `app/api/payment/*` - API endpoints
  - `components/RazorpayPaymentForm.tsx` - Frontend form

---

**Last Updated**: February 20, 2026
**Status**: ✅ Fully Implemented (Test Mode Ready)
