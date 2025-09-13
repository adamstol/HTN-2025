import { ModelMessage } from "ai";

export interface SharedStore {
  user: {
    phone?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  incomingMessage?: string;
  aiResponse?: string;
  confirmationCompleted?: boolean;
  suggestedEmail?: string;
  awaitingEmail?: boolean;
  messages: ModelMessage[];
}


export type Club = {
  id: number;
  name: string;
  short_name: string | null;
  description: string | null;
  summary: string | null;
  instagram: string | null;
  discord: string | null;
  url: string;
};

export type ClubMatch = Club & { similarity: number };