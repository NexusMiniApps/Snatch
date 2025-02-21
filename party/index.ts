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

export default class Server implements Party.Server {
  // The string should be the players UUID session id
  private players: Record<string, PlayerData> = {};
  private messages: ChatMessage[] = [];
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
    // delete this.players[conn.id];
    this.broadcastState();
  }
  onMessage(message: string, sender: Party.Connection) {
    let data: {
      type: string;
      text?: string;
      name?: string;
      phone?: string;
    };
    try {
      data = JSON.parse(message) as {
        type: string;
        text?: string;
        name?: string;
        phone?: string;
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
  }
}

Server satisfies Party.Worker;
