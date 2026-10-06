import React, { useState, useEffect } from 'react';
import { Ticket, CreateTicketPayload, Category, Priority } from '../types/ticket';
import { X } from 'lucide-react';

interface Props {
  ticket: Ticket | null;
  onClose: () => void;
  onSubmit: (payload: CreateTicketPayload) => Promise<void>;
  submitting: boolean;
}

export const TicketFormModal: React.FC<Props> = ({ ticket, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    applicant: '',
    category: 'Software' as Category,
    priority: 'Media' as Priority,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ticket) {
      setForm({
        title: ticket.title,
        description: ticket.description,
        applicant: ticket.applicant,
        category: ticket.category,
        priority: ticket.priority,
      });
    }
  }, [ticket]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'El título es obligatorio';
    else if (form.title.trim().length < 5) e.title = 'Mínimo 5 caracteres';
    else if (form.title.length > 120) e.title = 'Máximo 120 caracteres';

    if (!form.description.trim()) e.description = 'La descripción es obligatoria';
    else if (form.description.trim().length < 10) e.description = 'Mínimo 10 caracteres';
    else if (form.description.length > 1000) e.description = 'Máximo 1000 caracteres';

    if (!form.applicant.trim()) e.applicant = 'El solicitante es obligatorio';
    else if (form.applicant.trim().length < 3) e.applicant = 'Mínimo 3 caracteres';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      applicant: form.applicant.trim(),
      category: form.category,
      priority: form.priority,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-lg text-slate-900">
            {ticket ? 'Editar solicitud' : 'Nueva solicitud de soporte'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Título *</label>
            <input
              data-testid="ticket-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Falla en impresora del piso 3"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Descripción *</label>
            <textarea
              data-testid="ticket-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe el problema con el mayor detalle posible..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1 block">Usuario solicitante *</label>
            <input
              data-testid="ticket-applicant"
              value={form.applicant}
              onChange={(e) => setForm({ ...form, applicant: e.target.value })}
              placeholder="Ej: María González"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {errors.applicant && <p className="text-xs text-red-600 mt-1">{errors.applicant}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Categoría *</label>
              <select
                data-testid="ticket-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white"
              >
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Red">Red</option>
                <option value="Accesos">Accesos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Prioridad *</label>
              <select
                data-testid="ticket-priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Critica">Crítica</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              data-testid="ticket-submit"
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Guardando...' : ticket ? 'Guardar cambios' : 'Crear solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
