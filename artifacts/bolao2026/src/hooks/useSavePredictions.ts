import { useCallback, useRef, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useSavePredictions() {
  const { token } = useAuthContext();
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const savePredictions = useCallback(
    async (predictions?: any) => {
      if (!token) {
        setError("Usuário não autenticado");
        return false;
      }

      // Limpar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setStatus("saving");
      setError(null);

      try {
        const response = await fetch("/api/predictions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(predictions),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erro ao salvar previsões");
        }

        setStatus("saved");

        // Resetar status após 2 segundos
        timeoutRef.current = setTimeout(() => {
          setStatus("idle");
        }, 2000);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        setStatus("error");

        // Resetar status após 3 segundos
        timeoutRef.current = setTimeout(() => {
          setStatus("idle");
          setError(null);
        }, 3000);

        return false;
      }
    },
    [token]
  );

  return { savePredictions, status, error };
}
