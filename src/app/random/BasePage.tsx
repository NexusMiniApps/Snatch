"use client";

import { useVibrantPalette } from "~/lib/usePalette";
import { RandomInfoView } from "~/components/views/RandomInfoView";
import { RandomResultsView } from "~/components/views/RandomResultsView";
import { RandomView } from "~/components/views/RandomView";
import { usePartySocket, type TabType } from "~/PartySocketContext";

export type AuthSession = {
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    phoneNo: bigint;
    countryCode: bigint;
    verified: boolean;
  };
};

export default function BasePage({ session }: { session: AuthSession }) {
  const palette = useVibrantPalette("/images/pokemon.jpg");

  const { 
    loading, 
    error, 
    eventData, 
    activeTab, 
    setActiveTab, 
    socialAFollowed,
    socialBFollowed,
    setSocialAFollowed,
    setSocialBFollowed, } =
    usePartySocket();

  console.log("Render state from context:", {
    loading,
    error,
    eventData,
    snatchStartTime: eventData?.snatchStartTime,
    activeTab,
    currentTime: new Date().toISOString(),
  });

  if (loading) {
    return <div>Loading event details...</div>;
  }

  if (error || !eventData) {
    return <div>Error loading event details: {error}</div>;
  }

  return (
    <main
      style={{
        backgroundColor: palette.lightVibrant,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        KhtmlUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
      className="flex min-h-screen flex-col items-center gap-y-6 overflow-hidden px-4 pt-6"
    >
       {/* Social Media Overlay */}
       {(!socialAFollowed || !socialBFollowed) && (
        <div className="fixed bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md">
          <div className="m-3 mt-2 flex w-full max-w-md flex-col items-center rounded-xl bg-white bg-opacity-90 p-8 shadow-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
              Follow our socials!
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Follow our social media accounts to quality for the giveaway!
            </p>
            <div className="flex w-full flex-col gap-4">
              {!socialAFollowed && (
                <div className="custom-box flex w-full p-1">
                  <a
                    href="https://t.me/huatzard"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setSocialAFollowed(true);
                    }}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Telegram
                  </a>
                </div>
              )}
              {!socialBFollowed && (
                <div className="custom-box flex w-full p-1">
                  <a
                    href="https://www.tiktok.com/@huatzard"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setSocialBFollowed(true);
                    }}
                    className="flex-1 rounded-lg bg-purple-600 px-4 py-3 text-center font-medium text-white transition-all hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    TikTok
                  </a>
                </div>
              )}
            </div>
            {(socialAFollowed || socialBFollowed) && (
              <p className="mt-4 text-center text-sm text-green-600">
                {socialAFollowed && socialBFollowed
                  ? "Thank you for following both accounts!"
                  : socialAFollowed
                    ? "Thanks for joining us on Telegram!"
                    : "Thanks for following us on TikTok!"}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="z-20 flex w-full max-w-96 gap-2">
        {["info", "random", "results"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as TabType)}
            className={`flex-1 rounded-t-lg border-2 border-b-0 border-black bg-white p-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-black"
                : "text-gray-500 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "info" && eventData && (
        <RandomInfoView palette={palette} session={session} />
      )}
      {activeTab === "random" && <RandomView />}
      {activeTab === "results" && eventData && <RandomResultsView />}
    </main>
  );
}
