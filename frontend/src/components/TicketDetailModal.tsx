import React, { useEffect, useState } from 'react';
import { Ticket, TicketHistory } from '../types/ticket';
import { ticketApi } from '../services/ticketApi';
import { X, History, User, CalendarClock } from 'lucide-react';

interface Props {
  ticket: Ticket;
  onClose: () => void;
}

export const TicketDetailModal: React.FC<Props> = ({ ticket, onClose }) => {
  const [history, setHistory] = useState<TicketHistory[]>(ticket.history ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const h = await ticketApi.getTicketHistory(ticket.id);
        setHistory(h);
      } catch {
        setHistory(ticket.history ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-lg">Detalle de la solicitud</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{ticket.title}</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-slate-50 border rounded-lg p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Solicitante</p>
              <p className="font-semibold mt-0.5">{ticket.applicant}</p>
            </div>
            <div className="bg-slate-50 border rounded-lg p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Categoría</p>
              <p className="font-semibold mt-0.5">{ticket.category}</p>
            </div>
            <div className="bg-slate-50 border rounded-lg p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Prioridad</p>
              <p className="font-semibold mt-0.5">
                {ticket.priority === 'Critica' ? 'Crítica' : ticket.priority}
              </p>
            </div>
            <div className="bg-slate-50 border rounded-lg p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Estado</p>
              <p className="font-semibold mt-0.5">{ticket.status.replace('_', ' ')}</p>
            </div>
          </div>

          <div>
            <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-3">
              <History className="w-4 h-4" /> Historial de cambios ({history.length})
            </h4>
            {loading ? (
              <p className="text-sm text-slate-500">Cargando historial...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500">Sin movimientos registrados.</p>
            ) : (
              <ol className="relative border-l-2 border-slate-200 ml-2 space-y-4">
                {history.map((h) => (
                  <li key={h.id} className="ml-4">
                    <span className="absolute -left-[7px] mt-1 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white" />
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                      <p className="text-sm font-semibold">
                        {h.previousStatus.replace('_', ' ')} → {h.newStatus.replace('_', ' ')}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {h.responsible}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {new Date(h.changedAt).toLocaleString('es-CO')}
                        </span>
                      </div>
                      {h.observation && (
                        <p className="text-xs text-slate-700 mt-2 bg-white border rounded-md p-2">
                          “{h.observation}”
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
