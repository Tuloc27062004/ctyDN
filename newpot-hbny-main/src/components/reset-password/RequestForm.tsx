"use client";

import Link from "next/link";
import { useState } from "react";

interface RequestResetFormProps {
  onSubmit: ( email: string ) => Promise<void>;
  isLoading: boolean;
}

export function RequestResetForm({ onSubmit, isLoading }: RequestResetFormProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email address";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length === 0) {
      await onSubmit(email);
    }
  };

  return (
    <div className="p-10">
          <h2 className="text-3xl font-semibold mb-2">Oops</h2>
          <p className="text-gray-500 mb-8">
            Request to reset your password
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ...existing code for form fields and error messages... */}
            <div>
              <label className="text-sm text-gray-600">Email (*)</label>
              <input
                type="email"
                className={`w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.email ? 'border-red-500' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-green-700 text-white font-semibold py-3 rounded-lg hover:bg-green-800 transition"
              disabled={isLoading}
            >
              Request
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-6">
            Remember your password?{" "}
            <Link href="/sign-in" className="text-green-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
  );
}