import { type PlayerData } from "~/PartySocketContext";
import { type ChatMessage } from "~/PartySocketContext";

export interface SocketMessage {
  type: string;
  value?: number;
  state?: { connections: PlayerData[] };
  id?: string;
  message?: ChatMessage;
} 