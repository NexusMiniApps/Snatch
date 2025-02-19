import type * as Party from "partykit/server";

interface PlayerData {
  id: string;
  name: string;
  score: number;
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
    const connections = Array.from(this.room.getConnections());
    this.room.broadcast(
      JSON.stringify({
        type: "state",
        state: {
          connections: connections.map((conn: Party.Connection) => 
            this.players[conn.id] || { id: conn.id, name: "Anonymous", score: 0 }
          )
        }
      })
    );
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.players[conn.id] = {
      id: conn.id,
      name: "",
      score: 0
    };
    conn.send(JSON.stringify({ type: "connection", id: conn.id }));
    this.broadcastState();
  }

  onClose(conn: Party.Connection) {
    delete this.players[conn.id];
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);
    
    if (data.type === "chat") {
      const chatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: this.players[sender.id]?.name || sender.id,
        text: data.text,
        timestamp: Date.now()
      };
      this.messages.push(chatMessage);
      this.room.broadcast(JSON.stringify({ 
        type: "chat",
        message: chatMessage
      }));
    } else if (data.type === "counter") {
      const player = this.players[sender.id];
      if (player) {
        player.score += 1;
        this.broadcastState();
      }
    } else if (data.type === "updateName") {
      const player = this.players[sender.id];
      if (player && data.name) {
        player.name = data.name;
        this.broadcastState();
      }
    }
  }
}

Server satisfies Party.Worker;
