import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSimulator } from "@/contexts/SimulatorContext";
import { GROUPS, TEAMS, GROUP_MATCHES } from "@/lib/worldCupData";
import { SECOND_ROUND_MATCHUPS, R16_MATCHUPS, QF_MATCHUPS, SF_MATCHUPS } from "@/lib/knockoutData";
import { Loader2, RotateCcw, LogOut, Sun, CheckCircle2, Trophy, Users, LayoutGrid, ClipboardList, ChevronDown, ChevronUp, Medal, TrendingUp, AlertCircle, ChevronRight, Shield, Save } from "lucide-react";
import { ScoreInput } from "@/components/ScoreInput";
import { useLocation } from "wouter";

function KnockoutCard({ 
  label, 
  points, 
  teamAId, 
  teamBId, 
  winnerId, 
  onSelect, 
  disabled,
  idPrefix
}: { 
  label: string; 
  points: string; 
  teamAId: string | null; 
  teamBId: string | null; 
  winnerId: string | null; 
  onSelect: (teamId: string) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const teamA = teamAId ? TEAMS[teamAId] : null;
  const teamB = teamBId ? TEAMS[teamBId] : null;

  return (
    <div className="bg-black/40 border border-green-900/30 rounded-lg overflow-hidden flex flex-col">
      <div className="bg-black/60 px-3 py-1.5 flex justify-between items-center border-b border-green-900/30">
        <span className="text-[10px] font-mono text-green-600 font-bold uppercase">{idPrefix || ""} {label}</span>
        <span className="text-[9px] font-oswald text-yellow-600/70 uppercase">+{points} por acerto</span>
      </div>
      <div className="p-2 space-y-1">
        <button
          onClick={() => teamAId && onSelect(teamAId)}
          disabled={disabled || !teamAId}
          className={`w-full flex items-center justify-between p-2.5 rounded transition-all ${
            winnerId === teamAId && teamAId
              ? "bg-green-900/40 border border-green-500/50 text-white"
              : "bg-black/20 border border-transparent text-green-900 hover:border-green-900/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-oswald text-green-700 font-bold uppercase w-4">{teamA?.shortName || "??"}</span>
            <span className="text-xs font-oswald uppercase tracking-wider text-green-100">{teamA?.name || "A DEFINIR"}</span>
          </div>
          {winnerId === teamAId && teamAId && <ChevronRight className="w-3 h-3 text-green-500" />}
        </button>

        <button
          onClick={() => teamBId && onSelect(teamBId)}
          disabled={disabled || !teamBId}
          className={`w-full flex items-center justify-between p-2.5 rounded transition-all ${
            winnerId === teamBId && teamBId
              ? "bg-green-900/40 border border-green-500/50 text-white"
              : "bg-black/20 border border-transparent text-green-900 hover:border-green-900/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-oswald text-green-700 font-bold uppercase w-4">{teamB?.shortName || "??"}</span>
            <span className="text-xs font-oswald uppercase tracking-wider text-green-100">{teamB?.name || "A DEFINIR"}</span>
          </div>
          {winnerId === teamBId && teamBId && <ChevronRight className="w-3 h-3 text-green-500" />}
        </button>
      </div>
    </div>
  );
}

function KnockoutSection() {
  const {
    state, isPredictionsLocked, getBestThirds,
    setSecondRoundWinner, setR16Winner, setQFWinner, setSFWinner, setFinalist, setChampion,
    finalists, champion
  } = useSimulator();

  const bestThirds = getBestThirds();

  function getQualifiedTeam(groupId: string, pos: number): string | null {
    return state.groupPredictions[groupId]?.qualified[pos] || null;
  }

  return (
    <div className="space-y-20 pb-32">
      {/* SEGUNDA RODADA */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bebas text-green-500 tracking-[0.3em] uppercase">Segunda Rodada (32 Times)</h2>
          <div className="h-px w-32 bg-green-900/50 mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECOND_ROUND_MATCHUPS.map((m: any) => {
            const teamA = m.isThirdA ? bestThirds[m.thirdIdxA] : getQualifiedTeam(m.groupA, m.posA);
            const teamB = m.isThirdB ? bestThirds[m.thirdIdx] : getQualifiedTeam(m.groupB, m.posB);
            return (
              <KnockoutCard
                key={m.id}
                label={m.label}
                points="1pt"
                teamAId={teamA}
                teamBId={teamB}
                winnerId={state.secondRoundPredictions[m.id]}
                onSelect={(id) => setSecondRoundWinner(m.id, id)}
                disabled={isPredictionsLocked}
              />
            );
          })}
        </div>
      </div>

      {/* OITAVAS */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bebas text-green-500 tracking-[0.3em] uppercase">Oitavas de Final</h2>
          <div className="h-px w-32 bg-green-900/50 mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {R16_MATCHUPS.map(m => (
            <KnockoutCard
              key={m.id}
              idPrefix="OI"
              label={m.label.split(" ")[1]}
              points="2pts"
              teamAId={state.secondRoundPredictions[m.sr1] || null}
              teamBId={state.secondRoundPredictions[m.sr2] || null}
              winnerId={state.r16Predictions[m.id]}
              onSelect={(id) => setR16Winner(m.id, id)}
              disabled={isPredictionsLocked}
            />
          ))}
        </div>
      </div>

      {/* QUARTAS */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bebas text-green-500 tracking-[0.3em] uppercase">Quartas de Final</h2>
          <div className="h-px w-32 bg-green-900/50 mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QF_MATCHUPS.map(m => (
            <KnockoutCard
              key={m.id}
              idPrefix="QF"
              label={m.label.split(" ")[1]}
              points="4pts"
              teamAId={state.r16Predictions[m.r16A] || null}
              teamBId={state.r16Predictions[m.r16B] || null}
              winnerId={state.qfPredictions[m.id]}
              onSelect={(id) => setQFWinner(m.id, id)}
              disabled={isPredictionsLocked}
            />
          ))}
        </div>
      </div>

      {/* SEMIFINAIS */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bebas text-green-500 tracking-[0.3em] uppercase">Semifinais</h2>
          <div className="h-px w-32 bg-green-900/50 mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {SF_MATCHUPS.map(m => (
            <KnockoutCard
              key={m.id}
              idPrefix="SF"
              label={m.label.split(" ")[1]}
              points="8pts"
              teamAId={state.qfPredictions[m.qfA] || null}
              teamBId={state.qfPredictions[m.qfB] || null}
              winnerId={state.sfPredictions[m.id]}
              onSelect={(id) => setSFWinner(m.id, id)}
              disabled={isPredictionsLocked}
            />
          ))}
        </div>
      </div>

      {/* GRANDE FINAL */}
      <div className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bebas text-yellow-500 tracking-[0.4em] uppercase flex items-center justify-center gap-4">
            <Trophy className="w-6 h-6" /> GRANDE FINAL
          </h2>
        </div>
        
        <div className="max-w-2xl mx-auto bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-8 shadow-[0_0_50px_rgba(234,179,8,0.1)]">
          <div className="bg-black/60 px-4 py-2 rounded-full border border-yellow-900/30 w-fit mx-auto mb-8 flex items-center gap-3">
            <span className="text-[10px] font-oswald text-yellow-600 uppercase tracking-widest">Selecione os 2 finalistas</span>
            <span className="text-[10px] font-mono text-yellow-700 font-bold">+10pts por acerto</span>
          </div>

          <div className="flex gap-6 mb-12">
            {[0, 1].map(slot => {
              const sfWinner = slot === 0 ? state.sfPredictions["sf_1"] : state.sfPredictions["sf_2"];
              const team = sfWinner ? TEAMS[sfWinner] : null;
              return (
                <button
                  key={slot}
                  onClick={() => sfWinner && setFinalist(slot as 0 | 1, sfWinner)}
                  disabled={isPredictionsLocked || !sfWinner}
                  className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all ${
                    finalists[slot] === sfWinner && sfWinner
                      ? "bg-yellow-500/20 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                      : "bg-black/40 border-yellow-900/20 grayscale opacity-50"
                  }`}
                >
                  <span className="text-2xl font-bebas text-yellow-600 uppercase tracking-widest">{team?.shortName || "??"}</span>
                  <span className="text-lg font-oswald text-white uppercase">{team?.name || "A DEFINIR"}</span>
                </button>
              );
            })}
          </div>

          {finalists.some(f => f !== null) && (
            <div className="pt-8 border-t border-yellow-500/10 space-y-4">
              <p className="text-center text-[10px] font-oswald text-yellow-700 uppercase tracking-widest mb-6">Quem será o campeão? (+20pts)</p>
              <div className="grid grid-cols-1 gap-4">
                {finalists.map((teamId, i) => teamId && (
                  <button
                    key={i}
                    onClick={() => setChampion(teamId)}
                    disabled={isPredictionsLocked}
                    className={`w-full py-5 rounded-lg border-2 transition-all flex items-center justify-center gap-6 ${
                      champion === teamId
                        ? "bg-yellow-500 border-yellow-300 text-black font-bold scale-105 shadow-[0_0_40px_rgba(234,179,8,0.5)]"
                        : "bg-black/40 border-yellow-900/30 text-yellow-500 hover:border-yellow-500"
                    }`}
                  >
                    <span className="text-4xl">{TEAMS[teamId].flag}</span>
                    <span className="text-3xl font-bebas tracking-[0.2em] uppercase">{TEAMS[teamId].name}</span>
                    {champion === teamId && <Trophy className="w-8 h-8" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RankingTab() {
  const { user } = useAuthContext();
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ranking")
      .then(res => res.json())
      .then(data => {
        setRanking(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
      <p className="text-green-700 font-oswald uppercase tracking-widest">Carregando Ranking Global...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-bebas text-green-400 uppercase tracking-[0.2em]">RANKING GLOBAL</h2>
        <div className="h-1 w-32 bg-green-700 mx-auto mt-4 rounded-full" />
        <p className="mt-6 text-xs font-oswald text-green-700 uppercase tracking-wider">
          Acompanhe a pontuação de todos os participantes em tempo real
        </p>
      </div>

      <div className="bg-[#081a08]/80 border border-green-900/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-green-900/30">
              <th className="p-6 font-bebas text-xl text-green-600 tracking-widest uppercase w-20 text-center">Pos</th>
              <th className="p-6 font-bebas text-xl text-green-600 tracking-widest uppercase">Participante</th>
              <th className="p-6 font-bebas text-xl text-green-600 tracking-widest uppercase text-right">Pontos</th>
            </tr>
          </thead>
          <tbody className="font-oswald uppercase tracking-wider">
            {ranking.map((player, index) => {
              const isMe = player.id === user?.id;
              const isTop3 = index < 3;
              return (
                <tr key={player.id} className={`border-b border-green-900/10 transition-colors ${isMe ? "bg-green-500/10" : "hover:bg-white/5"}`}>
                  <td className="p-6 text-center">
                    {index === 0 && <Medal className="w-6 h-6 text-yellow-500 mx-auto" />}
                    {index === 1 && <Medal className="w-6 h-6 text-gray-400 mx-auto" />}
                    {index === 2 && <Medal className="w-6 h-6 text-amber-700 mx-auto" />}
                    {index > 2 && <span className="text-xl font-bebas text-green-900">{index + 1}º</span>}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isMe ? "bg-green-500 text-black" : "bg-green-900/30 text-green-500"}`}>
                        {player.name.substring(0, 2)}
                      </div>
                      <div>
                        <span className={`text-lg ${isMe ? "text-green-400 font-bold" : "text-green-100"}`}>
                          {player.name}
                        </span>
                        {isMe && <span className="ml-2 text-[10px] bg-green-500 text-black px-1.5 py-0.5 rounded font-bold">VOCÊ</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <span className={`text-2xl font-bebas ${isTop3 ? "text-yellow-500" : "text-green-400"}`}>
                      {player.score} <span className="text-[10px] text-green-900 ml-1">PTS</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupCard({ groupId }: { groupId: string }) {
  const { state, setMatchPrediction, toggleQualified, isPredictionsLocked } = useSimulator();
  const [isExpanded, setIsExpanded] = useState(false);
  const group = GROUPS.find(g => g.id === groupId)!;
  const groupPred = state.groupPredictions[groupId];
  
  const matches = GROUP_MATCHES.filter(m => group.teams.includes(m.homeTeamId));
  const completedMatches = groupPred?.matchPredictions.filter(p => p.homeScore !== null && p.awayScore !== null).length || 0;
  const isComplete = completedMatches === 6;

  const stats: Record<string, { pts: number; gd: number; gs: number }> = {};
  group.teams.forEach(id => stats[id] = { pts: 0, gd: 0, gs: 0 });

  groupPred?.matchPredictions.forEach(m => {
    if (m.homeScore === null || m.awayScore === null) return;
    const match = GROUP_MATCHES.find(gm => gm.id === m.matchId);
    if (!match) return;

    stats[match.homeTeamId].gs += m.homeScore;
    stats[match.awayTeamId].gs += m.awayScore;
    stats[match.homeTeamId].gd += (m.homeScore - m.awayScore);
    stats[match.awayTeamId].gd += (m.awayScore - m.homeScore);

    if (m.homeScore > m.awayScore) stats[match.homeTeamId].pts += 3;
    else if (m.awayScore > m.homeScore) stats[match.awayTeamId].pts += 3;
    else {
      stats[match.homeTeamId].pts += 1;
      stats[match.awayTeamId].pts += 1;
    }
  });

  const ranking = group.teams
    .map(id => ({ teamId: id, ...stats[id] }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      
      // Confronto direto se houver empate em pontos
      const headToHeadMatch = groupPred?.matchPredictions.find(m => 
        (m.homeScore !== null && m.awayScore !== null) &&
        ((GROUP_MATCHES.find(gm => gm.id === m.matchId)?.homeTeamId === a.teamId && GROUP_MATCHES.find(gm => gm.id === m.matchId)?.awayTeamId === b.teamId) ||
         (GROUP_MATCHES.find(gm => gm.id === m.matchId)?.homeTeamId === b.teamId && GROUP_MATCHES.find(gm => gm.id === m.matchId)?.awayTeamId === a.teamId))
      );

      if (headToHeadMatch) {
        const gm = GROUP_MATCHES.find(gm => gm.id === headToHeadMatch.matchId)!;
        const aScore = gm.homeTeamId === a.teamId ? headToHeadMatch.homeScore! : headToHeadMatch.awayScore!;
        const bScore = gm.homeTeamId === b.teamId ? headToHeadMatch.homeScore! : headToHeadMatch.awayScore!;
        if (aScore !== bScore) return bScore - aScore;
      }

      return b.gd - a.gd || b.gs - a.gs;
    });

  return (
    <div className="group-card">
      <div className="group-header">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bebas text-green-400">GRUPO {groupId}</h3>
          {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          <span className="text-[10px] bg-green-900/40 text-green-500 px-1.5 py-0.5 rounded border border-green-800/30 uppercase font-bold">
            {isComplete ? "COMPLETO" : "EM ANDAMENTO"}
          </span>
        </div>
        <span className="text-[10px] text-green-700 font-mono">{completedMatches}/6 jogos</span>
      </div>
      
      <div className="p-3 space-y-4">
        <div className="space-y-1.5">
          <p className="text-[10px] text-green-700 font-oswald uppercase tracking-widest flex items-center gap-1">
            <Users className="w-3 h-3" /> Selecione os 2 classificados
          </p>
          <div className="bg-black/40 rounded border border-green-900/30 overflow-hidden">
            <table className="w-full text-[10px] font-oswald uppercase">
              <thead>
                <tr className="bg-black/60 text-green-700 border-b border-green-900/30">
                  <th className="p-2 text-left w-6">#</th>
                  <th className="p-2 text-left">Seleção</th>
                  <th className="p-2 text-center">P</th>
                  <th className="p-2 text-center">SG</th>
                  <th className="p-2 text-center">GP</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, idx) => {
                  const isQualified = idx < 2;
                  const isBestThird = idx === 2; // Simplificação visual
                  return (
                    <tr key={item.teamId} className={`border-b border-green-900/10 ${isQualified ? "text-green-400" : "text-green-900"}`}>
                      <td className="p-2 font-mono">{idx + 1}º</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm shrink-0">{TEAMS[item.teamId].flag}</span>
                          <span className="truncate font-bold text-[10px]">{TEAMS[item.teamId].name}</span>
                        </div>
                      </td>
                      <td className="p-2 text-center font-bold">{item.pts}</td>
                      <td className="p-2 text-center">{item.gd > 0 ? `+${item.gd}` : item.gd}</td>
                      <td className="p-2 text-center">{item.gs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-2 border-t border-green-900/20">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-1 text-[10px] text-green-600 font-oswald uppercase tracking-widest hover:text-green-400 transition-colors flex items-center justify-center gap-1"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {isExpanded ? "Recolher Partidas" : "Ver 6 Partidas (+pontos por placar)"}
          </button>
          
          <div className={`mt-2 space-y-2 transition-all duration-300 overflow-hidden ${isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
            {matches.map(match => {
               const pred = groupPred?.matchPredictions.find(p => p.matchId === match.id);
               return (
                 <div key={match.id} className="bg-black/30 p-2 rounded border border-green-900/30">
                   <div className="text-[8px] text-green-900 uppercase font-mono mb-1 flex justify-between">
                     <span>{match.date}</span>
                     <span>{match.venue}</span>
                   </div>
                   <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                     <div className="text-right min-w-0">
                       <div className="flex flex-col items-end">
                         <span className="text-lg leading-none mb-1">{TEAMS[match.homeTeamId].flag}</span>
                         <span className="text-[10px] font-bold font-oswald text-green-100 uppercase leading-tight">{TEAMS[match.homeTeamId].name}</span>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-1.5 px-1 bg-black/20 rounded-md py-1 border border-green-900/20">
                       <ScoreInput 
                         value={pred?.homeScore ?? null}
                         onChange={homeScore => setMatchPrediction(groupId, match.id, null, homeScore, pred?.awayScore ?? null)}
                         disabled={isPredictionsLocked}
                       />
                       <span className="text-green-700 text-[10px] font-bold">×</span>
                       <ScoreInput 
                         value={pred?.awayScore ?? null}
                         onChange={awayScore => setMatchPrediction(groupId, match.id, null, pred?.homeScore ?? null, awayScore)}
                         disabled={isPredictionsLocked}
                       />
                     </div>

                     <div className="text-left min-w-0">
                       <div className="flex flex-col items-start">
                         <span className="text-lg leading-none mb-1">{TEAMS[match.awayTeamId].flag}</span>
                         <span className="text-[10px] font-bold font-oswald text-green-100 uppercase leading-tight">{TEAMS[match.awayTeamId].name}</span>
                       </div>
                     </div>
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoringPanel() {
  const { totalScore } = useSimulator();

  return (
    <div className="bg-[#081a08]/90 border border-green-900 rounded-xl p-6 shadow-2xl">
      <h3 className="text-xl font-bebas text-green-400 flex items-center gap-2 mb-1">
        <Trophy className="w-5 h-5" /> PONTUAÇÃO
      </h3>
      <p className="text-[10px] text-green-700 font-oswald uppercase mb-6">Aguardando resultados oficiais</p>
      
      <div className="text-center py-8 border-y border-green-900/30 mb-6">
        <p className="text-[10px] text-green-600 font-oswald uppercase tracking-widest mb-1">PONTOS TOTAIS</p>
        <div className="text-8xl font-bebas text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          {totalScore}
        </div>
        <p className="text-[10px] text-green-800 font-mono mt-2">max: 928pts</p>
      </div>
    </div>
  );
}

function BestThirdsTable() {
  const { getBestThirds } = useSimulator();
  const bestThirdsIds = getBestThirds();

  if (bestThirdsIds.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto bg-[#081a08]/80 border border-green-900/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl mt-12">
      <div className="bg-black/60 p-4 border-b border-green-900/30 text-center">
        <h3 className="text-xl font-bebas text-yellow-500 tracking-widest uppercase">8 Melhores Terceiros Colocados</h3>
        <p className="text-[10px] text-green-700 font-oswald uppercase mt-1">Classificados para a Segunda Rodada</p>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {bestThirdsIds.map((teamId, idx) => (
          <div key={teamId} className="flex items-center gap-2 bg-black/40 p-2 rounded border border-green-500/20">
            <span className="text-[10px] font-mono text-yellow-600">{idx + 1}º</span>
            <span className="text-lg">{TEAMS[teamId].flag}</span>
            <span className="text-[11px] font-oswald text-white uppercase truncate">{TEAMS[teamId].name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, logout } = useAuthContext();
  const { state, resetAll, setConfirmedGroups, setConfirmedKnockout } = useSimulator();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"ranking" | "groups" | "knockout" | "rules">("ranking");

  const confirmedGroups = state.confirmedGroups;
  const confirmedKnockout = state.confirmedKnockout;
  const { hasUnsavedChanges, isSaving, savePredictionsToDatabase } = simulator;

  // Removido o reset automático para permitir a trava de segurança manual
  /* 
  useEffect(() => {
    if (confirmedGroups) setConfirmedGroups(false);
  }, [state.groupPredictions]);

  useEffect(() => {
    if (confirmedKnockout) setConfirmedKnockout(false);
  }, [state.secondRoundPredictions, state.r16Predictions, state.qfPredictions, state.sfPredictions, state.finalistPrediction, state.finalPrediction]);
  */

  const countGroupMatches = () => {
    let total = 0;
    let predicted = 0;
    GROUPS.forEach(group => {
      const groupPred = state.groupPredictions[group.id];
      const groupMatches = GROUP_MATCHES.filter(gm => group.teams.includes(gm.homeTeamId));
      total += groupMatches.length;
      if (groupPred?.matchPredictions) {
        predicted += groupPred.matchPredictions.filter(m => m.homeScore !== null && m.awayScore !== null).length;
      }
    });
    return { total, predicted };
  };

  const countKnockoutMatches = () => {
    const sr = Object.values(state.secondRoundPredictions).filter(Boolean).length;
    const r16 = Object.values(state.r16Predictions).filter(Boolean).length;
    const qf = Object.values(state.qfPredictions).filter(Boolean).length;
    const sf = Object.values(state.sfPredictions).filter(Boolean).length;
    const finalists = state.finalistPrediction.filter(Boolean).length;
    const champion = state.finalPrediction ? 1 : 0;
    const total = sr + r16 + qf + sf + finalists + champion;
    const expected = 16 + 8 + 4 + 2 + 2 + 1; // 16 SR (32 teams), 8 R16, 4 QF, 2 SF, 2 Finalists, 1 Champion
    return { total, expected };
  };

  const groupStats = countGroupMatches();
  const knockoutStats = countKnockoutMatches();
  const isGroupsComplete = groupStats.predicted === groupStats.total && groupStats.total > 0;
  const isKnockoutComplete = knockoutStats.total === knockoutStats.expected;

  // Debug local para verificar confrontos
  console.log("Matchups count:", SECOND_ROUND_MATCHUPS.length);

  return (
    <div className="min-h-screen tactical-bg">
      {/* Top Banner */}
      <div className="relative h-[480px] w-full overflow-hidden border-b border-green-900/50">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#040d04]/60 to-[#040d04]" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000')] bg-cover bg-center grayscale" />
        
        <div className="container relative h-full flex flex-col justify-center pt-12">
          <div className="flex items-start gap-12">
            <div className="hidden lg:block shrink-0 relative">
               <div className="absolute inset-0 bg-yellow-500/20 blur-[100px] rounded-full animate-pulse" />
               <img src="/taca.png" alt="Taça da Copa" className="h-[380px] object-contain drop-shadow-[0_0_40px_rgba(234,179,8,0.4)] relative z-10" />
            </div>

            <div className="relative z-10">
               <div className="h-8" />
               <h1 className="text-7xl md:text-8xl font-bebas text-white leading-[0.85] mb-4">
                 BOLÃO <br />
                 <span className="text-yellow-500">FUNCIONÁRIOS DA OAB</span>
               </h1>
               <p className="max-w-xl text-green-500/70 font-oswald text-sm md:text-base leading-relaxed mb-8">
                 Faça suas previsões para todos os jogos, escolha os classificados de cada fase e tente acertar o campeão mundial. Acumule pontos por cada acerto!
               </p>
               
               <div className="flex flex-wrap gap-4 text-[10px] font-oswald uppercase tracking-widest text-green-800">
                 <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 48 equipes</span>
                 <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 12 grupos</span>
                 <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 5 fases</span>
                 <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 72 jogos na fase de grupos</span>
               </div>
            </div>

            <div className="absolute top-8 right-8 flex flex-col items-end gap-6">
               <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-green-900/30 backdrop-blur-sm">
                 <div className="text-right">
                    <p className="text-[10px] text-green-800 font-oswald uppercase tracking-widest">Grupos Completos</p>
                    <p className="text-3xl font-bebas text-white">12/12</p>
                 </div>
                 <div className="w-12 h-12 rounded-full border-2 border-green-500/50 flex items-center justify-center bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                 </div>
               </div>

               <div className="flex gap-2">
                 <button className="bg-black/60 hover:bg-black/80 border border-green-900/50 text-green-500 p-2.5 rounded-lg transition-all">
                    <Sun className="w-4 h-4" />
                 </button>

                 {user?.role === "admin" && (
                   <button onClick={() => setLocation("/admin")} className="bg-yellow-950/20 hover:bg-yellow-950/40 border border-yellow-900/30 text-yellow-500 px-4 py-2 rounded-lg text-[10px] font-oswald uppercase flex items-center gap-2 tracking-widest transition-all">
                      <Shield className="w-3 h-3" /> Admin
                   </button>
                 )}
                 <button onClick={logout} className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-500 px-4 py-2 rounded-lg text-[10px] font-oswald uppercase flex items-center gap-2 tracking-widest transition-all">
                    <LogOut className="w-3 h-3" /> Sair
                 </button>
               </div>
               
               <div className="flex flex-col items-end gap-2">
                 <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-green-900/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <p className="text-[10px] text-white font-mono uppercase tracking-tight">
                     LOGADO COMO: <span className="text-green-400 font-bold">{user?.name}</span>
                   </p>
                 </div>
                 <div className={`px-3 py-0.5 rounded text-[9px] font-bebas tracking-widest uppercase border ${
                   user?.hasPaid 
                     ? "bg-green-500/20 border-green-500 text-green-400" 
                     : "bg-red-500/20 border-red-500 text-red-400"
                 }`}>
                   {user?.hasPaid ? "PAGOU" : "PAGAMENTO PENDENTE"}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-black/90 backdrop-blur-xl sticky top-0 z-50 border-y border-green-900/30 shadow-2xl">
        <div className="container flex items-center gap-12 py-5 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab("ranking")}
            className={`flex items-center gap-3 font-bebas text-2xl tracking-widest transition-all shrink-0 ${activeTab === "ranking" ? "text-yellow-500 scale-110" : "text-green-900 hover:text-green-700"}`}
          >
            <TrendingUp className="w-5 h-5" /> RANKING GLOBAL
          </button>
          <button 
            onClick={() => setActiveTab("groups")}
            className={`flex flex-col items-start transition-all shrink-0 ${activeTab === "groups" ? "scale-110" : "hover:opacity-80"}`}
          >
            <div className={`flex items-center gap-3 font-bebas text-2xl tracking-widest ${activeTab === "groups" ? "text-green-400" : "text-green-900"}`}>
              <LayoutGrid className="w-5 h-5" /> FASE DE GRUPOS <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === "groups" ? "bg-green-500 text-black" : "bg-green-900/30 text-green-700"}`}>12/12</span>
            </div>
            {confirmedGroups && <span className="text-[10px] font-oswald text-green-500 uppercase tracking-tighter mt-0.5">Seleção Confirmada!</span>}
          </button>
          <button 
            onClick={() => setActiveTab("knockout")}
            className={`flex flex-col items-start transition-all shrink-0 ${activeTab === "knockout" ? "scale-110" : "hover:opacity-80"}`}
          >
            <div className={`flex items-center gap-3 font-bebas text-2xl tracking-widest ${activeTab === "knockout" ? "text-green-400" : "text-green-900"}`}>
              <Trophy className="w-5 h-5" /> ELIMINATÓRIAS <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === "knockout" ? "bg-green-500 text-black" : "bg-green-900/30 text-green-700"}`}>32 TIMES</span>
            </div>
            {confirmedKnockout && <span className="text-[10px] font-oswald text-green-500 uppercase tracking-tighter mt-0.5">Seleção Confirmada!</span>}
          </button>
          <button 
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-3 font-bebas text-2xl tracking-widest transition-all shrink-0 ${activeTab === "rules" ? "text-green-400 scale-110" : "text-green-900 hover:text-green-700"}`}
          >
            <ClipboardList className="w-5 h-5" /> REGRAS & PONTOS
          </button>
        </div>
      </div>

      <div className="container py-8 md:py-16">
        {/* Botão de Salvar Alterações - Flutuante */}
        {hasUnsavedChanges && (
          <div className="fixed top-24 right-8 z-[99] animate-pulse">
            <button
              onClick={savePredictionsToDatabase}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bebas text-lg px-8 py-3 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(59,130,246,0.5)] flex items-center gap-2 border-2 border-white/20 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> SALVANDO...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> SALVAR ALTERAÇÕES
                </>
              )}
            </button>
          </div>
        )}
        
        <div className="flex flex-col-reverse lg:flex-row gap-8 md:gap-12 items-start">
          <div className="flex-1 w-full">
            {activeTab === "ranking" && <RankingTab />}
            {activeTab === "groups" && (
              <div className="space-y-12">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${confirmedGroups ? "pointer-events-none opacity-80" : ""}`}>
                  {GROUPS.map(g => <GroupCard key={g.id} groupId={g.id} />)}
                </div>
                
                <BestThirdsTable />

                {isGroupsComplete && !confirmedGroups && (
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
                    <button 
                      onClick={() => setConfirmedGroups(true)}
                      className="bg-green-600 hover:bg-green-500 text-black font-bebas text-2xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(34,197,94,0.5)] flex items-center gap-3 border-2 border-white/20"
                    >
                      <CheckCircle2 className="w-6 h-6" /> CONFIRMAR SELEÇÕES
                    </button>
                  </div>
                )}

                {confirmedGroups && (
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
                    <button 
                      onClick={() => setConfirmedGroups(false)}
                      className="bg-yellow-600 hover:bg-yellow-500 text-black font-bebas text-2xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(234,179,8,0.5)] flex items-center gap-3 border-2 border-white/20"
                    >
                      <RotateCcw className="w-6 h-6" /> EDITAR SELEÇÃO
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeTab === "knockout" && (
              <div className="space-y-12">
                <div className={confirmedKnockout ? "pointer-events-none opacity-80" : ""}>
                  <KnockoutSection />
                </div>
                {isKnockoutComplete && !confirmedKnockout && (
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
                    <button 
                      onClick={() => setConfirmedKnockout(true)}
                      className="bg-green-600 hover:bg-green-500 text-black font-bebas text-2xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(34,197,94,0.5)] flex items-center gap-3 border-2 border-white/20"
                    >
                      <CheckCircle2 className="w-6 h-6" /> CONFIRMAR SELEÇÕES
                    </button>
                  </div>
                )}

                {confirmedKnockout && (
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
                    <button 
                      onClick={() => setConfirmedKnockout(false)}
                      className="bg-yellow-600 hover:bg-yellow-500 text-black font-bebas text-2xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(234,179,8,0.5)] flex items-center gap-3 border-2 border-white/20"
                    >
                      <RotateCcw className="w-6 h-6" /> EDITAR SELEÇÃO
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeTab === "rules" && (
              <div className="max-w-3xl mx-auto bg-[#081a08]/80 border border-green-900/50 rounded-2xl p-10 backdrop-blur-md">
                <h2 className="text-4xl font-bebas text-green-400 mb-8 text-center uppercase tracking-widest">Regras & Pontuação</h2>
                <div className="space-y-6 font-oswald text-green-100 uppercase tracking-wider">
                   <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mb-8">
                     <p className="text-yellow-500 text-sm font-bold">Novo Formato 2026: 48 Seleções</p>
                     <ul className="list-disc list-inside space-y-1 text-[10px] mt-2 text-yellow-600/80">
                       <li>12 Grupos de 4 equipes</li>
                       <li>Classificam-se os 2 primeiros de cada grupo (24 times)</li>
                       <li>Classificam-se os 8 melhores 3º colocados (8 times)</li>
                       <li>Total: 32 times no Mata-Mata (Segunda Rodada)</li>
                     </ul>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <h3 className="text-green-500 text-lg border-b border-green-900/30 pb-2">Fase de Grupos</h3>
                       <div className="flex justify-between items-center text-xs">
                         <span>Acertar Vencedor (1/X/2)</span>
                         <span className="text-yellow-500 font-bold">+6 PTS</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span>Acertar Gols do Time da Casa</span>
                         <span className="text-yellow-500 font-bold">+2 PTS</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span>Acertar Gols do Time Visitante</span>
                         <span className="text-yellow-500 font-bold">+2 PTS</span>
                       </div>
                       <div className="flex justify-between items-center text-xs border-t border-green-900/30 pt-2 mt-1">
                         <span className="text-green-300">Placar Exato (máximo por jogo)</span>
                         <span className="text-green-300 font-bold">+10 PTS</span>
                       </div>
                       <h3 className="text-green-500 text-lg border-b border-green-900/30 pb-2 pt-2">Melhores Terceiros</h3>
                       <div className="flex justify-between items-center text-xs">
                         <span>Acertar 3º Colocado Classificado</span>
                         <span className="text-yellow-500 font-bold">+2 PTS cada</span>
                       </div>
                       <p className="text-[10px] text-green-800 leading-relaxed">Os 8 melhores 3os colocados dos 12 grupos avançam para a Segunda Rodada.</p>
                     </div>

                     <div className="space-y-4">
                       <h3 className="text-green-500 text-lg border-b border-green-900/30 pb-2">Eliminatórias</h3>
                       <div className="flex justify-between items-center text-xs">
                         <span>Segunda Rodada — acertar classificado</span>
                         <span className="text-yellow-500 font-bold">+1 PT por time</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span>Oitavas de Final — acertar classificado</span>
                         <span className="text-yellow-500 font-bold">+2 PTS por time</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span>Quartas de Final — acertar classificado</span>
                         <span className="text-yellow-500 font-bold">+4 PTS por time</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span>Semifinais — acertar classificado</span>
                         <span className="text-yellow-500 font-bold">+8 PTS por time</span>
                       </div>
                       <div className="flex justify-between items-center text-xs border-t border-green-900/30 pt-2 mt-1">
                         <span>Acertar um Finalista</span>
                         <span className="text-yellow-500 font-bold">+10 PTS por time</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span>Acertar o Campeão Mundial</span>
                         <span className="text-yellow-500 font-bold">+20 PTS</span>
                       </div>
                     </div>
                   </div>

                   <div className="mt-6 bg-green-900/20 border border-green-900/40 rounded-xl p-4">
                     <h3 className="text-green-400 text-sm font-bebas tracking-widest mb-3">Pontuação Máxima Possível</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] text-center">
                       <div className="bg-[#081a08] rounded-lg p-2">
                         <div className="text-yellow-500 font-bold text-base">720</div>
                         <div className="text-green-700">Grupos (vencedores)</div>
                       </div>
                       <div className="bg-[#081a08] rounded-lg p-2">
                         <div className="text-yellow-500 font-bold text-base">288</div>
                         <div className="text-green-700">Grupos (placares)</div>
                       </div>
                       <div className="bg-[#081a08] rounded-lg p-2">
                         <div className="text-yellow-500 font-bold text-base">16</div>
                         <div className="text-green-700">Melhores Terceiros</div>
                       </div>
                       <div className="bg-[#081a08] rounded-lg p-2">
                         <div className="text-yellow-500 font-bold text-base">≈208</div>
                         <div className="text-green-700">Eliminatórias + Final</div>
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>
          <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-24">
            <ScoringPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
