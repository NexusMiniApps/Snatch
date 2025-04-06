import type PartySocket from "partysocket";
import type { SocketMessage } from "~/types/socket";
import type { ChatMessage, PlayerData } from "~/PartySocketContext";

interface SocketMessageHandlerParams {
  socket: PartySocket;
  setCurrentPlayerCount: (count: number) => void;
  currentPlayerId: string;
  setPlayers: (
    players: PlayerData[] | ((prev: PlayerData[]) => PlayerData[]),
  ) => void;
  setPlayerName: (name: string) => void;
  setMessages: (cb: (prev: ChatMessage[]) => ChatMessage[]) => void;
  setIsGameActive?: (isActive: boolean) => void;
  setTimeRemaining?: (timeRemaining: number) => void;
  setGamePhase?: (phase: "waiting" | "active" | "gameover") => void;
  setIsGameOver?: (isGameOver: boolean) => void;
}

export function gameSocketListenerInit({
  socket,
  setCurrentPlayerCount,
  currentPlayerId,
  setPlayers,
  setPlayerName,
  setMessages,
  setIsGameActive,
  setTimeRemaining,
  setGamePhase,
  setIsGameOver,
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

        // Update the player's score in the players array
        setPlayers((prevPlayers: PlayerData[]) => {
          // Create a deep copy of the players array to avoid reference issues
          const updatedPlayers = [...prevPlayers];
          const playerIndex = updatedPlayers.findIndex(
            (p) => p.id === currentPlayerId,
          );

          if (playerIndex >= 0) {
            // Create a new player object with all required properties
            const updatedPlayer: PlayerData = {
              id: updatedPlayers[playerIndex]!.id,
              name: updatedPlayers[playerIndex]!.name,
              score: data.value!,
            };

            // Replace the player in the array
            updatedPlayers[playerIndex] = updatedPlayer;

            // Log the update for debugging
            console.log("Updated player score:", updatedPlayer);
            console.log("Updated players array:", updatedPlayers);
          } else {
            console.warn("Player not found in players array:", currentPlayerId);
          }

          return updatedPlayers;
        });
      }
    } else if (data.type === "connection") {
      if (typeof data.id === "string") {
        console.log("Player ID from Server is: ", data.id);
      }
    } else if (data.type === "state") {
      if (data.state && Array.isArray(data.state.connections)) {
        // Log the state update for debugging
        console.log(
          "Received state update with connections:",
          data.state.connections,
        );

        setPlayers(data.state.connections);
        const currentPlayer = data.state.connections.find(
          (p: PlayerData) => p.id === currentPlayerId,
        );
        if (currentPlayer) {
          setPlayerName(currentPlayer.name);
        }
      }
    } else if (data.type === "chat") {
      if ("message" in data && data.message) {
        setMessages((prev) => {
          // Check if message already exists
          const messageExists = prev.some(msg => msg.id === data.message!.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, data.message!];
        });
      }
    } else if (data.type === "gameState" && data.gameState) {
      if (setIsGameActive) {
        setIsGameActive(data.gameState.isActive);
      }
      if (setTimeRemaining) {
        setTimeRemaining(data.gameState.timeRemaining);
      }
      if (setGamePhase) {
        setGamePhase(data.gameState.phase);
      }
      if (setIsGameOver && data.gameState.phase === "gameover") {
        setIsGameOver(true);
      }
    } else if (data.type === "updateGameState" && data.snatchStartTime) {
      console.log(
        "Received updateGameState message with new snatch start time:",
        data.snatchStartTime,
      );

      // Calculate the current game phase based on the new snatch start time
      const now = Date.now();
      const newSnatchStartTime = new Date(data.snatchStartTime).getTime();
      const gameDuration = 60000; // 1 minute in milliseconds

      if (now < newSnatchStartTime) {
        // Game hasn't started yet
        if (setGamePhase) setGamePhase("waiting");
        if (setIsGameActive) setIsGameActive(false);
        if (setTimeRemaining) setTimeRemaining(60);
        if (setIsGameOver) setIsGameOver(false);
      } else if (
        now >= newSnatchStartTime &&
        now < newSnatchStartTime + gameDuration
      ) {
        // Game is active
        const remainingTime = Math.max(
          0,
          Math.ceil((newSnatchStartTime + gameDuration - now) / 1000),
        );
        if (setGamePhase) setGamePhase("active");
        if (setIsGameActive) setIsGameActive(true);
        if (setTimeRemaining) setTimeRemaining(remainingTime);
        if (setIsGameOver) setIsGameOver(false);
      } else {
        // Game is over
        if (setGamePhase) setGamePhase("gameover");
        if (setIsGameActive) setIsGameActive(false);
        if (setTimeRemaining) setTimeRemaining(0);
        if (setIsGameOver) setIsGameOver(true);
      }
    }
  });
}
