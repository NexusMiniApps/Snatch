"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
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

export type TabType =
  | "info"
  | "game"
  | "results"
  | "comments"
  | "random"
  | "vote";

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
  setVotedComments: React.Dispatch<React.SetStateAction<Set<string>>>;
  isLoadingChosen: boolean;
  setIsLoadingChosen: React.Dispatch<React.SetStateAction<boolean>>;

  // Game state
  isGameOver: boolean;
  setIsGameOver: (value: boolean) => void;
  isGameActive: boolean;
  setIsGameActive: (value: boolean) => void;
  timeRemaining: number;
  setTimeRemaining: (value: number) => void;
  gamePhase: "waiting" | "active" | "gameover";
  setGamePhase: (value: "waiting" | "active" | "gameover") => void;
  loading: boolean;
  error: string | null;
  eventData: EventData | null;
  handleTimeUp: () => void;
  handleGameComplete: () => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  checkSnatchStartTime: () => void;
}

const PartySocketContext = createContext<PartySocketContextType | undefined>(
  undefined,
);

// Define possible event types
export type SupportedEventType = "game" | "chosen" | "random";

interface PartySocketProviderProps {
  children: ReactNode;
  session?: AuthSession;
  eventType: SupportedEventType;
}

export function PartySocketProvider({
  children,
  session,
  eventType,
}: PartySocketProviderProps) {
  console.log("xx PartySocketProvider for eventType: ", eventType);
  // Socket related state
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [currentPlayerCount, setCurrentPlayerCount] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [playerName, setPlayerName] = useState<string>("BULLSHIT");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Game state
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds game duration
  const [gamePhase, setGamePhase] = useState<"waiting" | "active" | "gameover">(
    "waiting",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [socialAFollowed, setSocialAFollowed] = useState(false);
  const [socialBFollowed, setSocialBFollowed] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "info" | "game" | "results" | "comments" | "random" | "vote"
  >("info");

  // Random State

  // Chosen State
  const [comments, setComments] = useState<Comment[]>([]);
  const [votedComments, setVotedComments] = useState<Set<string>>(new Set());
  const [isLoadingChosen, setIsLoadingChosen] = useState(true);

  console.log("session is: ", session);

  // Function to check the database for the snatch start time and update the game state
  const checkSnatchStartTime = async () => {
    try {
      if (!eventData?.id) return;

      // Fetch the latest event data from the database
      const latestEventData = await fetchEvent(eventType);

      if (!latestEventData) return;

      // Check if the snatch start time has changed
      const currentSnatchStartTime = new Date(
        eventData.snatchStartTime,
      ).getTime();
      const newSnatchStartTime = new Date(
        latestEventData.snatchStartTime,
      ).getTime();

      if (currentSnatchStartTime !== newSnatchStartTime) {
        console.log(
          "Snatch start time has changed in the database. Updating game state.",
        );

        // Update the event data
        setEventData(latestEventData);

        // Calculate the current game phase based on the new snatch start time
        const now = Date.now();
        const gameDuration = 60000; // 1 minute in milliseconds

        if (now < newSnatchStartTime) {
          // Game hasn't started yet
          setGamePhase("waiting");
          setIsGameActive(false);
          setTimeRemaining(60);
          setIsGameOver(false);
        } else if (
          now >= newSnatchStartTime &&
          now < newSnatchStartTime + gameDuration
        ) {
          // Game is active
          const remainingTime = Math.max(
            0,
            Math.ceil((newSnatchStartTime + gameDuration - now) / 1000),
          );
          setGamePhase("active");
          setIsGameActive(true);
          setTimeRemaining(remainingTime);
          setIsGameOver(false);
        } else {
          // Game is over
          setGamePhase("gameover");
          setIsGameActive(false);
          setTimeRemaining(0);
          setIsGameOver(true);
        }

        // If socket is connected, send a message to update the game state
        if (socket) {
          socket.send(
            JSON.stringify({
              type: "updateGameState",
              snatchStartTime: latestEventData.snatchStartTime,
            }),
          );
        }
      }
    } catch (error) {
      console.error("Error checking snatch start time:", error);
    }
  };

  // USE EFFECT FOR EVENT DATA FETCH + TICKET FETCH
  useEffect(() => {
    void (async () => {
      try {
        // Pass eventType to fetchEvent
        console.log("xx EVENT TYPE IS: ", eventType);
        const data = await fetchEvent(eventType);
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
  }, [session?.user?.id, eventType]);

  // Check snatch start time on page render and periodically
  useEffect(() => {
    if (!eventData) return;
    let interval: NodeJS.Timeout | null = null;
    console.log("xx eventData.eventType: ", eventData.eventType);
    if (true) {
      // Check immediately
      void checkSnatchStartTime();

      // Then check every 30 seconds
      interval = setInterval(() => {
        void checkSnatchStartTime();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [eventData, socket]);

  // Automatically update game phase when snatch start time is reached
  useEffect(() => {
    if (!eventData) return;

    const checkGamePhase = () => {
      const now = Date.now();
      const snatchStartTime = new Date(eventData.snatchStartTime).getTime();
      const gameDuration = 60000; // 1 minute in milliseconds

      if (now < snatchStartTime) {
        // Game hasn't started yet
        if (gamePhase !== "waiting") {
          setGamePhase("waiting");
          setIsGameActive(false);
          setTimeRemaining(60);
          setIsGameOver(false);
        }
      } else if (
        now >= snatchStartTime &&
        now < snatchStartTime + gameDuration
      ) {
        // Game is active
        const remainingTime = Math.max(
          0,
          Math.ceil((snatchStartTime + gameDuration - now) / 1000),
        );
        if (gamePhase !== "active") {
          setGamePhase("active");
          setIsGameActive(true);
          setTimeRemaining(remainingTime);
          setIsGameOver(false);
        }
      } else {
        // Game is over
        if (gamePhase !== "gameover") {
          setGamePhase("gameover");
          setIsGameActive(false);
          setTimeRemaining(0);
          setIsGameOver(true);
        }
      }
    };

    console.log("xx eventData.eventType: ", eventData.eventType);
    let interval: NodeJS.Timeout | null = null;
    if (true) {
      // Check immediately
      checkGamePhase();

      // Then check every second
      interval = setInterval(checkGamePhase, 1000);
    } 
    return () => clearInterval(interval);
  }, [eventData, gamePhase]);

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
    // setActiveTab("info");
  };

  // USE EFFECT FOR SOCKET CONNECTION
  useEffect(() => {
    if (!session) {
      console.log("Session undefined, not connecting to socket.");
      return;
    }

    const host =
      process.env.NODE_ENV === "production"
        ? "https://snatch-party.zhizhangt.partykit.dev"
        : "localhost:1999";

    const playerId = session.user.id;
    const userName = session.user.name;

    if (!playerId || !userName) {
      console.log("Player ID or Username missing in session");
      return;
    }

    setCurrentPlayerId(playerId);

    console.log("xx EVENT DATA IS: ", eventData);
    let eventType = "game";
    if (eventData && typeof eventData.eventType === "string") {
      eventType = eventData.eventType.toLowerCase();
    }
    console.log("Event Type is: ", eventType);
    console.log("CONNECTING TO SOCKET for type:", eventType);

    const partySocket = new PartySocket({
      host,
      room: "my-room",
      party: eventType,
      id: playerId,
    });

    setSocket(partySocket);

    // Initialize socket listeners
    gameSocketListenerInit({
      socket: partySocket,
      setCurrentPlayerCount,
      currentPlayerId: playerId,
      setPlayers,
      setPlayerName,
      setMessages,
      setIsGameActive,
      setTimeRemaining,
      setGamePhase,
      setIsGameOver,
    });

    partySocket.addEventListener("open", () => {
      console.log(`Socket opened for ${eventType}, sending name.`);
      partySocket.send(JSON.stringify({ type: "updateName", name: userName }));
    });

    console.log("Setting up listeners for event type:", eventType);
    if (eventType === "game") {
      console.log("INITIALIZING GAME SOCKET LISTENER");
      gameSocketListenerInit({
        socket: partySocket,
        setCurrentPlayerCount,
        currentPlayerId,
        setPlayers,
        setPlayerName,
        setMessages,
        setIsGameActive,
        setTimeRemaining,
        setGamePhase,
        setIsGameOver,
      });
    } else if (eventType === "chosen") {
      console.log("INITIALIZING CHOSEN SOCKET LISTENER");
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

    return () => {
      console.log(`CLOSING SOCKET for ${eventType}`);
      partySocket.close();
    };
  }, [session, eventData]);

  const incrementScore = () => {
    console.log("Incrementing score");
    if (socket) {
      socket.send(JSON.stringify({ type: "counter" }));
    }
  };

  const sendMessage = (message: string) => {
    if (socket && message.trim()) {
      socket.send(
        JSON.stringify({
          type: "chat",
          text: message.trim(),
        }),
      );
    }
  };

  // Add a timer to update timeRemaining when game is active
  useEffect(() => {
    if (gamePhase === "active" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setGamePhase("gameover");
            setIsGameOver(true);
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gamePhase, timeRemaining, setTimeRemaining, setGamePhase, setIsGameOver]);

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
    isGameActive,
    setIsGameActive,
    timeRemaining,
    setTimeRemaining,
    gamePhase,
    setGamePhase,
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
    checkSnatchStartTime,
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
