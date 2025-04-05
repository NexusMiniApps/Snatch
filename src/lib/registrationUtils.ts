// Define interface for ticket response
export interface TicketResponse {
  ticketNumber: string;
}

// Define interface for event participant response
export interface EventParticipantResponse {
  ticketNumber: string;
  hasJoinedGiveaway: boolean;
  hasPreReg: boolean;
  userId: string;
  eventId: string;
}

// Define interface for event data
export interface EventData {
  id: string;
  name: string;
  location: string;
  startTime: Date;
  description: string;
  status: string;
  ownerId: string;
  snatchStartTime: Date;
  eventType: string;
  winnerUserId: string;
  winnerTicket: string;
}

/**
 * Interface for the latest event details
 */
export interface LatestEventDetails {
  id: string;
  description: string;
  name: string;
}

/**
 * Fetches the latest event data from the API
 * @returns Promise<EventData> - The latest event data
 */
export const fetchEvent = async (): Promise<EventData> => {
  console.log("Fetching latest event");
  // Determine base URL based on environmen
  const baseURL = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; // Fallback to localhost for dev

  const fetchURL = `${baseURL}/api/latestEvent`;
  console.log("Fetching from URL:", fetchURL);

  const res = await fetch(fetchURL);
  if (!res.ok) {
    console.log("Response error:", res);
    throw new Error("Failed to fetch latest event data");
  }
  const data = (await res.json()) as EventData;
  console.log("Fetched latest event data:", data);
  return data;
};

/**
 * Handles joining a giveaway by generating a ticket and updating participant status
 * @param userId - The ID of the user
 * @param eventId - The ID of the event
 * @param setLoading - Optional loading state setter function
 * @param setTicketNumber - Function to set the ticket number in state
 * @param setHasJoined - Function to set the joined status in state
 * @returns Promise<void>
 */
export const handleJoinGiveaway = async (
  userId: string,
  eventId: string,
  setLoading?: (loading: boolean) => void,
  setTicketNumber?: (ticket: string) => void,
  setHasJoined?: (joined: boolean) => void,
): Promise<void> => {
  if (!userId || !eventId) {
    throw new Error("User or event data missing");
  }

  try {
    // Generate new ticket number
    const newTicket = await generateTicketNumber(userId, eventId, setLoading);

    if (setTicketNumber) {
      setTicketNumber(newTicket);
    }

    // Update DB with the ticket number
    const response = await fetch("/api/eventParticipant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: eventId,
        userId: userId,
        isPreReg: true,
        hasJoinedGiveaway: true,
        ticketNumber: newTicket,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as EventParticipantResponse;
      console.log("Successfully joined giveaway", data);
      if (setHasJoined) {
        setHasJoined(true);
      }
    } else {
      throw new Error(`Failed to join giveaway: ${await response.text()}`);
    }
  } catch (error) {
    console.error("Error joining giveaway:", error);
    throw error;
  }
};

/**
 * Generates a unique ticket number for a user and event
 * @param userId - The ID of the user
 * @param eventId - The ID of the event
 * @param setLoading - Optional loading state setter function
 * @returns Promise<string> - The generated ticket number
 */
const generateTicketNumber = async (
  userId: string,
  eventId: string,
  setLoading?: (loading: boolean) => void,
): Promise<string> => {
  if (!userId || !eventId) {
    throw new Error("User or event data missing");
  }

  if (setLoading) {
    setLoading(true);
  }

  try {
    // Try to generate a unique ticket number
    const response = await fetch("/api/generateTicket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: eventId,
        userId: userId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate ticket");
    }
    const data = (await response.json()) as TicketResponse;
    return data.ticketNumber;
  } finally {
    if (setLoading) {
      setLoading(false);
    }
  }
};

/**
 * Fetches a user's ticket for an event
 * If no ticket is found, the user is registered for the event
 * @param userId - The ID of the user
 * @param eventId - The ID of the event
 * @param setTicketNumber - Function to set the ticket number in state
 * @param setHasJoined - Function to set the joined status in state
 * @returns Promise<void>
 */
