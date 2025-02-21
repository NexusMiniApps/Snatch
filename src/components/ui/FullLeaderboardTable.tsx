import { type PlayerData } from "./Leaderboard";
import { useState, useEffect } from "react";

interface FullLeaderboardTableProps {
  players: PlayerData[];
  currentPlayerId: string;
}

export default function FullLeaderboardTable({
  players,
  currentPlayerId,
}: FullLeaderboardTableProps) {
  // Initialize from localStorage if available
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("selectedPlayers");
      if (saved) {
        const parsed = JSON.parse(saved) as {
          timestamp?: number;
          selected: string[];
        };
        // Check if the saved data is not too old (e.g., 30 minutes)
        if (
          parsed.timestamp &&
          Date.now() - parsed.timestamp < 30 * 60 * 1000
        ) {
          return new Set(parsed.selected);
        }
      }
      return new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    const dataToSave = {
      selected: Array.from(selectedPlayers),
      timestamp: Date.now(),
    };
    localStorage.setItem("selectedPlayers", JSON.stringify(dataToSave));
  }, [selectedPlayers]);

  const handleCheckboxChange = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "-";
    // Format as +XX XXXX XXXX
    const countryCode = phone.slice(0, 2);
    const mainNumber = phone.slice(2);
    return `+${countryCode} ${mainNumber.slice(0, 4)} ${mainNumber.slice(4)}`;
  };

  // Clear old selections
  useEffect(() => {
    const clearOldSelections = () => {
      try {
        const saved = localStorage.getItem("selectedPlayers");
        if (saved) {
          const parsed = JSON.parse(saved) as {
            timestamp?: number;
            selected: string[];
          };
          if (
            parsed.timestamp &&
            Date.now() - parsed.timestamp > 30 * 60 * 1000
          ) {
            localStorage.removeItem("selectedPlayers");
            setSelectedPlayers(new Set());
          }
        }
      } catch {
        // If there's any error, clear the storage
        localStorage.removeItem("selectedPlayers");
      }
    };

    clearOldSelections();
    // Check every minute
    const interval = setInterval(clearOldSelections, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl overflow-x-auto">
      <table className="w-full min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-b border-gray-300 px-4 py-2 text-center">
              ✓
            </th>
            <th className="border-b border-gray-300 px-4 py-2 text-left">
              Rank
            </th>
            <th className="border-b border-gray-300 px-4 py-2 text-left">
              Player
            </th>
            <th className="border-b border-gray-300 px-4 py-2 text-left">
              Phone
            </th>
            <th className="border-b border-gray-300 px-4 py-2 text-right">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <tr
              key={player.id}
              className={`${
                player.id === currentPlayerId
                  ? "bg-blue-50 font-semibold text-blue-600"
                  : "text-gray-800"
              } hover:bg-gray-50`}
            >
              <td className="border-b border-gray-200 px-4 py-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedPlayers.has(player.id)}
                  onChange={() => handleCheckboxChange(player.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td className="border-b border-gray-200 px-4 py-2">
                {index + 1}
              </td>
              <td className="border-b border-gray-200 px-4 py-2">
                {player.name}
              </td>
              <td className="border-b border-gray-200 px-4 py-2 font-mono">
                {formatPhoneNumber(player.phone ?? "")}
              </td>
              <td className="border-b border-gray-200 px-4 py-2 text-right">
                {player.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-sm text-gray-600">
        Selected: {selectedPlayers.size} players
      </div>
    </div>
  );
}
