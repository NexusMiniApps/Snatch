"use client";

import React from "react";
import { useRouter } from "next/navigation";
import LeaderboardTable, { Player } from "~/components/ui/LeaderboardTable";
import Image from "next/image";

const imageSlug = "/images/coffee.jpeg";

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



    const lightVibrant = "#ffffff";

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 p-6 gap-y-2">

            <section className="border-solid border-2 border-black rounded-xl p-1 bg-white w-full h-60 max-w-96 z-10 shadow-xl">
                <div className="relative rounded-xl w-full h-full">
                    <Image
                        className="object-cover rounded-lg"
                        src={imageSlug}
                        alt="Brewed Coffee"
                        fill
                    />
                </div>
            </section>


            <section className="relative flex flex-col w-full px-2 max-w-96 py-2">
                <div
                    style={{
                        backgroundColor: lightVibrant,

                    }}
                    className="absolute top-[-4rem] bottom-[-3.5rem] left-[-1.5rem] right-[-1.5rem] pointer-events-none border-y-2 border-black"
                />
                <div className="z-10 flex flex-col w-full gap-y-4 px-2  max-w-96">
                    <LeaderboardTable players={players} connectionId={connectionId} />
                </div>

            </section>

            <section className="w-full flex flex-col items-center max-w-96 z-10 custom-box py-4  ">
                {
                    myRank >= 0 && myRank < 3 ? (
                        <>
                            <h1 className="text-3xl z-10 ">
                                You won the Snatch!
                            </h1>
                        </>
                    ) : (
                        <h1 className="text-4xl font-bold">
                            Game Over! Better luck next time.
                        </h1>
                    )
                }


            </section>





        </div >
    );
}
