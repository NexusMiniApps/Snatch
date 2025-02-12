"use client";

import { useEffect, useState } from "react";
import PartySocket from "partysocket";
import { unknown } from "zod";

const GENERIC_NAMES = [
  "ryan",
  "jan",
  "jo",
  "sx",
  "matt",
  "dan",
  "alex",
  "chris",
  "jeff",
  "zz",
  "yk",
];

export interface PlayerData {
  id: string;
  name: string;
  score: number;
}

export default function useGameSocket() {
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [currentPlayerCount, setCurrentPlayerCount] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [playerName, setPlayerName] = useState<string>("Anonymous");

  useEffect(() => {
    console.log("CONNECTING TO SOCKET");
    const host = process.env.NODE_ENV === 'production' 
      ? 'snatch-party.jolow99.partykit.dev'
      : 'localhost:1999';

    const partySocket = new PartySocket({
      host,
      room: "my-room",
    });

    // Pick a random name when connecting
    const randomName =
      GENERIC_NAMES[Math.floor(Math.random() * GENERIC_NAMES.length)];
    setPlayerName(randomName ?? "Anonymous");

    partySocket.addEventListener("open", () => {
      partySocket.send(
        JSON.stringify({ type: "updateName", name: randomName ?? "Anonymous" }),
      );
    });

    partySocket.addEventListener("message", (e) => {
      let data: { type: string; value?: number; state?: { connections: PlayerData[] }; id?: string } = { type: "" };

try {
  const messageData = e.data as string;
  const parsedData: unknown = JSON.parse(messageData);
  if (typeof parsedData === "object" && parsedData !== null && "type" in parsedData) {
    data = parsedData as { type: string; value?: number; state?: { connections: PlayerData[] }; id?: string };
  } else {
    console.error("Invalid data format:", parsedData);
    return;
  }
} catch (error) {
  console.error("Error parsing message:", error);
  return;
}

    
      if (data.type === "counter") {
        if (typeof data.value === 'number') {
          setCurrentPlayerCount(data.value);
        }
      } else if (data.type === "connection") {
        if (typeof data.id === 'string') {
          console.log("setting player id", data.id);
          setCurrentPlayerId(data.id);
          partySocket.send(
            JSON.stringify({
              type: "updateName",
              name: randomName ?? "Anonymous",
            })
          );
        }
      } else if (data.type === "state") {
        if (data.state && Array.isArray(data.state.connections)) {
          setPlayers(data.state.connections);
          const currentPlayer = data.state.connections.find(
            (p: PlayerData) => p.id === currentPlayerId
          );
          if (currentPlayer) {
            setPlayerName(currentPlayer.name);
          }
        }
      }
    });
    

    setSocket(partySocket);
    return () => {
      console.log("CLOSING SOCKET");
      partySocket.close();
    };
  }, []);

  const updatePlayerName = (name: string) => {
    if (socket && name.trim()) {
      socket.send(JSON.stringify({ type: "updateName", name: name.trim() }));
      setPlayerName(name);
    }
  };

  const incrementScore = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: "counter" }));
    }
  };

  return {
    socket,
    currentPlayerCount,
    setCurrentPlayerCount,
    currentPlayerId,
    players,
    playerName,
    updatePlayerName,
    incrementScore,
  };
}
