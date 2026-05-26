import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useSimulator } from "@/contexts/SimulatorContext";
import { TEAMS } from "@/lib/worldCupData";

export function SharePredictions() {
  const { state } = useSimulator();
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    const finalists = state.finalistPrediction
      .filter(Boolean)
      .map(id => TEAMS[id!]?.name || "?")
      .join(" vs ");
    
    const champion = state.finalPrediction ? TEAMS[state.finalPrediction]?.name : "?";
    
    return `🏆 Minhas previsões para a Copa 2026:\n\n` +
           `🥇 Campeão: ${champion}\n` +
           `🏅 Finalistas: ${finalists || "Não definido"}\n\n` +
           `Faça suas previsões também! 🎯`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/20 border border-green-900/50 hover:bg-green-900/30 transition-all text-xs font-mono text-green-400"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copiar
          </>
        )}
      </button>
      <button
        onClick={() => {
          const text = generateShareText();
          if (navigator.share) {
            navigator.share({ text, title: "Copa 2026 - Minhas Previsões" });
          }
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/20 border border-green-900/50 hover:bg-green-900/30 transition-all text-xs font-mono text-green-400"
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </button>
    </div>
  );
}
