"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Provider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

export default function LoginPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  const handleSignIn = (providerId: string) => {
    signIn(providerId, { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Welcome to YC Directory
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to explore amazing startups and connect with entrepreneurs.
        </p>

        <div className="space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleSignIn(provider.id)}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-4 rounded-2xl transition-colors flex items-center justify-center space-x-2"
              >
                <span>Sign in with {provider.name}</span>
              </button>
            ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
