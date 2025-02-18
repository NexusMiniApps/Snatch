"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { useSession } from "~/hooks/useSession";

const COUNTRY_CODES = [
  { value: "+65", label: "Singapore (+65)" },
  { value: "+1", label: "USA/Canada (+1)" },
  { value: "+44", label: "UK (+44)" },
  { value: "+91", label: "India (+91)" },
  { value: "+971", label: "UAE (+971)" },
  { value: "+60", label: "Malaysia (+60)" },
  { value: "+63", label: "Philippines (+63)" },
  { value: "+66", label: "Thailand (+66)" },
  { value: "+852", label: "Hong Kong (+852)" },
  // Add more country codes as needed
];

export function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState(
    COUNTRY_CODES.find((code) => code.value === "+65")!.value,
  );
  const { setSessionCookie } = useSession();

  const createUser = api.user.createUser.useMutation({
    onSuccess: (result: { sessionId: string; sessionExpiry: Date }) => {
      setSessionCookie(result.sessionId, result.sessionExpiry);
      void router.push("/coffee");
      void router.refresh();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createUser.mutateAsync({
        name,
        phoneNo: phoneNumber,
        countryCode: countryCode,
        verified: false,
      });

      // Set the cookie with the returned session ID
      setSessionCookie(result.sessionId, result.sessionExpiry);

      // Handle successful login (e.g., redirect)
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-white">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-md px-4 py-2 text-black"
          placeholder="Enter your name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className="text-white">
          Phone Number
        </label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="rounded-md px-4 py-2 text-black"
          >
            {COUNTRY_CODES.map((code) => (
              <option key={code.value} value={code.value}>
                {code.label}
              </option>
            ))}
          </select>
          <input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="flex-1 rounded-md px-4 py-2 text-black"
            placeholder="Phone number"
            pattern="[0-9]*"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={createUser.isPending}
        className="bg-white text-black hover:bg-gray-200"
      >
        {createUser.isPending ? "Creating..." : "Submit"}
      </Button>
    </form>
  );
}
