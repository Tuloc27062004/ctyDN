"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/provider/auth-provider";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<any>({});

  const {login, isLoggingIn} = useAuth();

  const validate = () => {
    const newErrors: any = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      // Submit form (e.g., API call)
      await login({ email, password });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-6 relative">
      {/* Back to Home link */}
      <Link href="/" className="absolute top-6 left-6 text-green-700 font-medium flex items-center gap-1 hover:underline">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Home
      </Link>
      <div className="max-w-5xl w-full grid md:grid-cols-2 bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* LEFT IMAGE */}
        <div className="hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80"
            alt="eco"
            className="h-full w-full object-cover"
          />
        </div>
        {/* FORM */}
        <div className="p-10">
          <h2 className="text-3xl font-semibold mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">
            Sign in to your EcoCrete account
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ...existing code for form fields and error messages... */}
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                className={`w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.email ? 'border-red-500' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                className={`w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.password ? 'border-red-500' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-green-700 text-white font-semibold py-3 rounded-lg hover:bg-green-800 transition"
              disabled={isLoggingIn}
            >
              Sign In
            </button>
          </form>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 mt-6 ">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-green-700 font-medium">
                Sign up
              </Link>
            </p>
            <p className="text-sm text-gray-500 mt-6 ">
              <Link href="/reset-password" className="text-green-700 font-medium">
                Forgot Password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}