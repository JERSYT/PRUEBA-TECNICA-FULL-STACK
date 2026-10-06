import React from 'react';
import { TicketStats } from '../types/ticket';
import { Clock, PlayCircle, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react';

interface Props {
  stats: TicketStats | null;
  activeStatusFilter: string;
  onSelectStatus: (status: string) => void;
}

export const StatsOverview: React.FC<Props> = ({ stats, activeStatusFilter, onSelectStatus }) => {
  if (!stats) return null;

  const cards = [
    {
      label: 'Todas las Solicitudes',
      count: stats.total,
      statusKey: '',
      icon: LayoutGrid,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
      activeRing: 'ring-2 ring-slate-800',
    },
    {
      label: 'Pendientes',
      count: stats.pending,
      statusKey: 'Pendiente',
      icon: Clock,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      activeRing: 'ring-2 ring-amber-600',
    },
    {
      label: 'En Progreso',
      count: stats.inProgress,
      statusKey: 'En_progreso',
      icon: PlayCircle,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      activeRing: 'ring-2 ring-blue-600',
    },
    {
      label: 'Resueltas',
      count: stats.resolved,
      statusKey: 'Resuelta',
      icon: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      activeRing: 'ring-2 ring-emerald-600',
    },
    {
      label: 'Canceladas',
      count: stats.cancelled,
      statusKey: 'Cancelada',
      icon: XCircle,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      activeRing: 'ring-2 ring-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeStatusFilter === card.statusKey;
        return (
          <button
            key={card.label}
            onClick={() => onSelectStatus(card.statusKey)}
            className={`p-4 rounded-xl border text-left transition-all duration-150 hover:shadow-sm ${
              card.color
            } ${isActive ? card.activeRing : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                {card.label}
              </span>
              <Icon className="w-4 h-4 opacity-75" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{card.count}</div>
          </button>
        );
      })}
    </div>
  );
};
