import type * as Party from "partykit/server";

interface PlayerData {
  id: string;
  name: string;
  score: number;
  phone: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

// Add new interfaces for winner selection
interface TicketData {
  userId: string;
  ticketNumber: string;
  name: string;
}

interface WinnerData {
  userId: string;
  ticketNumber: string;
  name: string;
}

// Add comment interfaces
interface CommentData {
  id: string;
  text: string;
  username: string;
  profilePicture?: string;
  score: number;
  tags?: string[];
}

interface VoteData {
  commentId: string;
  userId: string;
  isUpvote: boolean; // true for upvote, false for removing upvote
}

// Add enum for event types
enum EventType {
  GAME = "game",
  CHOSEN = "chosen",
  RANDOM = "random",
}

export default class Server implements Party.Server {
  // The string should be the players UUID session id
  private players: Record<string, PlayerData> = {};
  private messages: ChatMessage[] = [];

  // Add new properties for winner selection
  private tickets: Record<string, TicketData[]> = {}; // eventId -> tickets
  private winners: Record<string, WinnerData> = {}; // eventId -> winner

  // Add storage for comments and votes
  private comments: CommentData[] = [];
  private userVotes: Record<string, Set<string>> = {}; // userId -> Set of commentIds
  private clearedComments = new Set<string>(); // Track cleared comment IDs
  private eventType: EventType = EventType.GAME; // Default to game

  constructor(readonly room: Party.Room) {
    // Initialize with empty comments
    this.comments = [];
  }

  private async loadInitialComments() {
    try {
      const response = await fetch(
        "https://snatch.pages.dev/misc/matchaGiveaway.json",
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        console.error(
          "Failed to load initial comments:",
          response.status,
          response.statusText,
        );
        throw new Error("Failed to load initial comments");
      }
      const data = (await response.json()) as CommentData[];

      // Get cleared comments from the API
      const clearedResponse = await fetch(
        "https://snatch.pages.dev/api/clearedComments",
      );
      if (clearedResponse.ok) {
        const clearedData = (await clearedResponse.json()) as {
          clearedIds: string[];
        };
        this.clearedComments = new Set(clearedData.clearedIds);
      }

      // Filter out any comments that have been cleared
      this.comments = data.filter(
        (comment) => !this.clearedComments.has(comment.id),
      );
      this.broadcastComments();
    } catch (error) {
      console.error("Error loading initial comments:", error);
      this.comments = [];
      this.broadcastComments();
    }
  }

  private broadcastState() {
    // Convert players object to array
    const allPlayers = Object.values(this.players);

    this.room.broadcast(
      JSON.stringify({
        type: "state",
        state: {
          connections: allPlayers,
        },
      }),
    );
  }

  // Add method to broadcast comments
  private broadcastComments() {
    this.room.broadcast(
      JSON.stringify({
        type: "comments",
        comments: this.comments,
      }),
    );
  }

  // Add method to broadcast cleared comments state
  private broadcastClearedComments() {
    this.room.broadcast(
      JSON.stringify({
        type: "clearedComments",
        clearedIds: Array.from(this.clearedComments),
      }),
    );
  }

  onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    console.log("New connection with connection ID:", conn.id);
    this.players[conn.id] = {
      id: conn.id,
      name: "",
      score: 0,
      phone: "",
    };
    conn.send(JSON.stringify({ type: "connection", id: conn.id }));

    // Send current comments state to the new connection
    conn.send(
      JSON.stringify({
        type: "comments",
        comments: this.comments,
      }),
    );

    // Send cleared comments state to the new connection
    conn.send(
      JSON.stringify({
        type: "clearedComments",
        clearedIds: Array.from(this.clearedComments),
      }),
    );

    // Send user's votes - initialize with empty set if not exists
    this.userVotes[conn.id] ??= new Set();
    const userVotes = this.userVotes[conn.id] ?? new Set();
    conn.send(
      JSON.stringify({
        type: "userVotes",
        votedComments: Array.from(userVotes),
      }),
    );

    this.broadcastState();
  }

  onClose(_conn: Party.Connection) {
    // dont delete player data on disconnect
    delete this.players[_conn.id];
    this.broadcastState();
  }

  async onMessage(message: string, sender: Party.Connection) {
    let data: {
      type: string;
      text?: string;
      name?: string;
      phone?: string;
      eventId?: string;
      tickets?: TicketData[];
      winner?: WinnerData;
      comments?: CommentData[];
      commentId?: string;
      isUpvote?: boolean;
      comment?: CommentData;
    };

    try {
      data = JSON.parse(message) as {
        type: string;
        text?: string;
        name?: string;
        phone?: string;
        eventId?: string;
        tickets?: TicketData[];
        winner?: WinnerData;
        comments?: CommentData[];
        commentId?: string;
        isUpvote?: boolean;
        comment?: CommentData;
      };
    } catch (err) {
      console.error("Failed to parse message:", err);
      return;
    }

    if (data.type === "chat") {
      const chatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: this.players[sender.id]?.name ?? sender.id,
        text: data.text ?? "",
        timestamp: Date.now(),
      };
      this.messages.push(chatMessage);
      this.room.broadcast(
        JSON.stringify({
          type: "chat",
          message: chatMessage,
        }),
      );
    }

