"use client";

import { useState } from "react";
import CountdownTimer from "~/components/ui/countdown";
import Link from "next/link";

export default function CountdownDisplay({ countdownDate }: { countdownDate: string }) {
    const initialTimeIsUp = new Date(countdownDate).getTime() - Date.now() <= 0;
    const [timeIsUp, setTimeIsUp] = useState(initialTimeIsUp);

    const handleTimeUp = () => {
        setTimeIsUp(true);
    };

    return (
        <section className="w-full flex flex-col items-center max-w-96 rounded-xl shadow-lg">
            {!timeIsUp && (

                <div className="w-full custom-box p-1">
                    <div className="flex w-full rounded-xl bg-gray-100 items-center justify-between">
                        <div className="flex flex-1 text-lg font-medium justify-center">
                            Snatch! starts in
                        </div>
                        <div className="flex px-4 py-3 text-4xl justify-center font-medium bg-gray-800 text-white rounded-lg w-48">
                            <CountdownTimer targetDate={countdownDate} onTimeUp={handleTimeUp} />
                        </div>
                    </div>
                </div>

            )}

            {/* If the countdown hits 0, show a different UI */}
            {timeIsUp && (
                <Link href="gamepage" className="w-full custom-box p-1">
                    <div className="flex py-3 px-4 w-full text-4xl font-medium text-white rounded-xl bg-gray-800 items-center justify-center">
                        Snatch!
                    </div>
                </Link>
            )}
        </section>
    );
}
