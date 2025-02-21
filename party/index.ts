import type * as Party from "partykit/server";

interface PlayerData {
  userId: string;
  name: string;
  score: number;
  socketId: string;
}

interface ChatMessage {
  messageId: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface SessionData {
  userId: string;
  name: string;
}

interface ConnectionContext extends Party.ConnectionContext {
  initial?: {
    session: SessionData | null;
  };
}

export default class Server implements Party.Server {
  // The string key is the player userId
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

  //  UserID is the userId from the database
  onConnect(conn: Party.Connection, ctx: ConnectionContext) {
    const sessionData = ctx.initial?.session;
    const userId = sessionData?.userId ?? 'ID NOT FOUND';

    this.players[userId] = {
      userId: sessionData?.userId ?? 'ID NOT FOUND',
      name: sessionData?.name ?? "",
      score: 0,
      socketId: conn.id
    };

    // Send back confirmed connection with userId not socketId
    conn.send(JSON.stringify({ type: "connection", id: userId }));
    this.broadcastState();
  }

  onClose(conn: Party.Connection) {
    // Used to delete the players from the players object, but dont do anything for persistance on browser close
    
    // delete this.players[conn.id];
    // this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);
    
    if (data.type === "chat") {
      const chatMessage: ChatMessage = {
        messageId: crypto.randomUUID(),
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
