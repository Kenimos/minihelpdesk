import { useEffect, useMemo, useState } from 'react';
import type { Ticket, TicketCategory, TicketStatus } from './types/ticket';
import * as api from './services/api';
import { TicketForm } from './components/TicketForm';
import { TicketCard } from './components/TicketCard';
import { TicketDetail } from './components/TicketDetail';
import { SuccessModal } from './components/SuccessModal';

type SortKey = 'createdAt' | 'priority' | 'category' | 'status';

const PRIORITY_ORDER: Record<Ticket['priority'], number> = { High: 0, Medium: 1, Low: 2 };
const STATUS_ORDER: Record<TicketStatus, number> = { New: 0, InProgress: 1, Resolved: 2 };

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'createdAt', label: 'Data vytvoření (nejnovější)' },
  { value: 'priority', label: 'Priority (nejvyšší první)' },
  { value: 'category', label: 'Kategorie (A–Z)' },
  { value: 'status', label: 'Stavu (Nový → Vyřešený)' },
];

const STATUS_FILTER_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'New', label: 'Nový' },
  { value: 'InProgress', label: 'V řešení' },
  { value: 'Resolved', label: 'Vyřešený' },
];

const CATEGORY_FILTER_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Software', label: 'Software' },
  { value: 'Network', label: 'Network' },
  { value: 'Access', label: 'Access' },
  { value: 'Other', label: 'Other' },
];

const PRIORITY_FILTER_OPTIONS: { value: Ticket['priority']; label: string }[] = [
  { value: 'Low', label: 'Nízká' },
  { value: 'Medium', label: 'Střední' },
  { value: 'High', label: 'Vysoká' },
];

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function sortTickets(tickets: Ticket[], sortKey: SortKey): Ticket[] {
  const sorted = [...tickets];

  switch (sortKey) {
    case 'priority':
      sorted.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
      break;
    case 'category':
      sorted.sort((a, b) => a.category.localeCompare(b.category));
      break;
    case 'status':
      sorted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      break;
    case 'createdAt':
    default:
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  return sorted;
}

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [statusFilter, setStatusFilter] = useState<Set<TicketStatus>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<TicketCategory>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<Ticket['priority']>>(new Set());

  const loadTickets = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.getTickets();
      setTickets(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Načtení ticketů selhalo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  const filteredTickets = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        (statusFilter.size === 0 || statusFilter.has(ticket.status)) &&
        (categoryFilter.size === 0 || categoryFilter.has(ticket.category)) &&
        (priorityFilter.size === 0 || priorityFilter.has(ticket.priority)),
    );
  }, [tickets, statusFilter, categoryFilter, priorityFilter]);

  const sortedTickets = useMemo(() => sortTickets(filteredTickets, sortKey), [filteredTickets, sortKey]);

  const handleCreateTicket = async (payload: { subject: string; description: string }) => {
    await api.createTicket(payload);
    await loadTickets();
    setSuccessMessage('Ticket byl úspěšně vytvořen a AI mu přiřadila kategorii, prioritu a návrh odpovědi.');
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    await api.updateTicketStatus(selectedTicket.id, status);
    await loadTickets();
  };

  const handleSaveFinalResponse = async (finalResponse: string) => {
    if (!selectedTicket) return;
    await api.updateFinalResponse(selectedTicket.id, finalResponse);

    // ulozeni odpovedi = agent na ticketu pracuje, posunout stav automaticky
    if (selectedTicket.status !== 'InProgress') {
      await api.updateTicketStatus(selectedTicket.id, 'InProgress');
    }

    await loadTickets();
    setSuccessMessage('Finální odpověď byla uložena.');
  };

  const handleRecallLlm = async () => {
    if (!selectedTicket) return;
    await api.recallLlm(selectedTicket.id);
    await loadTickets();
  };

  const handleDelete = async () => {
    if (!selectedTicket) return;
    await api.deleteTicket(selectedTicket.id);
    setSelectedTicketId(null);
    await loadTickets();
  };

  const hasActiveFilter = statusFilter.size > 0 || categoryFilter.size > 0 || priorityFilter.size > 0;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-100">Mini Helpdesk</h1>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <TicketForm onSubmit={handleCreateTicket} />
        </div>

        <div className="md:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tickety</h2>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-slate-500 dark:text-slate-400">
                Řadit podle
              </label>
              <select
                id="sort"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Stav:</span>
              {STATUS_FILTER_OPTIONS.map((option) => {
                const isActive = statusFilter.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter((prev) => toggleInSet(prev, option.value))}
                    aria-pressed={isActive}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${isActive
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kategorie:</span>
              {CATEGORY_FILTER_OPTIONS.map((option) => {
                const isActive = categoryFilter.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategoryFilter((prev) => toggleInSet(prev, option.value))}
                    aria-pressed={isActive}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${isActive
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Priorita:</span>
              {PRIORITY_FILTER_OPTIONS.map((option) => {
                const isActive = priorityFilter.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriorityFilter((prev) => toggleInSet(prev, option.value))}
                    aria-pressed={isActive}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${isActive
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Načítám tickety…</p>}

          {loadError && <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>}

          {!isLoading && !loadError && tickets.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Zatím nejsou žádné tickety.</p>
          )}

          {!isLoading && !loadError && tickets.length > 0 && sortedTickets.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasActiveFilter ? 'Žádné tickety neodpovídají filtru.' : 'Zatím nejsou žádné tickety.'}
            </p>
          )}

          <div className="space-y-3">
            {sortedTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicketId(ticket.id)} />
            ))}
          </div>
        </div>
      </div>

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
          onStatusChange={handleStatusChange}
          onSaveFinalResponse={handleSaveFinalResponse}
          onRecallLlm={handleRecallLlm}
          onDelete={handleDelete}
        />
      )}

      {successMessage && (
        <SuccessModal title="Hotovo" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
    </div>
  );
}

export default App;
