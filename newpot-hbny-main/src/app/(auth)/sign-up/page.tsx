"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/provider/auth-provider";

export default function SignUpPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    companyName: "",
    companyAddress: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<any>({});

  const { signUp, isSigningUp } = useAuth();

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    const newErrors: any = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email address";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    if (!form.password) newErrors.password = "Password is required";
    if (!form.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      // Submit form (e.g., API call)
      await signUp({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        country: form.country,
        companyName: form.companyName,
        companyAddress: form.companyAddress,
      });
    }
  };
    return (
      <div className="h-screen bg-[#f7f7f7] flex items-center justify-center px-6 overflow-hidden relative">
        {/* Back to Home link */}
        <Link href="/" className="absolute top-6 left-6 text-green-700 font-medium flex items-center gap-1 hover:underline">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Home
        </Link>

        <div className="max-w-5xl w-full h-[60vh] grid md:grid-cols-2 bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* LEFT IMAGE (always full height) */}
          <div className="hidden md:block h-full">
            <img
              src="https://images.unsplash.com/photo-1521334884684-d80222895322?w=800&q=80"
              alt="eco"
              className="w-full h-full object-cover"
            />
          </div>
          {/* RIGHT FORM (scrollable) */}
          <div className="h-full overflow-y-auto p-10">
            <h2 className="text-3xl font-semibold mb-2">
              Create Account
            </h2>
            <p className="text-gray-500 mb-8">
              Join EcoCrete platform
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ...existing code for form fields and error messages... */}
              <div>
                <label className="text-sm text-gray-600">Full Name (*)</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className={`w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.fullName ? 'border-red-500' : ''}`}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600">Email (*)</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone (*)</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={`w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600">Country</label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Company Name</label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Company Address</label>
                <input
                  name="companyAddress"
                  value={form.companyAddress}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Password (*)</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.password ? 'border-red-500' : ''}`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-600">Confirm Password (*)</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={`w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              <button disabled={isSigningUp} className="w-full bg-green-700 text-white font-semibold py-3 rounded-lg hover:bg-green-800 transition">
                Create Account
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-green-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
  );
}