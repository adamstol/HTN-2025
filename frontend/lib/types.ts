
type ConversationStatus = 'pending' | 'active' | 'ended';
export interface ConversationData {
  id: string;
  status: ConversationStatus;
  initiator_user_id: string;
  scanner_user_id?: string;
  scanner_email?: string;
  started_at: string;
  ended_at?: string;
  location?: string;
  invite_code: string;
}