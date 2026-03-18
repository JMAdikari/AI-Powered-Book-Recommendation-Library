import { useState, useCallback } from "react";

// ── Hook ────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return { toasts, show };
}

// ── Component ────────────────────────────────────────────────────────────────
const STYLES = {
  success: "bg-green-600 text-white",
  error:   "bg-red-600 text-white",
  info:    "bg-brand text-white",
};

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium
                      transition-all duration-300 ${STYLES[t.type] || STYLES.info}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
