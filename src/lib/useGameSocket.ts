"use client";

import { useEffect, useState } from "react";
import PartySocket from "partysocket";

export type Player = { id: string; score: number };

export default function useGameSocket() {
    const [socket, setSocket] = useState<PartySocket | null>(null);
    const [count, setCount] = useState(0);
    const [connectionId, setConnectionId] = useState<string>("");
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        const partySocket = new PartySocket({
            host: "localhost:1999",
            room: "my-room",
        });

        partySocket.addEventListener("message", (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "counter") {
                setCount(data.value);
            } else if (data.type === "connection") {
                setConnectionId(data.id);
            } else if (data.type === "state") {
                setPlayers(data.state.connections);
            }
        });

        setSocket(partySocket);
        return () => {
            partySocket.close();
        };
    }, []);

    return { socket, count, connectionId, players, setCount };
}
