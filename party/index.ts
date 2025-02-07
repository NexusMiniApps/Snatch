import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  private scores: Map<string, number> = new Map();

  constructor(readonly room: Party.Room) {}

  private broadcastState() {
    const connections = Array.from(this.room.getConnections());
    this.room.broadcast(
      JSON.stringify({
        type: "state",
        state: {
          connections: connections.map((conn: Party.Connection) => ({
            id: conn.id,
            score: this.scores.get(conn.id) || 0,
          }))
        }
      })
    );
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.scores.set(conn.id, 0);
    conn.send(JSON.stringify({ type: "connection", id: conn.id }));
    this.broadcastState();
  }

  onClose(conn: Party.Connection) {
    this.scores.delete(conn.id);
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);
    if (data.type === "counter") {
      const currentScore = this.scores.get(sender.id) || 0;
      this.scores.set(sender.id, currentScore + 1);
      this.broadcastState();
    }
  }
}

Server satisfies Party.Worker;
