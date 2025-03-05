"use client";

import { useEffect, useState } from "react";
import PartySocket from "partysocket";
import { set, unknown } from "zod";

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

type AuthSession = {
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    phoneNo: bigint;
    countryCode: bigint;
    verified: boolean;
  };
};

export interface PlayerData {
  id: string;
  name: string;
  score: number;
}

export default function useGameSocket(session?: AuthSession) {
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [currentPlayerCount, setCurrentPlayerCount] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [playerName, setPlayerName] = useState<string>("BULLSHIT");

  useEffect(() => {

    if (session === undefined) {
      console.log("DONT CONNECT TO SOCKET");
      return;
    }

    console.log("CONNECTING TO SOCKET");
    const host =
      process.env.NODE_ENV === "production"
        ? "https://snatch-party.zhizhangt.partykit.dev"
        : "localhost:1999";

    // Check if session exists
    console.log("Current Session is: ", session);

    const playerId = session?.user?.id ?? "";

    if (playerId === "") {
      console.log("No player ID found");
      return;
    }

    console.log("Current Player ID is: ", playerId);
    setCurrentPlayerId(playerId);
    
    const partySocket = new PartySocket({
      host,
      room: "my-room",
      id: playerId,
    });

    let userName;

    if (session.user) {
      userName = session.user.name;
    } else {
      return
    }

    setPlayerName(userName);

    partySocket.addEventListener("open", () => {
      partySocket.send(JSON.stringify({ type: "updateName", name: userName }));
    });

    partySocket.addEventListener("message", (e) => {
      let data: {
        type: string;
        value?: number;
        state?: { connections: PlayerData[] };
        id?: string;
      } = { type: "" };

      try {
        const messageData = e.data as string;
        const parsedData: unknown = JSON.parse(messageData);
        if (
          typeof parsedData === "object" &&
          parsedData !== null &&
          "type" in parsedData
        ) {
          data = parsedData as {
            type: string;
            value?: number;
            state?: { connections: PlayerData[] };
            id?: string;
          };
        } else {
          console.error("Invalid data format:", parsedData);
          return;
        }
      } catch (error) {
        console.error("Error parsing message:", error);
        return;
      }

      if (data.type === "counter") {
        if (typeof data.value === "number") {
          setCurrentPlayerCount(data.value);
        }
      } else if (data.type === "connection") {
        if (typeof data.id === "string") {
          console.log("Player ID from Server is: ", data.id);
          // setCurrentPlayerId(data.id);
          // I dont think need to update name here as we set it on connection? leaving it commented out for now

          // partySocket.send(
          //   JSON.stringify({
          //     type: "updateName",
          //     name: randomName ?? "Anonymous",
          //   }),
          // );
        }
      } else if (data.type === "state") {
        if (data.state && Array.isArray(data.state.connections)) {
          setPlayers(data.state.connections);
          const currentPlayer = data.state.connections.find(
            (p: PlayerData) => p.id === currentPlayerId,
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

  const sendMessage = (message: string) => {
    if (socket && message.trim()) {
      socket.send(JSON.stringify({
        type: "chat",
        text: message.trim(),
      }));
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
    sendMessage,
  };
}
