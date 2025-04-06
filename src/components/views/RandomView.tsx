import React from "react";
// Import WinnerSelector
import WinnerSelector from "~/components/ui/WinnerSelection";
// Import usePartySocket
import { usePartySocket } from "~/PartySocketContext";

export const RandomView: React.FC = () => {
  // Get eventData from context
  const { eventData } = usePartySocket();

  // Handle loading state for eventData
  if (!eventData) {
    return <div className="p-4">Loading event data...</div>;
  }

  return (
    <div className="w-full max-w-96 rounded-lg border bg-white p-4 shadow">
      {/* <h2 className="text-xl font-semibold mb-4">Random Event View</h2> */}
      <p className="mb-4">Tickets for the random draw:</p>

      {/* Render WinnerSelector, passing only eventId from context, remove isAdmin */}
      <WinnerSelector eventId={eventData.id} />
    </div>
  );
};
