"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import PartySocket from "partysocket";
import { type EventData } from "~/lib/registrationUtils";
import { EVENT_IDS, GAME_SETTINGS, EVENT_TYPE } from "~/lib/settings";
import {
  fetchEvent,
  fetchUserTicket,
  checkPrerequisites,
  handleJoinGiveaway,
} from "~/lib/registrationUtils";
import { gameSocketListenerInit } from "~/lib/socketlisteners/gameSocketListenerInit";
import { chosenSocketListenerInit } from "~/lib/socketlisteners/chosenSocketListenerInit";
import { randomSocketListenerInit } from "~/lib/socketlisteners/randomSocketListenerInit";

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

export interface Comment {
  id: string;
  text: string;
  username: string;
  profilePicture?: string;
  score: number;
  tags?: string[];
}

interface PartySocketContextType {
  socket: PartySocket | null;
  currentPlayerCount: number;
  setCurrentPlayerCount: (count: number) => void;
  currentPlayerId: string;
  players: PlayerData[];
  playerName: string;
  incrementScore: () => void;
  sendMessage: (message: string) => void;
  messages: ChatMessage[];

  // Socials
  socialAFollowed: boolean;
  setSocialAFollowed: (value: boolean) => void;
  socialBFollowed: boolean;
  setSocialBFollowed: (value: boolean) => void;

  // Random
  ticketNumber: string | null;
  setTicketNumber: (value: string | null) => void;
  hasJoined: boolean;
  setHasJoined: (value: boolean) => void;

  // Chosen
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  votedComments: Set<string>;
  setVotedComments:  React.Dispatch<React.SetStateAction<Set<string>>>;
  isLoadingChosen: boolean;
  setIsLoadingChosen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Game state
  isGameOver: boolean;
  setIsGameOver: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  eventData: EventData | null;
  handleTimeUp: () => void;
  handleGameComplete: () => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
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

  // Random State

  // Chosen State
  const [comments, setComments] = useState<Comment[]>([]);
  const [votedComments, setVotedComments] = useState<Set<string>>(new Set());
  const [isLoadingChosen, setIsLoadingChosen] = useState(true);

  // USE EFFECT FOR EVENT DATA FETCH + TICKET FETCH
  useEffect(() => {
    void (async () => {
      try {
        // On component mount, load event data into state
        const data = await fetchEvent();
        setEventData(data);

        // Use the fetched event's ID for subsequent calls
        const fetchedEventId = data.id;

        // If user is logged in, fetch their ticket and check prerequisites
        console.log("SESSION USER ID IS: ", session?.user?.id);
        if (session?.user?.id && fetchedEventId) {
          // Fetch user's ticket
          await fetchUserTicket(
            session.user.id,
            fetchedEventId,
            setTicketNumber,
            setHasJoined,
          );
          // Check prerequisites
          await checkPrerequisites(
            session.user.id,
            fetchedEventId,
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
  }, [session?.user?.id]);

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

    const eventType = EVENT_TYPE.CHOSEN;
    console.log("Event Type is: ", eventType);
    
    const partySocket = new PartySocket({
      host,
      room: "my-room",
      party: eventType,
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

    if (eventType === "game") {
      gameSocketListenerInit({
        socket: partySocket,
        setCurrentPlayerCount,
        currentPlayerId,
        setPlayers,
        setPlayerName,
        setMessages,
      });
    } else if (eventType === "chosen") {
      chosenSocketListenerInit({
        socket: partySocket,
        setComments,
        votedComments,
        setVotedComments,
        setIsLoadingChosen,
        setMessages,
      });
    } else if (eventType === "random") {
      randomSocketListenerInit({});
    }

    setSocket(partySocket);
    
    return () => {
      console.log("CLOSING SOCKET");
      partySocket.close();
    };
  }, [session, currentPlayerId]);

  const incrementScore = () => {
    console.log("Incrementing score");
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
    
    // Chosen state
    comments,
    setComments,
    votedComments,
    setVotedComments,
    isLoadingChosen,
    setIsLoadingChosen,
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
