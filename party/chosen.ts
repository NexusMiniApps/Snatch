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
  GAME = 'game',
  CHOSEN = 'chosen',
  RANDOM = 'random'
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
  private eventType: EventType = EventType.GAME; // Default to game

  constructor(readonly room: Party.Room) {}

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
    conn.send(JSON.stringify({ 
      type: "comments", 
      comments: this.comments 
    }));
    
    // Send user's votes
    if (this.userVotes[conn.id]) {
      conn.send(JSON.stringify({ 
        type: "userVotes", 
        votedComments: Array.from(this.userVotes[conn.id] || new Set()) 
      }));
    }
    
    this.broadcastState();
  }

  onClose(_conn: Party.Connection) {
    // dont delete player data on disconnect
    delete this.players[_conn.id];
    this.broadcastState();
  }
  onMessage(message: string, sender: Party.Connection) {
    
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
        player.phone = typeof data.phone === "string" ? data.phone : "";
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
      // Only set comments if they haven't been set before
      if (this.comments.length === 0) {
        this.comments = data.comments;
        this.broadcastComments();
      }
    } 
    else if (data.type === "vote" && data.commentId) {
      // Initialize user's votes if not already done
      if (!this.userVotes[sender.id]) {
        this.userVotes[sender.id] = new Set();
      }
      
      // Get user votes set
      const userVotes = this.userVotes[sender.id];
      const hasVoted = userVotes?.has(data.commentId);
      
      // Find the comment
      const comment = this.comments.find(c => c.id === data.commentId);
      if (!comment) return;
      
      // Handle vote or unvote based on isUpvote flag
      if (data.isUpvote === true && !hasVoted) {
        // Add new vote
        userVotes?.add(data.commentId);
        comment.score += 1;
        console.log(`User ${sender.id} voted for comment ${data.commentId}`);
      } 
      else if (data.isUpvote === false && hasVoted) {
        // Remove existing vote
        userVotes?.delete(data.commentId);
        comment.score = Math.max(0, comment.score - 1);
        console.log(`User ${sender.id} unvoted comment ${data.commentId}`);
      }
      
      // Broadcast updated comments to all clients
      this.broadcastComments();
      
      // Send updated votes to this user
      sender.send(JSON.stringify({
        type: "userVotes",
        votedComments: Array.from(userVotes?.values() || [])
      }));
    }
    else if (data.type === "getComments") {
      // Send current comments to the requesting client
      sender.send(JSON.stringify({
        type: "comments",
        comments: this.comments
      }));
    }
    else if (data.type === "getUserVotes") {
      // Send user's votes to the requesting client
      sender.send(JSON.stringify({
        type: "userVotes",
        votedComments: Array.from(this.userVotes[sender.id] || new Set())
      }));
    }
  }
}

Server satisfies Party.Worker;
