"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import PartySocket from "partysocket";
import { type EventData } from "~/lib/registrationUtils";
import { EVENT_IDS, GAME_SETTINGS } from "~/lib/settings";
import {
  fetchEvent,
  fetchUserTicket,
  checkPrerequisites,
  handleJoinGiveaway,
} from "~/lib/registrationUtils";

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

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface PartySocketContextType {
  socket: PartySocket | null;
  currentPlayerCount: number;
  setCurrentPlayerCount: (count: number) => void;
  currentPlayerId: string;
  players: PlayerData[];
  playerName: string;
  updatePlayerName: (name: string) => void;
  incrementScore: () => void;
  sendMessage: (message: string) => void;
  messages: ChatMessage[];
  
  // Game state
  isGameOver: boolean;
  setIsGameOver: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  eventData: EventData | null;
  socialAFollowed: boolean;
  setSocialAFollowed: (value: boolean) => void;
  socialBFollowed: boolean;
  setSocialBFollowed: (value: boolean) => void;
  ticketNumber: string | null;
  setTicketNumber: (value: string | null) => void;
  hasJoined: boolean;
  setHasJoined: (value: boolean) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  activeTab: "info" | "game" | "results";
  setActiveTab: (value: "info" | "game" | "results") => void;
  handleTimeUp: () => void;
  handleGameComplete: () => void;
}

const PartySocketContext = createContext<PartySocketContextType | undefined>(undefined);

interface PartySocketProviderProps {
  children: ReactNode;
  session?: AuthSession;
}

export function PartySocketProvider({ children, session }: PartySocketProviderProps) {
  // Socket related state
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [currentPlayerCount, setCurrentPlayerCount] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [playerName, setPlayerName] = useState<string>("BULLSHIT");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Game state
  const [isGameOver, setIsGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [socialAFollowed, setSocialAFollowed] = useState(false);
  const [socialBFollowed, setSocialBFollowed] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "game" | "results">("info");

  const eventId = EVENT_IDS.HUATZARD_EVENT;

  // USE EFFECT FOR EVENT DATA FETCH + TICKET FETCH
  useEffect(() => {
    void (async () => {
      try {
        // On component mount, load event data into state
        const data = await fetchEvent(eventId);
        setEventData(data);

        // If user is logged in, fetch their ticket and check prerequisites
        console.log("SESSION USER ID IS: ", session?.user?.id);
        if (session?.user?.id) {
          // Fetch user's ticket
          await fetchUserTicket(
            session.user.id,
            eventId,
            setTicketNumber,
            setHasJoined,
          );
          // Check prerequisites
          await checkPrerequisites(
            session.user.id,
            eventId,
            setSocialAFollowed,
            setSocialBFollowed,
          );
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user?.id, eventId]);

  // USE EFFECT FOR SOCIAL FOLLOW CHECK + JOIN GIVEAWAY
  useEffect(() => {
    // Check if both social accounts are followed
    if (socialAFollowed && socialBFollowed) {
      // Only call handleJoinGiveaway if user isn't already registered
      if (!hasJoined && session?.user?.id && eventData?.id) {
        console.log("Both socials followed - automatically joining giveaway");
        void handleJoinGiveaway(
          session.user.id,
          eventData.id,
          setIsLoading,
          setTicketNumber,
          setHasJoined,
        );
      }
    }
  }, [socialAFollowed, socialBFollowed]);

  const hasSnatchTimePassed = eventData
    ? new Date(eventData.snatchStartTime).getTime() +
        GAME_SETTINGS.SNATCH_TIME_BUFFER <
      Date.now()
    : false;

  const handleTimeUp = () => {
    if (hasSnatchTimePassed) {
      setActiveTab("info");
    } else {
      setActiveTab("info");
    }
  };

  const handleGameComplete = () => {
    setIsGameOver(true);
    setActiveTab("info");
  };

  // USE EFFECT FOR SOCKET CONNECTION
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
      return;
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
        message?: ChatMessage;
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
            message?: ChatMessage;
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
          setMessages((prev) => [...prev, data.message as ChatMessage]);
        }
      }
    });

    setSocket(partySocket);
    
    return () => {
      console.log("CLOSING SOCKET");
      partySocket.close();
    };
  }, [session, currentPlayerId]);

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

  const value = {
    // Socket related state
    socket,
    currentPlayerCount,
    setCurrentPlayerCount,
    currentPlayerId,
    players,
    playerName,
    updatePlayerName,
    incrementScore,
    sendMessage,
    messages,
    
    // Game state
    isGameOver,
    setIsGameOver,
    loading,
    error,
    eventData,
    socialAFollowed,
    setSocialAFollowed,
    socialBFollowed,
    setSocialBFollowed,
    ticketNumber,
    setTicketNumber,
    hasJoined,
    setHasJoined,
    isLoading,
    setIsLoading,
    activeTab,
    setActiveTab,
    handleTimeUp,
    handleGameComplete,
  };

  return (
    <PartySocketContext.Provider value={value}>
      {children}
    </PartySocketContext.Provider>
  );
}

export function usePartySocket() {
  const context = useContext(PartySocketContext);
  if (context === undefined) {
    throw new Error("usePartySocket must be used within a PartySocketProvider");
  }
  return context;
}
