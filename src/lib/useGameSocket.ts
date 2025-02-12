"use client";

import { useEffect, useState } from "react";
import PartySocket from "partysocket";

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
    const partySocket = new PartySocket({
      host: "localhost:1999",
      room: "my-room",
    });

    // Pick a random name when connecting
    const randomName =
      GENERIC_NAMES[Math.floor(Math.random() * GENERIC_NAMES.length)];
    setPlayerName(randomName || "Anonymous");

    partySocket.addEventListener("open", () => {
      partySocket.send(
        JSON.stringify({ type: "updateName", name: randomName || "Anonymous" }),
      );
    });

    partySocket.addEventListener("message", (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "counter") {
        setCurrentPlayerCount(data.value);
      } else if (data.type === "connection") {
        console.log("setting player id", data.id);
        setCurrentPlayerId(data.id);
        // Send name update right after getting our ID
        partySocket.send(
          JSON.stringify({
            type: "updateName",
            name: randomName || "Anonymous",
          }),
        );
      } else if (data.type === "state") {
        setPlayers(data.state.connections);
        // Update local player name if it exists in the state
        const currentPlayer = data.state.connections.find(
          (p: PlayerData) => p.id === currentPlayerId,
        );
        if (currentPlayer) {
          setPlayerName(currentPlayer.name);
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
