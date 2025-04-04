"use client";

import { type AuthSession } from "~/app/game/BasePage";
import { InfoView as GameInfoView } from "~/components/views/GameInfoView";
import { usePartySocket } from "~/PartySocketContext";

interface GameInfoViewWrapperProps {
  palette: {
    lightMuted: string;
    lightVibrant: string;
    darkMuted: string;
    darkVibrant: string;
    muted: string;
    vibrant: string;
  };
  session: AuthSession;
}

export function GameInfoViewWrapper({
  palette,
  session,
}: GameInfoViewWrapperProps) {
  // Get players and eventData from PartySocketContext
  const { players, eventData } = usePartySocket();

  // Extract only the lightMuted property from the palette
  const lightMutedPalette = {
    lightMuted: palette.lightMuted,
  };

  // Handle time up event
  const handleTimeUp = () => {
    console.log("Time is up!");
    // You can add additional logic here if needed
  };

  if (!eventData) {
    return <div>Loading event data...</div>;
  }

  return (
    <GameInfoView
      palette={lightMutedPalette}
      onTimeUp={handleTimeUp}
      eventData={eventData}
    />
  );
} 