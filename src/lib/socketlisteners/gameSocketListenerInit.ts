import type PartySocket from "partysocket";
import type { SocketMessage } from "~/types/socket";
import type { ChatMessage, PlayerData } from "~/PartySocketContext";

interface SocketMessageHandlerParams {
  socket: PartySocket;
  setCurrentPlayerCount: (count: number) => void;
  currentPlayerId: string;
  setPlayers: (players: PlayerData[]) => void;
  setPlayerName: (name: string) => void;
  setMessages: (cb: (prev: ChatMessage[]) => ChatMessage[]) => void;
}

export function gameSocketListenerInit({
  socket,
  setCurrentPlayerCount,
  currentPlayerId,
  setPlayers,
  setPlayerName,
  setMessages,
}: SocketMessageHandlerParams) {
  socket.addEventListener("message", (e) => {
    let data: SocketMessage = { type: "" };

    try {
      const messageData = e.data as string;
      const parsedData: unknown = JSON.parse(messageData);
      if (
        typeof parsedData === "object" &&
        parsedData !== null &&
        "type" in parsedData
      ) {
        data = parsedData as SocketMessage;
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
    } else if (data.type === "chat") {
      if ('message' in data && data.message) {
        setMessages((prev) => [...prev, data.message!]);
      }
    }
  });
} 