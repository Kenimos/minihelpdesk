import { useState } from 'react';
import type { Ticket, TicketStatus } from '../types/ticket';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'New', label: 'Nový' },
  { value: 'InProgress', label: 'V řešení' },
  { value: 'Resolved', label: 'Vyřešený' },
];

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
  onStatusChange: (status: TicketStatus) => Promise<void>;
  onSaveFinalResponse: (finalResponse: string) => Promise<void>;
  onRecallLlm: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function TicketDetail({
  ticket,
  onClose,
  onStatusChange,
  onSaveFinalResponse,
  onRecallLlm,
  onDelete,
}: TicketDetailProps) {
  const [finalResponse, setFinalResponse] = useState(ticket.finalResponse ?? ticket.suggestedResponse ?? '');
  const [isSavingResponse, setIsSavingResponse] = useState(false);
  const [isRecalling, setIsRecalling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createdAt = new Date(ticket.createdAt).toLocaleString('cs-CZ');

  const handleStatusChange = async (status: TicketStatus) => {
    setError(null);
    try {
      await onStatusChange(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Změna stavu selhala.');
    }
  };

  const handleSaveResponse = async () => {
    setError(null);
    setIsSavingResponse(true);
    try {
      await onSaveFinalResponse(finalResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uložení odpovědi selhalo.');
    } finally {
      setIsSavingResponse(false);
    }
  };

  const handleRecall = async () => {
    setError(null);
    setIsRecalling(true);
    try {
      await onRecallLlm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Přegenerování AI návrhu selhalo.');
    } finally {
      setIsRecalling(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Smazání ticketu selhalo.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{ticket.subject}</h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Vytvořeno {createdAt}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Zavřít
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {ticket.category}
            </span>
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>

          <div>
            <h3 className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Popis</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{ticket.description}</p>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Stav</h3>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleStatusChange(option.value)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${
                    ticket.status === option.value
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Návrh odpovědi od AI</h3>
              <button
                type="button"
                onClick={handleRecall}
                disabled={isRecalling}
                className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline disabled:opacity-50 dark:text-slate-400"
              >
                {isRecalling ? 'Generuji…' : 'Přegenerovat'}
              </button>
            </div>
            <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              {ticket.suggestedResponse ?? 'AI zatím nevygenerovala žádný návrh.'}
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              Finální odpověď pro uživatele
            </h3>
            <textarea
              value={finalResponse}
              onChange={(event) => setFinalResponse(event.target.value)}
              rows={4}
              placeholder="Upravte návrh AI, nebo napište vlastní odpověď."
              className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleSaveResponse}
              disabled={isSavingResponse}
              className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              {isSavingResponse ? 'Ukládám…' : 'Uložit odpověď'}
            </button>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
            >
              {isDeleting ? 'Mažu…' : 'Smazat ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
