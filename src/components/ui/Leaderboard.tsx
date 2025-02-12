"use client";
import React from "react";

export interface Player {
    id: string;
    score: number;
}

interface LeaderboardProps {
    players: Player[];
    connectionId: string;
    myScore: number;
}

export default function Leaderboard({ players, connectionId, myScore }: LeaderboardProps) {
    // Update the current player's score with myScore.
    const updatedPlayers = players.map((player) =>
        player.id === connectionId ? { ...player, score: myScore } : player
    );

    // // Hardcoded array of players for testing.
    // const players = [
    //     { id: "Tom", score: 10 },
    //     { id: "Sasha", score: 15 },
    //     { id: "Julia", score: 5 },
    //     { id: "John", score: 8 },
    //     { id: "Peter", score: 12 },
    //     { id: "Alice", score: 14 },
    // ];

    // // Hardcoded current connection ID (simulating the logged-in player).
    // const connectionId = "Alice";

    // Sort players in ascending order by score.
    const sortedPlayers = [...players].sort((a, b) => a.score - b.score);

    // Find the maximum score among players (for scaling the bars).
    const maxScore = Math.max(...players.map((player) => player.score));
    const minScore = Math.min(...players.map((player) => player.score));

    return (
        <div className="relative flex gap-x-4 w-full justify-center rounded-lg mb-6">
            {sortedPlayers.map((player) => {
                const normalized = (player.score - minScore) / (maxScore - minScore);
                const adjustedNormalized = Math.pow(normalized, 1.5);
                const barHeight = Math.round(adjustedNormalized * 100);

                return (
                    <div key={player.id} className="flex flex-col items-center justify-end h-40">
                        <span
                            className={`text-md font-medium ${player.id === connectionId
                                ? "font-semibold text-red-500"
                                : "text-yellow-800"
                                }`}
                        >
                            {player.score}
                        </span>
                        <div
                            className={`w-8 rounded-t-lg ${player.id === connectionId ? "bg-red-600" : "bg-yellow-900"
                                }`}
                            style={{ height: `${barHeight}%` }}
                        ></div>
                        <span
                            className={`mt-2 text-xs ${player.id === connectionId
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
