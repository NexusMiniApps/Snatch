"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface PlayerData {
  id: string;
  name: string;
  score: number;
}

interface LeaderboardProps {
  players: PlayerData[];
  currentPlayerId: string;
}

interface BarComponentProps {
  player: PlayerData;
  barHeight: number;
  currentPlayerId: string;
  rank: number;
  totalPlayers: number;
}

const getOrdinalSuffix = (rank: number) => {
  const j = rank % 10,
    k = rank % 100;
  if (j === 1 && k !== 11) {
    return `${rank}st`;
  }
  if (j === 2 && k !== 12) {
    return `${rank}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${rank}rd`;
  }
  return `${rank}th`;
};

const BarComponent = ({
  player,
  barHeight,
  currentPlayerId,
  rank,
  totalPlayers,
}: BarComponentProps) => {
  const isTop3 = rank <= 3 && totalPlayers > 3;
  const glowColor =
    rank === 1 ? "gold-glow" : rank === 2 ? "silver-glow" : "bronze-glow";

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex h-56 flex-col items-center justify-end`}
    >
      <motion.span
        layout
        className={`flex items-baseline ${
          player.id === currentPlayerId
            ? "font-semibold text-red-500"
            : "text-yellow-800"
        }`}
      >
        <span className="text-lg">{rank}</span>
        <span className="text-xs">{getOrdinalSuffix(rank).slice(-2)}</span>
      </motion.span>
      <motion.div
        layout
        id={`bar-${player.id}`}
        className={`flex w-8 items-start justify-center rounded-t-lg ${
          player.id === currentPlayerId ? "bg-red-600" : "bg-yellow-900"
        } ${isTop3 ? glowColor : ""}`}
        style={{
          height: `${Math.max(barHeight, 10)}%`,
        }}
      >
        <span className="mt-1 text-xs font-bold text-white">
          {player.score}
        </span>
      </motion.div>
      <motion.span
        layout
        className={`mt-2 text-xs ${
          player.id === currentPlayerId
            ? "font-bold text-red-500"
            : "text-gray-600"
        }`}
      >
        {player.name}
      </motion.span>
    </motion.div>
  );
};

export function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  // Sort players by score in descending order to get top 3
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentIndex = sortedPlayers.findIndex((p) => p.id === currentPlayerId);

  let displayPlayers: PlayerData[] = [];

  // Always include the top 3 players
  const top3 = sortedPlayers.slice(0, 3);

  if (sortedPlayers.length <= 8) {
    // If 8 or fewer players, show all
    displayPlayers = sortedPlayers;
  } else {
    // Determine the window around the current player
    let windowStart = Math.max(3, currentIndex - 2);
    let windowEnd = Math.min(sortedPlayers.length, windowStart + 5);

    // Adjust window to try to show 5 players when possible
    if (windowEnd - windowStart < 5) {
      windowStart = Math.max(3, windowEnd - 5);
    }

    const windowPlayers = sortedPlayers.slice(windowStart, windowEnd);

    // Combine top 3 and window players, remove duplicates
    displayPlayers = Array.from(new Set([...windowPlayers, ...top3]));

    // If we have less than 8 players, add more sequentially from where the window ends
    if (displayPlayers.length < 8) {
      const existingIds = new Set(displayPlayers.map((p) => p.id));
      const nextPlayers = sortedPlayers
        .slice(windowEnd) // Start from where the window ended
        .filter((p) => !existingIds.has(p.id)) // Filter out players we already have
        .slice(0, 8 - displayPlayers.length); // Take only what we need to reach 8

      displayPlayers = [...displayPlayers, ...nextPlayers];
    }

    // Sort the final display players in ascending order
    displayPlayers = displayPlayers.sort((a, b) => a.score - b.score);
  }

  return (
    <div className="relative mt-8 flex w-full justify-center rounded-lg">
      <motion.div layout className="flex gap-x-4">
        <AnimatePresence>
          {displayPlayers.map((player, index) => {
            const maxScore = Math.max(...players.map((p) => p.score));
            const minScore = Math.min(...players.map((p) => p.score));
            const scoreRange = maxScore - minScore || 1; // Avoid division by zero
            const minHeight = 10; // Minimum height for visibility
            const barHeight = Math.max(
              minHeight,
              ((player.score - minScore) / scoreRange) * (100 - minHeight) +
                minHeight,
            );

            // Check if there's a break between the current player and the next top 3
            const isBreak =
              index < displayPlayers.length - 1 &&
              displayPlayers[index + 1].rank <= 3 &&
              player.rank > 3;

            return (
              <React.Fragment key={player.id}>
                <BarComponent
                  player={player}
                  barHeight={barHeight}
                  currentPlayerId={currentPlayerId}
                  rank={sortedPlayers.findIndex((p) => p.id === player.id) + 1}
                  totalPlayers={players.length} // Pass total number of players
                />
                {isBreak && (
                  <div className="flex w-6 items-center justify-center">
                    <div className="h-24 w-1 bg-blue-500"></div>{" "}
                    {/* Enhanced vertical line as a separator */}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </motion.div>
      <div className="absolute bottom-6 w-full border-t-2 border-black" />
    </div>
  );
}
