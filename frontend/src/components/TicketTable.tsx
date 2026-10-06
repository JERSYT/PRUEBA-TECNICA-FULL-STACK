import React from 'react';
import { Ticket } from '../types/ticket';
import { Eye, Pencil, RefreshCcw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination } from '../types/ticket';

interface Props {
  tickets: Ticket[];
  pagination: Pagination | null;
  loading: boolean;
  onPageChange: (page: number) => void;
  onView: (ticket: Ticket) => void;
  onEdit: (ticket: Ticket) => void;
  onChangeStatus: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

function statusBadge(status: string) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border';
  switch (status) {
    case 'Pendiente':
      return `${base} bg-amber-50 text-amber-700 border-amber-200`;
    case 'En_progreso':
      return `${base} bg-blue-50 text-blue-700 border-blue-200`;
    case 'Resuelta':
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    case 'Cancelada':
      return `${base} bg-rose-50 text-rose-700 border-rose-200`;
    default:
      return `${base} bg-slate-50 text-slate-700 border-slate-200`;
  }
}

function priorityBadge(priority: string) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold';
  switch (priority) {
    case 'Critica':
      return `${base} bg-red-600 text-white`;
    case 'Alta':
      return `${base} bg-orange-100 text-orange-800`;
    case 'Media':
      return `${base} bg-yellow-100 text-yellow-800`;
    case 'Baja':
      return `${base} bg-slate-100 text-slate-700`;
    default:
      return `${base} bg-slate-100 text-slate-700`;
  }
}

export const TicketTable: React.FC<Props> = ({
  tickets,
  pagination,
  loading,
  onPageChange,
  onView,
  onEdit,
  onChangeStatus,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="animate-pulse text-slate-500 text-sm">Cargando solicitudes...</div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-900 font-semibold mb-1">No se encontraron solicitudes</p>
        <p className="text-slate-500 text-sm">Ajusta los filtros o crea una nueva solicitud.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wider">Título</th>
              <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wider">Solicitante</th>
              <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wider">Categoría</th>
              <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wider">Prioridad</th>
              <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wider">Estado</th>
              <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wider">Creada</th>
              <th className="px-4 py-3 font-semibold text-slate-600 uppercase text-xs tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <tr key={t.id} data-testid={`ticket-row-${t.id}`} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900 line-clamp-1 max-w-[260px]">{t.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-1 max-w-[260px]">{t.description}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{t.applicant}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                    {t.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={priorityBadge(t.priority)}>
                    {t.priority === 'Critica' ? 'Crítica' : t.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={statusBadge(t.status)}>{t.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      title="Ver detalle"
                      onClick={() => onView(t)}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      title="Editar"
                      onClick={() => onEdit(t)}
                      disabled={t.status === 'Resuelta' || t.status === 'Cancelada'}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      title="Cambiar estado"
                      onClick={() => onChangeStatus(t)}
                      disabled={t.status === 'Resuelta' || t.status === 'Cancelada'}
                      className="p-1.5 rounded-md hover:bg-blue-100 text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button
                      title="Eliminar"
                      onClick={() => onDelete(t)}
                      className="p-1.5 rounded-md hover:bg-red-100 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Página {pagination.page} de {pagination.totalPages} — {pagination.total} resultados
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, pagination.page - 3), pagination.page + 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                    p === pagination.page
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
