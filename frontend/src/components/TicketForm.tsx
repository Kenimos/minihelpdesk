import { useState } from 'react';
import type { FormEvent } from 'react';

interface TicketFormProps {
  onSubmit: (payload: { subject: string; description: string }) => Promise<void>;
}

const MIN_SUBJECT_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 10;

function validateSubject(value: string): string | null {
  if (!value.trim()) return 'Předmět je povinný.';
  if (value.trim().length < MIN_SUBJECT_LENGTH) return `Předmět musí mít alespoň ${MIN_SUBJECT_LENGTH} znaky.`;
  return null;
}

function validateDescription(value: string): string | null {
  if (!value.trim()) return 'Popis je povinný.';
  if (value.trim().length < MIN_DESCRIPTION_LENGTH) {
    return `Popis musí mít alespoň ${MIN_DESCRIPTION_LENGTH} znaků, ať má AI z čeho vycházet.`;
  }
  return null;
}

export function TicketForm({ onSubmit }: TicketFormProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState<{ subject: boolean; description: boolean }>({
    subject: false,
    description: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const subjectError = validateSubject(subject);
  const descriptionError = validateDescription(description);
  const isFormValid = !subjectError && !descriptionError;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ subject: true, description: true });

    if (!isFormValid) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ subject: subject.trim(), description: description.trim() });
      setSubject('');
      setDescription('');
      setTouched({ subject: false, description: false });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Vytvoření ticketu selhalo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSubjectError = touched.subject && subjectError;
  const showDescriptionError = touched.description && descriptionError;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Nový ticket
      </h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Předmět
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, subject: true }))}
            placeholder="Např. Nefunguje tiskárna"
            aria-invalid={Boolean(showSubjectError)}
            className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-950 dark:text-slate-100 ${
              showSubjectError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60'
                : 'border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:border-slate-700'
            }`}
          />
          {showSubjectError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{subjectError}</p>}
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Popis
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
            placeholder="Popište prosím co nejpodrobněji, s čím potřebujete pomoct."
            rows={4}
            aria-invalid={Boolean(showDescriptionError)}
            className={`w-full resize-none rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-950 dark:text-slate-100 ${
              showDescriptionError
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500/60'
                : 'border-slate-300 focus:border-slate-500 focus:ring-slate-500 dark:border-slate-700'
            }`}
          />
          {showDescriptionError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{descriptionError}</p>
          )}
        </div>

        {submitError && <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {isSubmitting ? 'Odesílám…' : 'Vytvořit ticket'}
        </button>
      </div>
    </form>
  );
}
