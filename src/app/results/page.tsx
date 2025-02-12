"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import Leaderboard, { Player } from "~/components/ui/Leaderboard";

export default function ResultsPage() {
    const router = useRouter();
    // For demonstration, we hardcode a final players list.
    const [players, setPlayers] = useState<Player[]>([
        { id: "John", score: 50 },
        { id: "Alice", score: 45 },
        { id: "Sasha", score: 40 },
        { id: "Tom", score: 30 },
        { id: "Julia", score: 20 },
    ]);

    // Hardcoded current player's ID.
    const connectionId = "Alice";

    // Determine ranking by sorting in descending order.
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const myRank = sortedPlayers.findIndex(player => player.id === connectionId);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            {myRank >= 0 && myRank < 3 ? (
                <h1 className="text-4xl font-bold text-green-700 mb-4">Congratulations! You're a Winner!</h1>
            ) : (
                <h1 className="text-4xl font-bold text-red-600 mb-4">Game Over! Better luck next time.</h1>
            )}

            <Leaderboard players={players} connectionId={connectionId} myScore={players.find(p => p.id === connectionId)?.score || 0} />

            <button
                className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg"
                onClick={() => router.push("/")}
            >
                Return Home
            </button>
        </div>
    );
}
