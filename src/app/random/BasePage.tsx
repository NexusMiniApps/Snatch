"use client";

import { useVibrantPalette } from "~/lib/usePalette";
import { InfoView } from "~/components/views/InfoView";
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
  const palette = useVibrantPalette("/misc/post.jpg");

  const { loading, error, eventData, activeTab, setActiveTab, players } =
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
        <InfoView palette={palette} session={session} />
      )}
      {activeTab === "random" && <RandomView />}
      {activeTab === "results" && eventData && <RandomResultsView />}
    </main>
  );
}
