import { useEffect, useState } from 'react';
import type { Ticket, TicketStatus } from './types/ticket';
import * as api from './services/api';
import { TicketForm } from './components/TicketForm';
import { TicketCard } from './components/TicketCard';
import { TicketDetail } from './components/TicketDetail';
import { SuccessModal } from './components/SuccessModal';

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Mini Helpdesk</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Evidence IT ticketů s automatickou AI triáží.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <TicketForm onSubmit={handleCreateTicket} />
        </div>

        <div className="md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Tickety</h2>

          {isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Načítám tickety…</p>}

          {loadError && <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>}

          {!isLoading && !loadError && tickets.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Zatím nejsou žádné tickety.</p>
          )}

          <div className="space-y-3">
            {tickets.map((ticket) => (
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
