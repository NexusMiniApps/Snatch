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

export default class Server implements Party.Server {
  // The string should be the players UUID session id
  private players: Record<string, PlayerData> = {};
  private messages: ChatMessage[] = [];

  // Add new properties for winner selection
  private tickets: Record<string, TicketData[]> = {}; // eventId -> tickets
  private winners: Record<string, WinnerData> = {}; // eventId -> winner

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

  onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    console.log("New connection with connection ID:", conn.id);
    this.players[conn.id] = {
      id: conn.id,
      name: "",
      score: 0,
      phone: "",
    };
    conn.send(JSON.stringify({ type: "connection", id: conn.id }));
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
    } else if (data.type === "counter") {
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
    } else if (data.type === "announceWinner" && data.eventId && data.winner) {
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
  }
}

Server satisfies Party.Worker;