export const fetchUserTicket = async (
  userId: string,
  eventId: string,
  setTicketNumber: (ticket: string) => void,
  setHasJoined: (joined: boolean) => void,
): Promise<void> => {
  if (!userId || !eventId) return;

  // Attempt to fetch the user's ticket from the database
  try {
    const response = await fetch(
      `/api/eventParticipant?userId=${userId}&eventId=${eventId}`,
    );
    if (response.ok) {
      const data = (await response.json()) as EventParticipantResponse;
      console.log("FETCHED USER TICKET DATA: ", data);
      // Load into state
      setTicketNumber(data.ticketNumber);
      setHasJoined(data.hasJoinedGiveaway);
    } else {
      if (response.status === 404) {
        // If participant not found, we'll register them
        await registerParticipant(userId, eventId);
      } else {
        // For other errors, throw an error to be caught by the catch block
        throw new Error(`Failed to fetch ticket: ${response.status}`);
      }
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Registers a participant for an event
 * @param userId - The ID of the user
 * @param eventId - The ID of the event
 * @param isPreReg - Whether the user has completed prerequisites
 * @param hasJoinedGiveaway - Whether the user has joined the giveaway
 * @returns Promise<EventParticipantResponse> - The participant data
 */
export const registerParticipant = async (
  userId: string,
  eventId: string,
  isPreReg?: boolean,
  hasJoinedGiveaway?: boolean,
): Promise<EventParticipantResponse> => {
  isPreReg = isPreReg ?? false; // Default to false if undefined
  hasJoinedGiveaway = hasJoinedGiveaway ?? false;

  const response = await fetch("/api/eventParticipant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventId: eventId,
      userId: userId,
      isPreReg: isPreReg,
      hasJoinedGiveaway: hasJoinedGiveaway,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to register participant: ${await response.text()}`);
  }

  return response.json() as Promise<EventParticipantResponse>;
};

/**
 * Checks if a user has completed prerequisites for an event
 * @param userId - The ID of the user
 * @param eventId - The ID of the event
 * @param setSocialAFollowed - Function to set the social A follow status
 * @param setSocialBFollowed - Function to set the social B follow status
 * @returns Promise<void>
 */
export const checkPrerequisites = async (
  userId: string,
  eventId: string,
  setSocialAFollowed?: (followed: boolean) => void,
  setSocialBFollowed?: (followed: boolean) => void,
): Promise<void> => {
  if (!userId || !eventId) return;

  try {
    const response = await fetch(
      `/api/eventParticipant?eventId=${eventId}&userId=${userId}`,
    );

    if (response.ok) {
      const participantData =
        (await response.json()) as EventParticipantResponse;

      // If the participant has completed prerequisites, set both social follows to true
      if (participantData.hasPreReg === true) {
        if (setSocialAFollowed) setSocialAFollowed(true);
        if (setSocialBFollowed) setSocialBFollowed(true);
        console.log(
          "Prerequisites already completed, social requirements satisfied",
        );
      }
    } else {
      console.log("No existing participation record found or other error");
      await registerParticipant(userId, eventId);
    }
  } catch (error) {
    console.error("Error checking prerequisites status:", error);
    throw error;
  }
};

/**
 * Fetches the latest event's ID, description, and name from the API
 * @returns Promise<LatestEventDetails> - The latest event details
 */
export const fetchLatestEventDetails = async (): Promise<LatestEventDetails> => {
  console.log("Fetching latest event details");
  try {
    const res = await fetch("/api/latestEvent");
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Response error:", res.status, errorText);
      throw new Error(`Failed to fetch latest event details: ${errorText}`);
    }
    // We expect the full Event object from the API, but only need specific fields
    const data = (await res.json()) as EventData; 
    console.log("Fetched latest event data:", data);
    
    // Return only the required fields
    return {
      id: data.id,
      description: data.description,
      name: data.name,
    };
  } catch (error) {
    console.error("Error fetching latest event details:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};