    if (data.type === "counter") {
      const player = this.players[sender.id];
      if (player) {
        player.score += 1;
        this.broadcastState();
      }
    } else if (data.type === "updateName") {
      const player = this.players[sender.id];
      if (player && typeof data.name === "string") {
        player.name = data.name;
        player.phone = data.phone ?? "";
        this.broadcastState();
      }
    }

    // Add new message handlers for winner selection
    else if (
      data.type === "updateTickets" &&
      data.eventId &&
      Array.isArray(data.tickets)
    ) {
      // Store tickets for the event
      this.tickets[data.eventId] = data.tickets;

      // Broadcast tickets to all clients
      this.room.broadcast(
        JSON.stringify({
          type: "ticketsUpdate",
          eventId: data.eventId,
          tickets: data.tickets,
        }),
      );
    } else if (data.type === "startWinnerSelection" && data.eventId) {
      // Broadcast to all clients that winner selection is starting
      this.room.broadcast(
        JSON.stringify({
          type: "winnerSelectionStart",
          eventId: data.eventId,
          tickets: this.tickets[data.eventId] ?? [],
        }),
      );
    } else if (data.type === "" && data.eventId && data.winner) {
      // Store the winner
      this.winners[data.eventId] = data.winner;

      // Broadcast the winner to all clients
      this.room.broadcast(
        JSON.stringify({
          type: "winnerSelected",
          eventId: data.eventId,
          winner: data.winner,
        }),
      );
    }

    // Add handlers for comments
    else if (data.type === "setComments" && Array.isArray(data.comments)) {
      // Set comments regardless of current state
      this.comments = data.comments;
      this.broadcastComments();
    } else if (data.type === "vote" && data.commentId) {
      // Initialize user's votes if not already done
      this.userVotes[sender.id] ??= new Set();

      const isUpvote = data.isUpvote ?? true;
      const commentId = data.commentId;

      // Check if user has already voted for this comment
      const hasVoted = this.userVotes[sender.id]?.has(commentId) ?? false;

      // Update votes and scores based on the isUpvote flag
      if (isUpvote && !hasVoted) {
        // Add vote
        this.userVotes[sender.id]?.add(commentId);

        // Find and update comment score
        const comment = this.comments.find((c) => c.id === commentId);
        if (comment) {
          comment.score += 1;
        }
      } else if (!isUpvote && hasVoted) {
        // Remove vote
        this.userVotes[sender.id]?.delete(commentId);

        // Find and update comment score
        const comment = this.comments.find((c) => c.id === commentId);
        if (comment) {
          comment.score = Math.max(0, comment.score - 1);
        }
      } else if (!isUpvote && !hasVoted) {
        // This is a discard vote - add to cleared comments and remove from list
        this.clearedComments.add(commentId);
        this.comments = this.comments.filter((c) => c.id !== commentId);
        this.broadcastComments();
        this.broadcastClearedComments();
      }

      // IMPORTANT: Broadcast updated comments to ALL clients
      this.broadcastComments();

      // Send updated votes to the current user
      sender.send(
        JSON.stringify({
          type: "userVotes",
          votedComments: Array.from(this.userVotes[sender.id] ?? new Set()),
        }),
      );
    } else if (data.type === "getComments") {
      // Only send comments if we have them
      if (this.comments.length > 0) {
        sender.send(
          JSON.stringify({
            type: "comments",
            comments: this.comments,
          }),
        );
        console.log("Sent comments to client:", this.comments.length);
      } else {
        console.log("No comments to send to client");
      }
    } else if (data.type === "getUserVotes") {
      // Send user's votes to the requesting client
      sender.send(
        JSON.stringify({
          type: "userVotes",
          votedComments: Array.from(this.userVotes[sender.id] ?? new Set()),
        }),
      );
    } else if (data.type === "newComment" && data.comment) {
      // Add new comment to the list
      this.comments.push(data.comment);
      console.log("New comment added:", data.comment);

      // Broadcast updated comments to all clients
      this.broadcastComments();
    } else if (data.type === "clearComments") {
      try {
        // Clear all comments and cleared comments tracking
        this.comments = [];
        this.clearedComments.clear();
        console.log("Cleared all comments");

        // Clear all user votes
        this.userVotes = {};

        // Broadcast empty comments to all clients
        this.broadcastComments();

        // Broadcast empty votes to all clients
        this.room.broadcast(
          JSON.stringify({
            type: "userVotes",
            votedComments: [],
          }),
        );

        // Load initial comments from JSON file
        const response = await fetch(
          "https://snatch.pages.dev/misc/matchaGiveaway.json",
          {
            headers: {
              Accept: "application/json",
            },
          },
        );
        if (!response.ok) {
          console.error(
            "Failed to load initial comments:",
            response.status,
            response.statusText,
          );
          throw new Error("Failed to load initial comments");
        }
        const data = (await response.json()) as CommentData[];
        this.comments = data;
        this.broadcastComments();
      } catch (error) {
        console.error("Error clearing comments:", error);
        // Initialize with empty array if fetch fails
        this.comments = [];
        this.broadcastComments();
      }
    }
  }
}

Server satisfies Party.Worker;
