// src/components/ui/WinnerSelection.tsx
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface TicketData {
  userId: string;
  ticketNumber: string;
  name: string;
}

interface WinnerData {
  userId: string;
  ticketNumber: string;
  name: string;
}

interface WinnerSelectorProps {
  eventId: string;
  isAdmin: boolean;
}

export default function WinnerSelector({
  eventId,
  isAdmin,
}: WinnerSelectorProps) {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tickets
  const fetchTickets = useCallback(async () => {
    if (!eventId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/eventParticipant/tickets?eventId=${eventId}`,
      );
      if (response.ok) {
        const data = (await response.json()) as {
          tickets: TicketData[];
        };
        setTickets(data.tickets);
      } else {
        const errorData = (await response.json()) as { message?: string };
        setError(errorData.message ?? "Failed to fetch tickets");
        console.error("Failed to fetch tickets:", response.statusText);
      }
    } catch (error) {
      setError("Error connecting to server");
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Fetch tickets on component mount
  useEffect(() => {
    void fetchTickets();

    // Also check if there's already a winner
    async function checkExistingWinner() {
      try {
        const response = await fetch(`/api/event/winner?eventId=${eventId}`);
        if (response.ok) {
          const data = (await response.json()) as { winner: WinnerData | null };
          if (data.winner) {
            setWinner(data.winner);
            // Find winner index to highlight it
            const winnerIndex = tickets.findIndex(
              (t) => t.ticketNumber === data.winner?.ticketNumber,
            );
            if (winnerIndex >= 0) {
              setHighlightedIndex(winnerIndex);
            }
          }
        }
      } catch (error) {
        console.error("Error checking for existing winner:", error);
      }
    }

    void checkExistingWinner();
  }, [eventId, tickets]);

  // Start the selection animation
  const startSelectionAnimation = useCallback(() => {
    if (tickets.length === 0) return;

    // Animation logic: rapidly cycle through highlighting different tickets
    let count = 0;
    const duration = 5000; // 5 seconds of animation
    const interval = 100; // Speed of cycling through tickets

    const animationTimer = setInterval(() => {
      count++;
      // Random index, avoiding the same index twice in a row
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * tickets.length);
      } while (nextIndex === highlightedIndex && tickets.length > 1);

      setHighlightedIndex(nextIndex);

      // End the animation after duration
      if (count * interval >= duration) {
        clearInterval(animationTimer);
      }
    }, interval);

    return animationTimer;
  }, [tickets, highlightedIndex]);

  // Admin function to trigger the winner selection
  const handleSelectWinner = async () => {
    if (!isAdmin || tickets.length === 0) return;

    try {
      // Start selection animation
      setIsSelecting(true);
      const animationTimer = startSelectionAnimation();

      // Call API to select the winner
      const response = await fetch("/api/eventParticipant/selectWinner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });
      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
      }

      const data = (await response.json()) as { winner: WinnerData };

      // After animation completes, show the winner
      setTimeout(() => {
        clearInterval(animationTimer);
        setWinner(data.winner);
        setIsSelecting(false);

        // Find the index of the winner ticket to highlight it
        const winnerIndex = tickets.findIndex(
          (t) => t.ticketNumber === data.winner.ticketNumber,
        );
        if (winnerIndex >= 0) {
          setHighlightedIndex(winnerIndex);
        }
      }, 5000); // Wait for animation to complete
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
      console.error("Error selecting winner:", error);
      setIsSelecting(false);
    }
  };

  // Function to refresh tickets
  const handleRefresh = () => {
    void fetchTickets();
  };

  if (isLoading && tickets.length === 0) {
    return (
      <div className="mx-auto my-8 w-full max-w-4xl p-4 text-center">
        <p className="text-xl">Loading tickets...</p>
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <div className="mx-auto my-8 w-full max-w-4xl p-4 text-center">
        <p className="text-xl text-red-500">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto my-8 w-full max-w-4xl p-4">
      <h2 className="mb-6 text-center text-2xl font-bold">
        {winner ? "🎉 Winner Selected! 🎉" : "Ticket Numbers"}
      </h2>

      {isAdmin && !isSelecting && !winner && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={handleSelectWinner}
            disabled={tickets.length === 0}
            className={`rounded-lg px-6 py-3 font-medium text-white shadow-lg ${
              tickets.length === 0
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {tickets.length === 0 ? "No Tickets Available" : "Select Winner"}
          </button>
        </div>
      )}

      {isSelecting && (
        <div className="mb-6 animate-pulse text-center text-xl">
          Selecting a winner...
        </div>
      )}

      {winner && (
        <div className="mb-8 rounded-xl border-2 border-yellow-400 bg-yellow-100 p-6 text-center">
          <h3 className="mb-2 text-xl font-medium">Congratulations!</h3>
          <div className="mb-2 text-3xl font-bold">{winner.name}</div>
          <div className="text-lg">
            Ticket Number:{" "}
            <span className="text-2xl font-bold">{winner.ticketNumber}</span>
          </div>
        </div>
      )}

      {tickets.length === 0 && !isLoading ? (
        <div className="text-center text-lg text-gray-500">
          No tickets available for this event.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {tickets.map((ticket, index) => (
            <motion.div
              key={ticket.ticketNumber}
              className={`relative rounded-lg border-2 p-4 text-center font-mono ${
                highlightedIndex === index
                  ? "border-yellow-500 bg-yellow-200 shadow-lg"
                  : "border-gray-200 bg-white"
              } ${
                winner && winner.ticketNumber === ticket.ticketNumber
                  ? "scale-110 transform ring-4 ring-green-500"
                  : ""
              } `}
              animate={
                highlightedIndex === index
                  ? {
                      scale: [1, 1.1, 1],
                      borderColor: ["#e5e7eb", "#eab308", "#e5e7eb"],
                    }
                  : {}
              }
            >
              <div className="truncate text-sm">{ticket.name}</div>
              <div className="text-lg font-bold">{ticket.ticketNumber}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
