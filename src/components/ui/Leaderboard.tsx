"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface PlayerData {
  id: string;
  name: string;
  score: number;
  phone?: string;
}

interface LeaderboardProps {
  players: PlayerData[];
  currentPlayerId: string;
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

export function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Find current player's rank (0-based index)
  const currentPlayerRank = sortedPlayers.findIndex(
    (p) => p.id === currentPlayerId,
  );

  const getDisplayWindow = () => {
    if (sortedPlayers.length <= 7) {
      return sortedPlayers;
    }

    let windowStart = Math.max(0, currentPlayerRank - 3);

    if (windowStart + 7 > sortedPlayers.length) {
      windowStart = Math.max(0, sortedPlayers.length - 7);
    }

    if (currentPlayerRank < 3) {
      windowStart = 0;
    }

    return sortedPlayers.slice(windowStart, windowStart + 7);
  };

  const displayPlayers = getDisplayWindow();
  const maxScore = Math.max(...displayPlayers.map((p) => p.score));
  const minScore = Math.min(...displayPlayers.map((p) => p.score));
  const scoreRange = maxScore - minScore;

  // Adjust height calculation to max out at 80%
  const getBarHeight = (score: number) => {
    if (scoreRange === 0) return 80; // Cap at 80%

    // Scale scores to 80% max height
    const rawHeight = ((score - minScore) / scoreRange) * 80;

    // Ensure height is between 10% and 80%
    return Math.max(10, Math.min(80, Math.round(rawHeight)));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mt-6 text-center">
        <div className="flex w-full items-center justify-center text-center">
          <span className="custom-box flex items-center px-4 py-2 text-xl font-semibold text-gray-600">
            Score to Win:{"  "}
            <span className="pl-2 text-3xl font-bold">
              {sortedPlayers[4]?.score ?? 1}
            </span>
          </span>
        </div>

        <div className="mt-10 flex w-full flex-col items-center">
          <motion.div
            layout="position"
            className="flex h-48 w-full items-end justify-center gap-x-4"
          >
            <AnimatePresence mode="popLayout">
              {displayPlayers.map((player) => {
                const barHeight = getBarHeight(player.score);
                const playerRank =
                  sortedPlayers.findIndex((p) => p.id === player.id) + 1;

                return (
                  <motion.div
                    key={player.id}
                    layout="position"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      opacity: { duration: 0.2 },
                      layout: {
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      },
                    }}
                    className="min-w-[2.5rem] max-w-[3.5rem] flex-1"
                  >
                    <motion.div className="flex h-56 flex-col items-center justify-end">
                      <div
                        className={`flex items-baseline ${
                          player.id === currentPlayerId
                            ? "font-semibold text-red-500"
                            : "text-yellow-800"
                        }`}
                      >
                        <span className="text-lg">{playerRank}</span>
                        <span className="text-xs">
                          {getOrdinalSuffix(playerRank).slice(-2)}
                        </span>
                      </div>
                      <motion.div
                        className={`flex w-8 items-start justify-center rounded-t-lg ${
                          player.id === currentPlayerId
                            ? "bg-red-600"
                            : "bg-yellow-900"
                        } ${
                          playerRank <= 3 && players.length > 3
                            ? playerRank === 1
                              ? "gold-glow"
                              : playerRank === 2
                                ? "silver-glow"
                                : "bronze-glow"
                            : ""
                        }`}
                        initial={{ height: "10%" }}
                        animate={{
                          height: `${barHeight}%`,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        }}
                      >
                        <motion.span
                          className="mt-1 text-xs font-bold text-white"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: 1,
                          }}
                        >
                          {player.score}
                        </motion.span>
                      </motion.div>
                      <span
                        className={`mt-2 max-w-[3rem] truncate text-xs ${
                          player.id === currentPlayerId
                            ? "font-bold text-red-500"
                            : "text-gray-600"
                        }`}
                        title={player.name}
                      >
                        {player.name}
                      </span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
          <div className="absolute bottom-6 w-full border-t-2 border-black" />
        </div>
      </div>
    </div>
  );
}
