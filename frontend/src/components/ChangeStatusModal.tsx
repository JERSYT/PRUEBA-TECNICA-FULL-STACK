import React, { useState } from 'react';
import { Ticket, Status } from '../types/ticket';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onSubmit: (newStatus: Status, responsible: string, observation: string) => Promise<void>;
  submitting: boolean;
}

function allowedTransitions(status: Status): Status[] {
  if (status === 'Pendiente') return ['En_progreso', 'Cancelada'];
  if (status === 'En_progreso') return ['Resuelta', 'Cancelada'];
  return [];
}

export const ChangeStatusModal: React.FC<Props> = ({ ticket, onClose, onSubmit, submitting }) => {
  const [newStatus, setNewStatus] = useState<Status>(allowedTransitions(ticket.status)[0] ?? 'En_progreso');
  const [responsible, setResponsible] = useState('');
  const [observation, setObservation] = useState('');
  const [error, setError] = useState('');

  const isCriticalResolve = ticket.priority === 'Critica' && newStatus === 'Resuelta';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (responsible.trim().length < 3) {
      setError('El responsable es obligatorio (mínimo 3 caracteres).');
      return;
    }
    if (isCriticalResolve && observation.trim().length === 0) {
      setError('Una solicitud con prioridad Crítica requiere observación obligatoria al resolverse.');
      return;
    }
    setError('');
    await onSubmit(newStatus, responsible.trim(), observation.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-lg">Cambiar estado</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="font-semibold text-slate-900">{ticket.title}</span>
            <br />
            Estado actual:{' '}
            <span className="font-semibold">{ticket.status.replace('_', ' ')}</span>
            {'  '}· Prioridad:{' '}
            <span className="font-semibold">
              {ticket.priority === 'Critica' ? 'Crítica' : ticket.priority}
            </span>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1">Nuevo estado *</label>
            <select
              data-testid="status-new"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as Status)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white"
            >
              {allowedTransitions(ticket.status).map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1">Responsable *</label>
            <input
              data-testid="status-responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Ej: Ing. Laura Gómez"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1">
              Observación {isCriticalResolve ? '*' : '(opcional)'}
            </label>
            <textarea
              data-testid="status-observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              placeholder={
                isCriticalResolve
                  ? 'Obligatoria: describe la solución aplicada...'
                  : 'Describe el motivo del cambio...'
              }
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {isCriticalResolve && (
            <div className="flex gap-2 items-start text-xs bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                Regla de negocio: las solicitudes con prioridad <strong>Crítica</strong> exigen
                observación obligatoria al pasar a <strong>Resuelta</strong>.
              </p>
            </div>
          )}

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              data-testid="status-submit"
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
            >
              {submitting ? 'Actualizando...' : 'Confirmar cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
