import type * as Party from "partykit/server";

interface PlayerData {
  socketId: string;
  name: string;
  score: number;
  phone: string;
}

interface ChatMessageData {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface MessageData {
  type: string;
  text?: string;
  name?: string;
  phone?: string;
};

export default class Server implements Party.Server {
  // The string should be the players UUID session id
  private players: Record<string, PlayerData> = {};
  private chatStack: ChatMessageData[] = [];
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
    // Use UUID as key for players
    this.players[conn.id] = {
      socketId: conn.id,
      name: "",
      score: 0,
      phone: "",
    };
    conn.send(JSON.stringify({ type: "connection", id: conn.id }));
    this.broadcastState();
  }

  onClose(_conn: Party.Connection) {
    // dont delete player data on disconnect to maintain persistance
    delete this.players[_conn.id];
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {

    // Must contain meesage type  
    let data: MessageData;

    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error("Failed to parse message:", err);
      return;
    }

    // FOR CHAT MESSAGES
    if (data.type === "chat") {
      // Create a new chat message
      const chatMessage: ChatMessageData = {
        id: crypto.randomUUID(),
        sender: this.players[sender.id]?.name ?? sender.id,
        text: data.text ?? "",
        timestamp: Date.now(),
      };
      // Push on chat stack
      this.chatStack.push(chatMessage);
      // Broadcast to all players
      this.room.broadcast(
        JSON.stringify({
          type: "chat",
          message: chatMessage,
        }),
      );

    // FOR COUNTER MESSAGES
    } else if (data.type === "counter") {
      const player = this.players[sender.id];
      if (player) {
        player.score += 1;
        this.broadcastState();
      }

    // FOR NAME UPDATE MESSAGES
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
