export type Category = 'Hardware' | 'Software' | 'Red' | 'Accesos' | 'Otros';
export type Priority = 'Baja' | 'Media' | 'Alta' | 'Critica';
export type Status = 'Pendiente' | 'En_progreso' | 'Resuelta' | 'Cancelada';

export interface TicketHistory {
  id: string;
  ticketId: string;
  previousStatus: Status;
  newStatus: Status;
  changedAt: string;
  responsible: string;
  observation?: string | null;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  applicant: string;
  category: Category;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
  history?: TicketHistory[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TicketStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  cancelled: number;
}

export interface TicketQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  priority?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  applicant: string;
  category: Category;
  priority: Priority;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  applicant?: string;
  category?: Category;
  priority?: Priority;
}

export interface ChangeStatusPayload {
  newStatus: Status;
  responsible: string;
  observation?: string;
}
