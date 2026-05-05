import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10">
        <Image
          src="/images/logo.png"
          alt="Logo"
          fill
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      {/* Spinner */}
      <div className="relative flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>

        <p className="text-stone-600 text-sm">Loading...</p>
      </div>
    </div>
  );
}