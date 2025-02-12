"use client";
import React from "react";
import { useRouter } from "next/navigation";
import LeaderboardTable, { Player } from "~/components/ui/LeaderboardTable";

export default function ResultsPage() {
    const router = useRouter();

    // Hardcoded final players list for testing.
    const players: Player[] = [
        { id: "John", score: 50 },
        { id: "Alice", score: 40 },
        { id: "Sasha", score: 40 },
        { id: "Tom", score: 30 },
        { id: "Julia", score: 20 },
        { id: "Peter", score: 15 },
        { id: "Mike", score: 10 },
        { id: "Eve", score: 7 },
        { id: "Lindsey", score: 30 },
        { id: "Julie", score: 20 },
        { id: "Pam", score: 15 },
        { id: "Mikey", score: 10 },
        { id: "Evee", score: 6 },
        { id: "Ethan", score: 30 },
        { id: "Julianna", score: 20 },
        { id: "Peta", score: 15 },
        { id: "Mika", score: 10 },
        { id: "Eva", score: 5 },
        // Add more players if needed.
    ];

    // Hardcoded current player's ID.
    const connectionId = "Alice";

    // Determine ranking by sorting in descending order.
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const myRank = sortedPlayers.findIndex(player => player.id === connectionId);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            {myRank >= 0 && myRank < 3 ? (
                <>
                    <h1 className="text-3xl ">
                        You won the Snatch!
                    </h1>
                </>
            ) : (
                <h1 className="text-4xl font-bold">
                    Game Over! Better luck next time.
                </h1>
            )}

            <LeaderboardTable players={players} connectionId={connectionId} />

        </div>
    );
}
