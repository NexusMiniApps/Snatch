import { type EventParticipantResponse } from "../lib/registrationUtils";
import { type PlayerData, type ChatMessage } from "../PartySocketContext";

export interface SocketMessage {
  type: string;
  value?: number;
  id?: string;
  name?: string;
  state?: {
    connections: PlayerData[];
  };
  eventParticipant?: EventParticipantResponse;
  message?: ChatMessage;
} 