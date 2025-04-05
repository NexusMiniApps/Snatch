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
  const [telegramUsername, setTelegramUsername] = useState("");
  const [countryCode, setCountryCode] = useState(
    COUNTRY_CODES.find((code) => code.value === "+65")!.value,
  );
  const { setSessionCookie } = useSession();

  const createUser = api.user.createUser.useMutation({
    onSuccess: (result: { sessionId: string; sessionExpiry: Date }) => {
      setSessionCookie(result.sessionId, result.sessionExpiry);
      void router.push("/");
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
        teleUsername: telegramUsername,
        verified: false,
      });

      // Set the cookie with the returned session ID
      setSessionCookie(result.sessionId, result.sessionExpiry);

      // Handle successful login (e.g., redirect)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-8"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label htmlFor="name" className="">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-md border-2 border-black px-4 py-2 text-black"
            placeholder="Enter your name"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="telegramUsername" className="">
            Telegram Username
          </label>
          <div className="flex">
            <span className="flex items-center rounded-l-md border-2 border-r-0 border-black bg-gray-100 px-3 text-gray-500">
              @
            </span>
            <input
              id="telegramUsername"
              type="text"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              required
              className="w-full rounded-r-md border-2 border-black px-4 py-2 text-black"
              placeholder="username"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label htmlFor="phone" className="">
            Phone Number (Required)
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="rounded-md border-2 border-black px-4 py-2 text-black"
            >
              {COUNTRY_CODES.map((code) => (
                <option key={code.value} value={code.value}>
                  {code.value}
                </option>
              ))}
            </select>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full rounded-md border-2 border-black px-4 py-2 text-black"
              placeholder="Phone number"
              pattern="[0-9]*"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={createUser.isPending}
        className="h-12 border-2 border-black bg-white text-black hover:bg-gray-200"
      >
        {createUser.isPending ? "Creating..." : "Submit"}
      </Button>
    </form>
  );
}
