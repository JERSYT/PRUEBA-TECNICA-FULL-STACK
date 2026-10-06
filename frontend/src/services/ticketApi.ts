import {
  Ticket,
  TicketStats,
  TicketQueryParams,
  CreateTicketPayload,
  UpdateTicketPayload,
  ChangeStatusPayload,
  Pagination,
  TicketHistory,
} from '../types/ticket';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    const errorMsg =
      json.message ||
      (json.errors && json.errors.map((e: { message: string }) => e.message).join(', ')) ||
      'Ocurrió un error en la solicitud.';
    throw new Error(errorMsg);
  }
  return json;
}

export const ticketApi = {
  async getStats(): Promise<TicketStats> {
    const res = await fetch(`${API_BASE_URL}/tickets/stats`);
    const json = await handleResponse<{ success: boolean; data: TicketStats }>(res);
    return json.data;
  },

  async listTickets(params: TicketQueryParams): Promise<{ data: Ticket[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.priority) query.set('priority', params.priority);
    if (params.status) query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const res = await fetch(`${API_BASE_URL}/tickets?${query.toString()}`);
    return handleResponse<{ success: boolean; data: Ticket[]; pagination: Pagination }>(res);
  },

  async getTicketById(id: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}`);
    const json = await handleResponse<{ success: boolean; data: Ticket }>(res);
    return json.data;
  },

  async createTicket(payload: CreateTicketPayload): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await handleResponse<{ success: boolean; data: Ticket }>(res);
    return json.data;
  },

  async updateTicket(id: string, payload: UpdateTicketPayload): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await handleResponse<{ success: boolean; data: Ticket }>(res);
    return json.data;
  },

  async changeStatus(id: string, payload: ChangeStatusPayload): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await handleResponse<{ success: boolean; data: Ticket }>(res);
    return json.data;
  },

  async deleteTicket(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<{ success: boolean; message: string }>(res);
  },

  async getTicketHistory(id: string): Promise<TicketHistory[]> {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/history`);
    const json = await handleResponse<{ success: boolean; data: TicketHistory[] }>(res);
    return json.data;
  },
};
