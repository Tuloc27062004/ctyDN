"use client";

import Link from "next/link";
import { useAuth } from "@/components/provider/auth-provider";
import { RequestResetForm } from "@/components/reset-password/RequestForm";
import { ResetPasswordForm } from "@/components/reset-password/ResetForm";
import { useSearchParams } from "next/navigation";

export default function ResetPassword() {

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {resetPassword, isResettingPassword, requestPasswordReset, isRequestingPasswordReset} = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-start justify-center px-4 py-24 sm:px-6 md:items-center md:py-0 relative">
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
        {!token ? (
        <RequestResetForm
          onSubmit={requestPasswordReset}
          isLoading={isRequestingPasswordReset}
        />
      ) : (
        <ResetPasswordForm
          token={token}
          onSubmit={resetPassword}
          isLoading={isResettingPassword}
        />
      )}
      </div>
    </div>
  );
}
