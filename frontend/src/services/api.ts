import type { CreateTicketPayload, Ticket, TicketStatus } from '../types/ticket';

const BASE_URL = 'http://localhost:5199/api/tickets';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Požadavek selhal se stavem ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(BASE_URL);
  return handleResponse<Ticket[]>(response);
}

export async function getTicket(id: number): Promise<Ticket> {
  const response = await fetch(`${BASE_URL}/${id}`);
  return handleResponse<Ticket>(response);
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Ticket>(response);
}

export async function updateTicketStatus(id: number, status: TicketStatus): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(status),
  });
  return handleResponse<void>(response);
}

export async function updateFinalResponse(id: number, finalResponse: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}/final-response`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalResponse),
  });
  return handleResponse<void>(response);
}

export async function recallLlm(id: number): Promise<Ticket> {
  const response = await fetch(`${BASE_URL}/${id}/recall-llm`, {
    method: 'POST',
  });
  return handleResponse<Ticket>(response);
}

export async function deleteTicket(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(response);
}
