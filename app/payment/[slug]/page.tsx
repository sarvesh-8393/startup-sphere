import Navbar from "@/components/Navbar";
import Image from "next/image";
import { Heart, CreditCard, Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface StartupData {
  id: string;
  slug: string;
  name: string;
  image_url: string;
  short_description: string;
  funding_stage: string;
}

async function getStartup(slug: string): Promise<StartupData | null> {
  try {
    const { data, error } = await supabase
      .from('startups')
      .select('id, slug, name, image_url, short_description, funding_stage')
      .eq('slug', slug)
      .single();
    if (error) {
      console.error('Failed to fetch startup:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Failed to fetch startup:", error);
    return null;
  }
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await params;
  const data = await getStartup(p.slug);

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-amber-50 to-pink-100">
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-pink-200 to-amber-200 flex items-center justify-center shadow-2xl">
          <Heart className="w-16 h-16 text-pink-700" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-amber-700 bg-clip-text text-transparent mb-4">Startup Not Found</h1>
        <p className="text-gray-600 text-lg">The startup you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white min-h-screen pt-20">

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <a
          href={`/startup/${data.slug}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {data.name}
        </a>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Startup Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-pink-200">
                  <Image
                    src={data.image_url}
                    alt={data.name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{data.name}</h1>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-pink-100 to-amber-100 text-pink-800 text-sm font-semibold rounded-full">
                    {data.funding_stage} Stage
                  </span>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">{data.short_description}</p>
            </div>

            {/* Why Fund This Startup */}
            <div className="bg-gradient-to-r from-pink-50 to-amber-50 rounded-2xl p-8 border border-pink-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Why Fund {data.name}?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Support innovative solutions that make a difference</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Be part of the journey from idea to impact</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Help build the future of technology and innovation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Fund This Startup</h2>
                  <p className="text-gray-600">Your support makes innovation possible</p>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Amount (INR)</label>
                <div className="grid grid-cols-2 gap-3">
                  {['₹500', '₹1000', '₹2000', '₹5000'].map((amount) => (
                    <button
                      key={amount}
                      className="px-4 py-3 border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="number"
                    placeholder="Enter custom amount in ₹"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
                <div className="space-y-3">
                  {/* Razorpay Integration Hint: Replace these static options with Razorpay payment methods */}
                  {/* You'll need to load Razorpay SDK and use their checkout.js */}
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-pink-300 cursor-pointer transition-colors">
                    <CreditCard className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-700">Credit/Debit Card (via Razorpay)</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-pink-300 cursor-pointer transition-colors">
                    <Shield className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-700">UPI/Net Banking (via Razorpay)</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-pink-300 cursor-pointer transition-colors">
                    <Shield className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-700">Wallets (via Razorpay)</span>
                  </div>
                </div>
                {/* Razorpay Integration Notes:
                   1. Install razorpay package: npm install razorpay
                   2. Load Razorpay checkout script in _app.js or layout
                   3. Create order on backend API endpoint
                   4. Use Razorpay checkout with order_id, key, amount, currency
                   5. Handle payment success/failure callbacks
                */}
              </div>

              {/* Fund Button */}
              <button className="w-full bg-gradient-to-r from-pink-600 to-amber-600 hover:from-pink-700 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3">
                <Heart className="w-5 h-5" />
                Fund {data.name}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Your payment is secure and encrypted. By funding, you agree to our terms of service.
              </p>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">Secure Payment</h4>
                  <p className="text-sm text-green-700">All transactions are protected by bank-level security</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
