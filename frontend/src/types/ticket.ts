export type TicketCategory = 'Hardware' | 'Software' | 'Network' | 'Access' | 'Other';

export type TicketPriority = 'Low' | 'Medium' | 'High';

export type TicketStatus = 'New' | 'InProgress' | 'Resolved';

export interface Ticket {
  id: number;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  suggestedResponse: string | null;
  finalResponse: string | null;
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
}
