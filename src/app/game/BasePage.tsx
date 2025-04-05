"use client";

import { useEffect, useState } from "react";
import { useVibrantPalette } from "~/lib/usePalette";
import { InfoView } from "~/components/views/InfoView";
import { GameView } from "~/components/views/GameView";
import { GameResultsView } from "~/components/views/GameResultsView";
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

export function BasePage({ session }: { session: AuthSession }) {

  useEffect(() => {
    console.warn("BasePage mounted");
  }, []);

  // Add console warning for re-renders
  console.warn("🔄 BasePage is re-rendering");

  const palette = useVibrantPalette("/images/pokemon.jpg");
  const {
    isGameOver,
    loading,
    error,
    eventData,
    socialAFollowed,
    socialBFollowed,
    setSocialAFollowed,
    setSocialBFollowed,
    isLoading,
    players,
    activeTab,
    setActiveTab,
  } = usePartySocket();

  if (loading || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-2xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-2xl">No event data found</div>
      </div>
    );
  }

  const hasSnatchTimePassed = new Date(eventData.snatchStartTime) < new Date();

  console.log("xx isGameOver:", isGameOver);
  console.log("xx hasSnatchTimePassed:", hasSnatchTimePassed);
  console.log("xx eventData:", eventData);

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
              Huatzard Hobbyfest Card Show Giveaway is over!
            </h2>
            <p className="mb-6 text-center text-gray-600">
              Follow our social media accounts to keep up with future events and
              giveaways!
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

      {/* Tab Navigation */}
      <div className="z-20 flex w-full max-w-96 gap-2">
        {["info", "game", "results"].map((tab) => (
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
      {/* Views */}
      {/* Show Info View */}
      {activeTab === "info" && eventData && (
        <InfoView palette={palette} session={session} />
      )}
      {/* Show Game View */}
      {activeTab === "game" &&
        // !isGameOver &&
        // !hasSnatchTimePassed &&
        // eventData && 
        (
          <GameView
            palette={palette}
            snatchStartTime={new Date(eventData.snatchStartTime)}
          />
        )}
      {/* Show Results View */}
      {activeTab === "results" && eventData && (
        <GameResultsView palette={palette} resultsPlayers={players} />
      )}
    </main>
  );
}
