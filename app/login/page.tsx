"use client";

import {  signIn } from "next-auth/react";


export default function LoginPage() {
 



  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="bg-white p-10 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Welcome to YC Directory
        </h1>
        <p className="mb-6 text-gray-600">
          Login with GitHub to explore startups.
        </p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="bg-gray-900 text-white px-5 py-2 rounded-md hover:bg-gray-700 transition"
        >
          Login with GitHub
        </button>
      </div>
    </div>
  );
}
