import { useEffect, useState, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { PlusCircle, Headset } from 'lucide-react';
import { ticketApi } from './services/ticketApi';
import {
  Ticket,
  TicketStats,
  Pagination,
  Status,
  CreateTicketPayload,
} from './types/ticket';
import { StatsOverview } from './components/StatsOverview';
import { TicketFilters, FilterState } from './components/TicketFilters';
import { TicketTable } from './components/TicketTable';
import { TicketFormModal } from './components/TicketFormModal';
import { ChangeStatusModal } from './components/ChangeStatusModal';
import { TicketDetailModal } from './components/TicketDetailModal';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: '',
  priority: '',
  status: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function App() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [statusTicket, setStatusTicket] = useState<Ticket | null>(null);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const s = await ticketApi.getStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ticketApi.listTickets({
        page,
        limit: 8,
        search: filters.search || undefined,
        category: filters.category || undefined,
        priority: filters.priority || undefined,
        status: filters.status || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setTickets(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error cargando solicitudes');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const t = setTimeout(() => fetchTickets(), filters.search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchTickets, filters.search]);

  function handleFiltersChange(f: FilterState) {
    setFilters(f);
    setPage(1);
  }

  async function refreshAll() {
    await Promise.all([fetchTickets(), fetchStats()]);
  }

  async function handleCreateOrUpdate(payload: CreateTicketPayload) {
    setSubmitting(true);
    try {
      if (editingTicket) {
        await ticketApi.updateTicket(editingTicket.id, payload);
        toast.success('Solicitud actualizada correctamente');
      } else {
        await ticketApi.createTicket(payload);
        toast.success('Solicitud creada correctamente');
      }
      setShowForm(false);
      setEditingTicket(null);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error guardando la solicitud');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(newStatus: Status, responsible: string, observation: string) {
    if (!statusTicket) return;
    setSubmitting(true);
    try {
      await ticketApi.changeStatus(statusTicket.id, { newStatus, responsible, observation });
      toast.success(`Estado actualizado a "${newStatus.replace('_', ' ')}"`);
      setStatusTicket(null);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ticket: Ticket) {
    if (!window.confirm(`¿Eliminar la solicitud "${ticket.title}"? Esta acción no se puede deshacer.`))
      return;
    try {
      await ticketApi.deleteTicket(ticket.id);
      toast.success('Solicitud eliminada');
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" richColors closeButton />
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Headset className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mesa de Ayuda Tecnológica</h1>
              <p className="text-xs text-slate-300">
                Gestión de solicitudes internas de soporte · React + Node.js + PostgreSQL
              </p>
            </div>
          </div>
          <button
            data-testid="new-ticket-btn"
            onClick={() => {
              setEditingTicket(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Nueva solicitud
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <StatsOverview
          stats={stats}
          activeStatusFilter={filters.status}
          onSelectStatus={(status) => handleFiltersChange({ ...filters, status })}
        />

        <TicketFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={() => {
            setFilters(DEFAULT_FILTERS);
            setPage(1);
          }}
        />

        <TicketTable
          tickets={tickets}
          pagination={pagination}
          loading={loading}
          onPageChange={setPage}
          onView={setDetailTicket}
          onEdit={(t) => {
            setEditingTicket(t);
            setShowForm(true);
          }}
          onChangeStatus={setStatusTicket}
          onDelete={handleDelete}
        />

        <p className="text-center text-xs text-slate-400 mt-6">
          Documentación API disponible en{' '}
          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">/api-docs</span> del
          backend · Reglas de transición validadas en frontend y backend
        </p>
      </main>

      {showForm && (
        <TicketFormModal
          ticket={editingTicket}
          submitting={submitting}
          onClose={() => {
            setShowForm(false);
            setEditingTicket(null);
          }}
          onSubmit={handleCreateOrUpdate}
        />
      )}

      {statusTicket && (
        <ChangeStatusModal
          ticket={statusTicket}
          submitting={submitting}
          onClose={() => setStatusTicket(null)}
          onSubmit={handleStatusChange}
        />
      )}

      {detailTicket && (
        <TicketDetailModal ticket={detailTicket} onClose={() => setDetailTicket(null)} />
      )}
    </div>
  );
}
