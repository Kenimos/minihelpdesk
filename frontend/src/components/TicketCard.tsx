import type { Ticket } from '../types/ticket';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const createdAt = new Date(ticket.createdAt).toLocaleString('cs-CZ');

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate font-medium text-slate-900 dark:text-slate-100">{ticket.subject}</h3>
        <StatusBadge status={ticket.status} />
      </div>

      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{ticket.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {ticket.category}
        </span>
        <PriorityBadge priority={ticket.priority} />
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{createdAt}</span>
      </div>
    </button>
  );
}
