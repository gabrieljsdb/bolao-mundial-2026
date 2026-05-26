import { Check, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface SavingIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  message?: string;
}

export function SavingIndicator({ status, message }: SavingIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== "idle") {
      setShow(true);
      if (status === "saved") {
        const timer = setTimeout(() => setShow(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/80 border border-green-900/50 backdrop-blur-sm">
      {status === "saving" && (
        <>
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-green-400 font-mono">Salvando...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-400 font-mono">Salvo com sucesso</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-400 font-mono">{message || "Erro ao salvar"}</span>
        </>
      )}
    </div>
  );
}
