import React from 'react';
import { Search, RotateCcw, ArrowUpDown } from 'lucide-react';
import { Category, Priority, Status } from '../types/ticket';

export interface FilterState {
  search: string;
  category: string;
  priority: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const CATEGORIES: Category[] = ['Hardware', 'Software', 'Red', 'Accesos', 'Otros'];
const PRIORITIES: Priority[] = ['Baja', 'Media', 'Alta', 'Critica'];
const STATUSES: Status[] = ['Pendiente', 'En_progreso', 'Resuelta', 'Cancelada'];

export const TicketFilters: React.FC<Props> = ({ filters, onChange, onReset }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            data-testid="search-input"
            type="text"
            placeholder="Buscar por título, descripción o solicitante..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <select
            data-testid="category-filter"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Todas categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            data-testid="priority-filter"
            value={filters.priority}
            onChange={(e) => onChange({ ...filters, priority: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Todas prioridades</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p === 'Critica' ? 'Crítica' : p}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            data-testid="status-filter"
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Todos estados</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex gap-2">
          <select
            data-testid="sort-select"
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(':');
              onChange({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
            }}
            className="flex-1 px-2 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="createdAt:desc">Más recientes</option>
            <option value="createdAt:asc">Más antiguos</option>
            <option value="title:asc">Título A-Z</option>
            <option value="title:desc">Título Z-A</option>
            <option value="updatedAt:desc">Actualizados</option>
          </select>
          <button
            onClick={() => onChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            title="Invertir orden"
            className="px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {(filters.search || filters.category || filters.priority || filters.status) && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};
