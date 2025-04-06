import React, { useState, useEffect } from "react";
import { usePartySocket } from "~/PartySocketContext";

// Interface for the winner data structure expected from the API
interface WinnerData {
  userId: string;
  ticketNumber: string;
  name: string;
}

// Interface for the API response structure
interface WinnerApiResponse {
  winner?: WinnerData | null;
  message?: string; // For "no winner yet" messages
  error?: string; // For actual errors
}

export const RandomResultsView: React.FC = () => {
  const { eventData } = usePartySocket();
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noWinnerMessage, setNoWinnerMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchWinner = async () => {
      if (!eventData?.id) {
        // Wait for eventData to be available
        setIsLoading(false); // Not technically loading if we don't have an ID
        return;
      }

      setIsLoading(true);
      setError(null);
      setNoWinnerMessage(null);
      setWinner(null);

      try {
        const response = await fetch(
          `/api/events/winner?eventId=${eventData.id}`,
        );
        const data = (await response.json()) as WinnerApiResponse;

        if (!response.ok) {
          throw new Error(
            data.error ?? `Failed to fetch winner (status: ${response.status})`,
          );
        }

        if (data.winner) {
          setWinner(data.winner);
        } else if (data.message) {
          // Handle the case where the API specifically says no winner yet
          setNoWinnerMessage(data.message);
        } else {
          // Should not happen with current API structure, but handle defensively
          setNoWinnerMessage("Winner information not available.");
        }
      } catch (err) {
        console.error("Error fetching winner:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchWinner();
    // Dependency array includes eventData.id to refetch if it changes
  }, [eventData?.id]);

  return (
    <div className="rounded-lg border bg-white p-4 shadow">
      <h2 className="mb-4 text-center text-xl font-semibold">
        Random Event Results
      </h2>

      {isLoading && (
        <div className="text-center text-gray-500">
          Loading winner information...
        </div>
      )}

      {error && <div className="text-center text-red-500">Error: {error}</div>}

      {!isLoading && !error && winner && (
        <div className="my-4 rounded-xl border-2 border-yellow-400 bg-yellow-100 p-6 text-center">
          <h3 className="mb-2 text-xl font-medium">🎉 Congratulations! 🎉</h3>
          <div className="mb-2 text-3xl font-bold">{winner.name}</div>
          <div className="text-lg">
            Ticket Number:{" "}
            <span className="text-2xl font-bold">{winner.ticketNumber}</span>
          </div>
        </div>
      )}

      {!isLoading && !error && !winner && (
        <div className="text-center text-gray-500">
          {noWinnerMessage ?? "Waiting for winner selection..."}
        </div>
      )}
    </div>
  );
};

// Make it the default export if needed, or keep as named export
// export default RandomResultsView;
