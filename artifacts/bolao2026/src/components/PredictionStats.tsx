import { useSimulator } from "@/contexts/SimulatorContext";
import { GROUPS, GROUP_MATCHES } from "@/lib/worldCupData";
import { BarChart3, CheckCircle2, AlertCircle } from "lucide-react";

export function PredictionStats() {
  const { state } = useSimulator();

  const countGroupMatches = () => {
    let total = 0;
    let predicted = 0;
    
    GROUPS.forEach(group => {
      const groupPred = state.groupPredictions[group.id];
      if (groupPred?.matchPredictions) {
        const matches = groupPred.matchPredictions.filter(m => 
          GROUP_MATCHES.find(gm => gm.id === m.matchId && group.teams.includes(gm.homeTeamId))
        );
        total += matches.length;
        predicted += matches.filter(m => m.homeScore !== null && m.awayScore !== null).length;
      }
    });
    
    return { total, predicted };
  };

  const countKnockoutMatches = () => {
    const sr = Object.values(state.secondRoundPredictions).filter(Boolean).length;
    const r16 = Object.values(state.r16Predictions).filter(Boolean).length;
    const qf = Object.values(state.qfPredictions).filter(Boolean).length;
    const sf = Object.values(state.sfPredictions).filter(Boolean).length;
    const finalists = Array.isArray(state.finalistPrediction) ? state.finalistPrediction.filter(Boolean).length : 0;
    const champion = state.finalPrediction ? 1 : 0;

    return {
      total: sr + r16 + qf + sf + finalists + champion,
      items: { sr, r16, qf, sf, finalists, champion }
    };
  };

  const groupStats = countGroupMatches();
  const knockoutStats = countKnockoutMatches();
  const totalPredictions = groupStats.predicted + knockoutStats.total;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-green-600 uppercase">Fase de Grupos</span>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </div>
        <div className="text-2xl font-bebas text-green-400">
          {groupStats.predicted}/{groupStats.total}
        </div>
        <div className="text-[10px] text-green-700 mt-1">Placar definidos</div>
      </div>

      <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-yellow-600 uppercase">Fase Eliminatória</span>
          <BarChart3 className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="text-2xl font-bebas text-yellow-400">
          {knockoutStats.total}
        </div>
        <div className="text-[10px] text-yellow-700 mt-1">Previsões definidas</div>
      </div>

      <div className="bg-black/40 border border-green-900/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-blue-600 uppercase">Total</span>
          <AlertCircle className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bebas text-blue-400">
          {totalPredictions}
        </div>
        <div className="text-[10px] text-blue-700 mt-1">Previsões no total</div>
      </div>
    </div>
  );
}
