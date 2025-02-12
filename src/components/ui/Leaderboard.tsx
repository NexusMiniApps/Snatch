"use client";
import React from "react";

export interface PlayerData {
  id: string;
  name: string;
  score: number;
}

interface LeaderboardProps {
  players: PlayerData[];
  currentPlayerId: string;
}

export function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  console.log('LIST OF PLAYER DATA', players);
  return (
    <div className="relative mb-6 flex w-full justify-center gap-x-4 rounded-lg">
      {players.map((player) => {
        const normalized =
          (player.score - Math.min(...players.map((p) => p.score))) /
          (Math.max(...players.map((p) => p.score)) -
            Math.min(...players.map((p) => p.score)));
        const adjustedNormalized = Math.pow(normalized, 1.5);
        const barHeight = Math.round(adjustedNormalized * 100);

        return (
          <div
            key={player.id}
            className="flex h-40 flex-col items-center justify-end"
          >
            <span
              className={`text-md font-medium ${
                player.id === currentPlayerId
                  ? "font-semibold text-red-500"
                  : "text-yellow-800"
              }`}
            >
              {player.name}
            </span>
            <span
              className={`text-md font-medium ${
                player.id === currentPlayerId
                  ? "font-semibold text-red-500"
                  : "text-yellow-800"
              }`}
            >
              {player.score}
            </span>
            {player.id === currentPlayerId && " (You)"}
            <div
              className={`w-8 rounded-t-lg ${
                player.id === currentPlayerId ? "bg-red-600" : "bg-yellow-900"
              }`}
              style={{ height: `${barHeight}%` }}
            ></div>
            <span
              className={`mt-2 text-xs ${
                player.id === currentPlayerId
                  ? "font-bold text-red-500"
                  : "text-gray-600"
              }`}
            >
              {player.id}
            </span>
          </div>
        );
      })}
      <div className="absolute bottom-6 w-72 border-t-2 border-black" />
    </div>
  );
}
