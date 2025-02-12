"use client";

import { useEffect, useState } from "react";
import PartySocket from "partysocket";

// Define the types for the incoming data structure
export type Player = { id: string; score: number };

// Define the structure of the event data
interface GameMessage {
    type: string;
    value?: number;
    id?: string;
    state?: { connections: Player[] };
}

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

        partySocket.addEventListener("message", (e: MessageEvent) => {
            // Parse the event data and cast it to the GameMessage type
            const data: GameMessage = JSON.parse(e.data) as GameMessage;

            // Handle different message types based on the "type" field
            if (data.type === "counter" && data.value !== undefined) {
                setCount(data.value ?? 0);
            } else if (data.type === "connection" && data.id) {
                setConnectionId(data.id ?? "");
            } else if (data.type === "state" && data.state) {
                setPlayers(data.state.connections ?? []);
            }
        });

        setSocket(partySocket);
        return () => {
            partySocket.close();
        };
    }, []);

    return { socket, count, connectionId, players, setCount };
}
