interface SuccessModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

export function SuccessModal({ title, message, onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </div>

        <h3 className="text-center text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          Zavřít
        </button>
      </div>
    </div>
  );
}
