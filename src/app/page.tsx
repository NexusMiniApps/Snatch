"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { FaWhatsapp } from "react-icons/fa";

const formatPhoneNumber = (phone: string): string => {
  // Remove all whitespace and any + at the beginning
  return phone.replace(/\s+/g, '').replace(/^\+/, '');
};

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendVerificationCode = api.auth.sendVerificationCode.useMutation({
    onSuccess: () => {
      setStep("verify");
      setError("");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const verifyCode = api.auth.verifyCode.useMutation({
    onSuccess: () => {
      // Redirect to dashboard or main app page
      router.push("/gamepage");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await sendVerificationCode.mutateAsync({
        phoneNumber: formattedPhone,
        name,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await verifyCode.mutateAsync({
        phoneNumber: formattedPhone,
        code: verificationCode,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow spaces and numbers in the input
    const value = e.target.value;
    if (value === '' || /^[+\d\s]*$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Welcome to <span className="text-[hsl(280,100%,70%)]">Snatch</span>
        </h1>

        <div className="w-full max-w-md rounded-lg bg-white/10 p-8 backdrop-blur-lg">
          {error && (
            <div className="mb-4 rounded-md bg-red-500/10 p-4 text-red-500">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="flex items-center justify-center gap-2 text-white mb-4">
                <FaWhatsapp className="text-2xl text-green-500" />
                <span>Verification via WhatsApp</span>
              </div>
              
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-white"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-white"
                >
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="+65 XXXX XXXX"
                  pattern="^[+\d\s]+$"
                  title="Please enter a valid phone number with country code"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">
                  Enter your WhatsApp number with country code (e.g., +65 9753 9839)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaWhatsapp />
                {loading ? "Sending..." : "Send WhatsApp Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="flex items-center justify-center gap-2 text-white mb-4">
                <FaWhatsapp className="text-2xl text-green-500" />
                <span>Check your WhatsApp for the code</span>
              </div>

              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-white"
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  pattern="\d{6}"
                  required
                />
                <p className="mt-1 text-sm text-gray-400">
                  Enter the 6-digit code sent to your WhatsApp
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaWhatsapp />
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                Back to phone number
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
