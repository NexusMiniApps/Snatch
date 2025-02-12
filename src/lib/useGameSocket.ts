"use client";

import { useEffect, useState } from "react";
import PartySocket from "partysocket";

export type Player = { id: string; score: number };

interface SocketMessage {
  type: string;
  value?: number;
  id?: string;
  state?: Player[];
}

export default function useGameSocket() {
    const [socket, setSocket] = useState<PartySocket | null>(null);
    const [count, setCount] = useState(0);
    const [connectionId, setConnectionId] = useState<string>("");
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        const ws = new PartySocket({
            host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
            room: "game",
        });
        setSocket(ws);

        ws.addEventListener("message", (event: MessageEvent<string>) => {
            const message = JSON.parse(event.data) as SocketMessage;
            if (message.type === "count") {
                setCount(message.value ?? 0);
            } else if (message.type === "connection") {
                setConnectionId(message.id ?? '');
            } else if (message.type === "state") {
                setPlayers(message.state ?? []);
            }
        });

        return () => {
            ws.close();
        };
    }, []);

    return { socket, count, connectionId, players, setCount };
}
