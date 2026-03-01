import Image from "next/image";
import { Heart, Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import RazorpayPaymentForm from "@/components/RazorpayPaymentForm";

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
                    src={data.image_url && String(data.image_url).trim() ? String(data.image_url) : "/user.png"}
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
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Fund This Startup</h2>
                  <p className="text-gray-600">Your support makes innovation possible</p>
                </div>
              </div>

              {/* Razorpay Payment Form */}
              <RazorpayPaymentForm 
                startupId={data.id} 
                startupName={data.name}
              />
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">Secure Payment</h4>
                  <p className="text-sm text-green-700">All transactions are protected by Razorpay&#39;s bank-level security</p>
                </div>
              </div>
            </div>

           
          </div>
        </div>
      </div>
    </div>
  );
}
