// Define interface for ticket response
export interface TicketResponse {
  ticketNumber: string;
}

// Define interface for event participant response
export interface EventParticipantResponse {
  ticketNumber: string | null;
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
}

/**
 * Fetches event data from the API
 * @param eventId - The ID of the event to fetch
 * @returns Promise<EventData> - The event data
 */
export const fetchEvent = async (eventId: string): Promise<EventData> => {
  console.log("Fetching event with ID:", eventId);
  const res = await fetch(`/api/events/${eventId}`);
  if (!res.ok) {
    console.log("Response error:", res);
    throw new Error("Failed to fetch event data");
  }
  const data = (await res.json()) as EventData;
  console.log("Fetched event data:", data);
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
  setHasJoined?: (joined: boolean) => void
): Promise<void> => {
  if (!userId || !eventId) {
    throw new Error("User or event data missing");
  }

  try {
    // Generate new ticket number
    const newTicket = await generateTicketNumber(
      userId,
      eventId,
      setLoading
    );

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
  isPreReg: boolean = false,
  hasJoinedGiveaway: boolean = false
): Promise<EventParticipantResponse> => {
  if (!userId || !eventId) {
    throw new Error("User or event data missing");
  }

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
 * Generates a unique ticket number for a user and event
 * @param userId - The ID of the user
 * @param eventId - The ID of the event
 * @param setLoading - Optional loading state setter function
 * @returns Promise<string> - The generated ticket number
 */
const generateTicketNumber = async (
  userId: string,
  eventId: string,
  setLoading?: (loading: boolean) => void
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
 * @param userId - The ID of the user
 * @param eventId - The ID of the event
 * @param setTicketNumber - Function to set the ticket number in state
 * @param setHasJoined - Function to set the joined status in state
 * @returns Promise<void>
 */
export const fetchUserTicket = async (
  userId: string,
  eventId: string,
  setTicketNumber?: (ticket: string) => void,
  setHasJoined?: (joined: boolean) => void
): Promise<void> => {
  console.log("Fetching user ticket1");
  if (!userId || !eventId) return;
  console.log("Fetching user ticket2");
  console.log("xx session.user.id", userId);
  console.log("xx eventId", eventId);
  try {
    const response = await fetch(
      `/api/eventParticipant?userId=${userId}&eventId=${eventId}`,
    );
    console.log("xx response", response);
    if (response.ok) {
      const data = (await response.json()) as EventParticipantResponse;
      console.log("xx data", data);
      if (data.ticketNumber) {
        if (setTicketNumber) setTicketNumber(data.ticketNumber);
        if (setHasJoined) setHasJoined(data.hasJoinedGiveaway);
        console.log("xx Ticket number:", data.ticketNumber);
        console.log("xx Has joined:", data.hasJoinedGiveaway);
      }
    } else {
      console.log("xx Failed to fetch ticket:", response.status);
      if (response.status === 404) {
        // If participant not found, we'll register them
        console.log("xx Participant not found, registering...");
        await registerParticipant(userId, eventId);
      } else {
        // For other errors, throw an error to be caught by the catch block
        throw new Error(`Failed to fetch ticket: ${response.status}`);
      }
    }
  } catch (error) {
    console.log("xx error", error);
    console.error("Error fetching ticket:", error);
    throw error;
  }
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
  setSocialBFollowed?: (followed: boolean) => void
): Promise<void> => {
  if (!userId || !eventId) return;

  try {
    const response = await fetch(
      `/api/eventParticipant?eventId=${eventId}&userId=${userId}`,
    );

    if (response.ok) {
      const participantData = (await response.json()) as EventParticipantResponse;

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