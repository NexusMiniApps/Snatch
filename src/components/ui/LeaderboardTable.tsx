"use client";
import React from "react";

export interface Player {
  id: string;
  name: string;
  score: number;
}

interface LeaderboardTableProps {
  players: Player[];
  connectionId: string;
}

export default function LeaderboardTable({
  players,
  connectionId,
}: LeaderboardTableProps) {
  // Sort players in descending order (highest score first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentIndex = sortedPlayers.findIndex((p) => p.id === connectionId);

  interface Row {
    player: Player;
    rank: number;
  }

  let displayRows: Row[] = [];
  let topEllipsis = false;
  const bottomEllipsis = false;

  if (sortedPlayers.length <= 8 || currentIndex < 8) {
    // If there are 10 or fewer players or the current player is in the top 10,
    // simply show the top 10.
    displayRows = sortedPlayers
      .slice(0, Math.min(8, sortedPlayers.length))
      .map((player, idx) => ({ player, rank: idx + 1 }));
  } else {
    // Otherwise, show the top 3 plus a window of 7 players that includes the current player.
    const top3 = sortedPlayers.slice(0, 3).map((player, idx) => ({
      player,
      rank: idx + 1,
    }));

    // Determine a window of 7 rows that includes the current player's row.
    let windowStart = currentIndex - 2; // try to center current player's row
    if (windowStart < 3) windowStart = 3; // ensure window starts after the top 3
    let windowEnd = windowStart + 5;
    if (windowEnd > sortedPlayers.length) {
      windowEnd = sortedPlayers.length;
      windowStart = Math.max(3, windowEnd - 5);
    }
    const windowRows = sortedPlayers
      .slice(windowStart, windowEnd)
      .map((player, idx) => ({ player, rank: windowStart + idx + 1 }));

    // Determine if we need ellipsis rows.
    if (windowStart > 3) {
      topEllipsis = true;
    }
    // if (windowEnd < sortedPlayers.length) {
    //     bottomEllipsis = true;
    // }

    displayRows = [...top3];
    if (topEllipsis) {
      displayRows.push({ player: { id: "...", name: "", score: 0 }, rank: -1 });
    }
    displayRows = displayRows.concat(windowRows);
    if (bottomEllipsis) {
      displayRows.push({ player: { id: "...", name: "", score: 0 }, rank: -1 });
    }
  }

  return (
    <div className="mb-2 overflow-x-auto">
      <table className="w-full min-w-full table-fixed border-collapse">
        <colgroup>
          <col style={{ width: "15%" }} />
          <col style={{ width: "60%" }} />
          <col style={{ width: "25%" }} />
        </colgroup>
        <thead>
          <tr>
            <th className="border-b border-black px-4 pb-2 text-left" />
            <th className="border-b border-black px-4 pb-2 text-left">
              Player
            </th>
            <th className="border-b border-black px-4 pb-2 text-left">Score</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => {
            if (row.rank === -1) {
              return (
                <tr key={`ellipsis-${index}`}>
                  <td
                    colSpan={3}
                    className="border-b border-black px-4 py-2 text-center"
                  >
                    ...
                  </td>
                </tr>
              );
            }
            return (
              <tr
                key={row.player.id}
                className={`${row.player.id === connectionId ? "font-bold text-blue-600" : "text-gray-800"}`}
              >
                <td className="border-b border-black px-4 pb-1 pt-2">
                  {row.rank}
                </td>
                <td className="truncate border-b border-black px-4 pb-1 pt-2">
                  {row.player.name || row.player.id}
                </td>
                <td className="border-b border-black px-4 pb-1 pt-2">
                  {row.player.score}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
