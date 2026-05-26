import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSimulator } from "@/contexts/SimulatorContext";
import { GROUPS, TEAMS, GROUP_MATCHES } from "@/lib/worldCupData";
import { SECOND_ROUND_MATCHUPS, R16_MATCHUPS, QF_MATCHUPS, SF_MATCHUPS } from "@/lib/knockoutData";
import { Loader2, RotateCcw, LogOut, Sun, CheckCircle2, Trophy, Users, LayoutGrid, ClipboardList, ChevronDown, ChevronUp, Medal, TrendingUp, AlertCircle, ChevronRight, Shield, Save, ArrowUp, ArrowDown, Minus, BarChart2, Building2, Clock, Eye, Lock, User, KeyRound, X } from "lucide-react";
import { ScoreInput } from "@/components/ScoreInput";
import { TeamFlag } from "@/components/TeamFlag";
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
    <div className="bg-[#123012]/80 border border-green-700/40 rounded-lg overflow-hidden flex flex-col shadow-lg">
      <div className="bg-green-900/60 px-3 py-1.5 flex justify-between items-center border-b border-green-700/40">
        <span className="text-[10px] font-mono text-green-300 font-bold uppercase">{idPrefix || ""} {label}</span>
        <span className="text-[9px] font-oswald text-yellow-400 uppercase">+{points} por acerto</span>
      </div>
      <div className="p-2 space-y-1">
        <button
          onClick={() => teamAId && onSelect(teamAId)}
          disabled={disabled || !teamAId}
          className={`w-full flex items-center justify-between p-2.5 rounded transition-all ${
            winnerId === teamAId && teamAId
              ? "bg-green-700/50 border border-green-400/60 text-white shadow-[0_0_10px_rgba(74,222,128,0.2)]"
              : "bg-black/30 border border-green-900/20 text-green-400/70 hover:border-green-600/50 hover:text-green-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-oswald text-green-400 font-bold uppercase w-4">{teamA?.shortName || "??"}</span>
            {teamAId && <TeamFlag teamId={teamAId} className="w-5 h-3.5" fallback={teamA?.flag} />}
            <span className="text-xs font-oswald uppercase tracking-wider text-green-100">{teamA?.name || "A DEFINIR"}</span>
          </div>
          {winnerId === teamAId && teamAId && <ChevronRight className="w-3 h-3 text-green-500" />}
        </button>

        <button
          onClick={() => teamBId && onSelect(teamBId)}
          disabled={disabled || !teamBId}
          className={`w-full flex items-center justify-between p-2.5 rounded transition-all ${
            winnerId === teamBId && teamBId
              ? "bg-green-700/50 border border-green-400/60 text-white shadow-[0_0_10px_rgba(74,222,128,0.2)]"
              : "bg-black/30 border border-green-900/20 text-green-400/70 hover:border-green-600/50 hover:text-green-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-oswald text-green-400 font-bold uppercase w-4">{teamB?.shortName || "??"}</span>
            {teamBId && <TeamFlag teamId={teamBId} className="w-5 h-3.5" fallback={teamB?.flag} />}
            <span className="text-xs font-oswald uppercase tracking-wider text-green-100">{teamB?.name || "A DEFINIR"}</span>
          </div>
          {winnerId === teamBId && teamBId && <ChevronRight className="w-3 h-3 text-green-500" />}
        </button>
      </div>
    </div>
  );
}

// Mapeamento de slot → grupo do 1º colocado (para exibir "vs 1X" na tabela de terceiros)
const SLOT_TO_FIRST: Record<string, string> = {
  sr_1: 'A', sr_2: 'B', sr_3: 'D', sr_4: 'E', sr_5: 'G', sr_6: 'I', sr_7: 'K', sr_8: 'L',
};

function KnockoutSection() {
  const {
    state, isPredictionsLocked,
    getThirdMatchupAssignment,
    setSecondRoundWinner, setR16Winner, setQFWinner, setSFWinner, setFinalist, setChampion,
    finalists, champion
  } = useSimulator();

  const thirdAssignment = getThirdMatchupAssignment();

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
          {SECOND_ROUND_MATCHUPS.map((m) => {
            const teamA = getQualifiedTeam(m.groupA, m.posA);
            // Para slots vs 3º: usa atribuição FIFA se disponível, senão vazio
            const teamB = m.isThirdB
              ? (thirdAssignment[m.id] ?? null)
              : getQualifiedTeam(m.groupB!, m.posB!);
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
            <span className="text-[10px] font-oswald text-yellow-600 uppercase tracking-widest">Finalistas — vencedores das semifinais</span>
            <span className="text-[10px] font-mono text-yellow-700 font-bold">+10pts por acerto</span>
          </div>

          {/* Finalistas — derivados automaticamente dos vencedores das SFs */}
          <div className="flex gap-6 mb-12">
            {[0, 1].map(slot => {
              const sfWinner = slot === 0 ? state.sfPredictions["sf_1"] : state.sfPredictions["sf_2"];
              const team = sfWinner ? TEAMS[sfWinner] : null;
              return (
                <div
                  key={slot}
                  className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all ${
                    sfWinner
                      ? "bg-yellow-500/20 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                      : "bg-black/40 border-yellow-900/20 opacity-50"
                  }`}
                >
                  <span className="text-[10px] font-oswald text-yellow-700 uppercase tracking-widest">
                    {slot === 0 ? "SF1" : "SF2"}
                  </span>
                  {sfWinner
                    ? <TeamFlag teamId={sfWinner} className="w-10 h-6" fallback={team?.flag} />
                    : <span className="text-3xl opacity-30">?</span>
                  }
                  <span className="text-lg font-bebas text-white uppercase tracking-wide">
                    {team?.name || "A DEFINIR"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Seleção do campeão — só aparece quando ambos finalistas estão definidos */}
          {finalists[0] && finalists[1] ? (
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
                    <TeamFlag teamId={teamId} className="w-12 h-8 text-4xl" fallback={TEAMS[teamId].flag} />
                    <span className="text-3xl font-bebas tracking-[0.2em] uppercase">{TEAMS[teamId].name}</span>
                    {champion === teamId && <Trophy className="w-8 h-8" />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-[10px] font-oswald text-yellow-900/60 uppercase tracking-widest pt-4 border-t border-yellow-900/20">
              Selecione os vencedores das semifinais para definir os finalistas
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface PositionHistory {
  position: number;
  score: number;
  savedAt: number;
}

function getPositionKey(userId: number) {
  return `worldcup_ranking_pos_${userId}`;
}

function positionDiff(current: number, previous: number | null): 'up' | 'down' | 'same' | 'new' {
  if (previous === null) return 'new';
  if (current < previous) return 'up';
  if (current > previous) return 'down';
  return 'same';
}

function PositionBadge({ diff, steps }: { diff: 'up' | 'down' | 'same' | 'new'; steps: number }) {
  if (diff === 'new') return (
    <span className="text-[9px] font-oswald bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">NOVO</span>
  );
  if (diff === 'up') return (
    <span className="flex items-center gap-0.5 text-[9px] font-bebas text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded">
      <ArrowUp className="w-2.5 h-2.5" />{steps}
    </span>
  );
  if (diff === 'down') return (
    <span className="flex items-center gap-0.5 text-[9px] font-bebas text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
      <ArrowDown className="w-2.5 h-2.5" />{steps}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[9px] font-bebas text-green-800 px-1 py-0.5 rounded">
      <Minus className="w-2.5 h-2.5" />
    </span>
  );
}

function RankingTab({ onViewPredictions }: { onViewPredictions?: (id: number, name: string) => void }) {
  const { user } = useAuthContext();
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPrevHistory, setMyPrevHistory] = useState<PositionHistory | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.ok ? r.json() : null)
      .then(cfg => { if (cfg) setIsLocked(cfg.isLocked || false); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(getPositionKey(user.id));
        if (stored) setMyPrevHistory(JSON.parse(stored));
      } catch { /* ignore */ }
    }

    fetch("/api/ranking")
      .then(res => res.json())
      .then((data: any[]) => {
        setRanking(data);
        setLoading(false);

        // Salva nova posição após carregar o ranking
        if (user?.id) {
          const myIndex = data.findIndex(p => p.id === user.id);
          if (myIndex >= 0) {
            const history: PositionHistory = {
              position: myIndex + 1,
              score: data[myIndex].score,
              savedAt: Date.now(),
            };
            try { localStorage.setItem(getPositionKey(user.id), JSON.stringify(history)); } catch { /* ignore */ }
          }
        }
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  const myCurrentIndex = ranking.findIndex(p => p.id === user?.id);
  const myCurrentPos = myCurrentIndex >= 0 ? myCurrentIndex + 1 : null;
  const diff = myCurrentPos !== null ? positionDiff(myCurrentPos, myPrevHistory?.position ?? null) : null;
  const steps = diff && myPrevHistory ? Math.abs(myCurrentPos! - myPrevHistory.position) : 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
      <p className="text-green-700 font-oswald uppercase tracking-widest">Carregando Ranking Global...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-5xl font-bebas text-green-400 uppercase tracking-[0.2em]">RANKING GLOBAL</h2>
        <div className="h-1 w-32 bg-green-700 mx-auto mt-4 rounded-full" />
        <p className="mt-6 text-xs font-oswald text-green-700 uppercase tracking-wider">
          Acompanhe a pontuação de todos os participantes em tempo real
        </p>
      </div>

      {/* Card de posição do usuário logado */}
      {myCurrentPos !== null && diff !== null && (
        <div className={`rounded-xl border p-5 flex items-center justify-between backdrop-blur-md ${
          diff === 'up' ? 'bg-green-500/10 border-green-500/40' :
          diff === 'down' ? 'bg-red-500/10 border-red-500/30' :
          'bg-[#081a08]/80 border-green-900/50'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bebas border-2 ${
              diff === 'up' ? 'bg-green-500/20 border-green-500 text-green-400' :
              diff === 'down' ? 'bg-red-500/20 border-red-500 text-red-400' :
              'bg-yellow-500/20 border-yellow-500 text-yellow-400'
            }`}>
              {myCurrentPos}º
            </div>
            <div>
              <p className="text-[10px] font-oswald text-green-700 uppercase tracking-widest">Sua posição atual</p>
              <p className="text-lg font-bebas text-white tracking-widest">{user?.name}</p>
              {myPrevHistory && (
                <p className="text-[9px] font-mono text-green-800 mt-0.5">
                  {diff === 'up' && `Subiu ${steps} posição${steps > 1 ? 'ões' : ''} desde a última visita`}
                  {diff === 'down' && `Caiu ${steps} posição${steps > 1 ? 'ões' : ''} desde a última visita`}
                  {diff === 'same' && 'Mesma posição desde a última visita'}
                  {' · '}antes: {myPrevHistory.position}º com {myPrevHistory.score}pts
                </p>
              )}
              {!myPrevHistory && (
                <p className="text-[9px] font-mono text-green-800 mt-0.5">Primeira vez acessando o ranking</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {diff !== 'new' && <PositionBadge diff={diff} steps={steps} />}
            <span className="text-2xl font-bebas text-yellow-500">
              {ranking[myCurrentIndex]?.score ?? 0} <span className="text-[10px] text-green-900">PTS</span>
            </span>
          </div>
        </div>
      )}

      <div className="bg-[#081a08]/80 border border-green-900/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-green-900/30">
              <th className="p-6 font-bebas text-xl text-green-600 tracking-widest uppercase w-24 text-center">Pos</th>
              <th className="p-6 font-bebas text-xl text-green-600 tracking-widest uppercase">Participante</th>
              <th className="p-6 font-bebas text-xl text-green-600 tracking-widest uppercase hidden sm:table-cell">Setor</th>
              <th className="p-6 font-bebas text-xl text-green-600 tracking-widest uppercase text-right">Pontos</th>
            </tr>
          </thead>
          <tbody className="font-oswald uppercase tracking-wider">
            {ranking.map((player, index) => {
              const isMe = player.id === user?.id;
              const isTop3 = index < 3;
              const playerPos = index + 1;
              const playerDiff = isMe && diff !== null ? diff : null;
              const playerSteps = isMe ? steps : 0;

              return (
                <tr key={player.id} className={`border-b border-green-900/10 transition-colors ${isMe ? "bg-green-500/10" : "hover:bg-white/5"}`}>
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {index === 0 && <Medal className="w-6 h-6 text-yellow-500" />}
                      {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                      {index === 2 && <Medal className="w-6 h-6 text-amber-700" />}
                      {index > 2 && <span className="text-xl font-bebas text-green-900">{playerPos}º</span>}
                      {isMe && playerDiff && <PositionBadge diff={playerDiff} steps={playerSteps} />}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? "bg-green-500 text-black" : "bg-green-900/30 text-green-500"}`}>
                        {player.name.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-lg ${isMe ? "text-green-400 font-bold" : "text-green-100"}`}>
                            {player.name}
                          </span>
                          {isMe && <span className="text-[10px] bg-green-500 text-black px-1.5 py-0.5 rounded font-bold">VOCÊ</span>}
                          {!player.hasPredictions && (
                            <span className="text-[8px] bg-red-950/40 text-red-500/70 border border-red-900/30 px-1.5 py-0.5 rounded font-mono">SEM PALPITES</span>
                          )}
                        </div>
                        {isLocked && !isMe && onViewPredictions && (
                          <button
                            onClick={() => onViewPredictions(player.id, player.name)}
                            className="flex items-center gap-1 text-[9px] font-oswald text-green-700 hover:text-green-400 transition-colors mt-0.5"
                          >
                            <Eye className="w-3 h-3" /> ver previsões
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-6 hidden sm:table-cell text-center">
                    <div className="flex justify-center">
                      <span className="text-[11px] font-oswald text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-md truncate max-w-[150px] inline-block font-bold shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                        {player.department || "—"}
                      </span>
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
                          <TeamFlag teamId={item.teamId} className="w-5 h-3.5 shrink-0" fallback={TEAMS[item.teamId].flag} />
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
            className="w-full py-1 text-[10px] text-green-600 font-oswald uppercase tracking-widest hover:text-green-400 transition-colors flex items-center justify-center gap-1 pointer-events-auto"
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
                         <TeamFlag teamId={match.homeTeamId} className="w-6 h-4 mb-1" fallback={TEAMS[match.homeTeamId].flag} />
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
                         <TeamFlag teamId={match.awayTeamId} className="w-6 h-4 mb-1" fallback={TEAMS[match.awayTeamId].flag} />
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
  const { totalScore, getScoreBreakdown } = useSimulator();
  const [expanded, setExpanded] = useState(false);
  const breakdown = getScoreBreakdown();
  const hasAnyPoints = breakdown.some(b => b.points > 0);
  const maxTotal = breakdown.reduce((s, b) => s + b.max, 0);

  const groupRows = breakdown.slice(0, 3);
  const otherRows = breakdown.slice(3);

  const groupPts = groupRows.reduce((s, b) => s + b.points, 0);
  const groupMax = groupRows.reduce((s, b) => s + b.max, 0);

  const categoryColor = (pts: number, max: number) => {
    if (max === 0 || pts === 0) return "text-green-900";
    const ratio = pts / max;
    if (ratio >= 0.7) return "text-yellow-400";
    if (ratio >= 0.4) return "text-green-400";
    return "text-green-600";
  };

  return (
    <div className="bg-[#081a08]/90 border border-green-900 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-xl font-bebas text-green-400 flex items-center gap-2 mb-0.5">
          <Trophy className="w-5 h-5" /> MINHA PONTUAÇÃO
        </h3>
        <p className="text-[10px] text-green-700 font-oswald uppercase">
          {hasAnyPoints ? "Pontos acumulados até agora" : "Aguardando resultados oficiais"}
        </p>
      </div>

      {/* Total */}
      <div className="text-center py-6 border-y border-green-900/30 mx-5 mb-4">
        <p className="text-[10px] text-green-600 font-oswald uppercase tracking-widest mb-1">PONTOS TOTAIS</p>
        <div className="text-8xl font-bebas text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)] leading-none">
          {totalScore}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="h-1 flex-1 max-w-[80px] bg-green-900/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full transition-all duration-500"
              style={{ width: maxTotal > 0 ? `${Math.min(100, (totalScore / maxTotal) * 100)}%` : '0%' }}
            />
          </div>
          <p className="text-[10px] text-green-800 font-mono">max: {maxTotal > 0 ? maxTotal : 928}pts</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="px-5 pb-5 space-y-2">
        {/* Fase de Grupos — agrupada */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-oswald uppercase tracking-wider text-green-500">Fase de Grupos</span>
            {groupMax > 0 && (
              <span className="text-[9px] font-mono text-green-800">{groupHits(breakdown)}/{groupMatchesCount(breakdown)} acertos</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bebas ${categoryColor(groupPts, groupMax)}`}>
              {groupPts > 0 ? `+${groupPts}` : "—"} <span className="text-[9px] text-green-900">/{groupMax || "—"}</span>
            </span>
            {expanded ? <ChevronUp className="w-3 h-3 text-green-800" /> : <ChevronDown className="w-3 h-3 text-green-800" />}
          </div>
        </button>

        {expanded && (
          <div className="ml-3 space-y-1 border-l border-green-900/30 pl-3">
            {groupRows.map(row => (
              <div key={row.category} className="flex items-center justify-between">
                <span className="text-[9px] font-oswald uppercase text-green-800">{row.category}</span>
                <span className={`text-[10px] font-bebas ${categoryColor(row.points, row.max)}`}>
                  {row.points > 0 ? `+${row.points}` : "—"}
                  <span className="text-[9px] text-green-900 ml-1">/{row.max || "—"}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-green-900/20" />

        {/* Outras fases */}
        {otherRows.map(row => (
          <div key={row.category} className="flex items-center justify-between py-1 px-2 rounded hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-oswald uppercase tracking-wider text-green-500">{row.category}</span>
              {row.max > 0 && row.total > 0 && (
                <span className="text-[9px] font-mono text-green-800">{row.hits}/{row.total}</span>
              )}
            </div>
            <span className={`text-sm font-bebas ${categoryColor(row.points, row.max)}`}>
              {row.points > 0 ? `+${row.points}` : "—"}
              <span className="text-[9px] text-green-900 ml-1">/{row.max || "—"}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupHits(breakdown: { category: string; hits: number }[]) {
  return breakdown.slice(0, 3).reduce((s, b) => s + b.hits, 0);
}
function groupMatchesCount(breakdown: { category: string; total: number }[]) {
  return breakdown[0]?.total || 0;
}

function BestThirdsTable() {
  const { getBestThirdsWithGroups, getThirdMatchupAssignment } = useSimulator();
  const thirds = getBestThirdsWithGroups();
  const assignment = getThirdMatchupAssignment();

  if (thirds.length === 0) return null;

  // Monta reverso: groupId → slot atribuído
  const groupToSlot: Record<string, string> = {};
  for (const [slot, teamId] of Object.entries(assignment)) {
    const third = thirds.find(t => t.teamId === teamId);
    if (third) groupToSlot[third.groupId] = slot;
  }

  return (
    <div className="max-w-3xl mx-auto bg-[#081a08]/80 border border-green-900/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl mt-12">
      <div className="bg-black/60 p-4 border-b border-green-900/30 text-center">
        <h3 className="text-xl font-bebas text-yellow-500 tracking-widest uppercase">8 Melhores Terceiros Colocados</h3>
        <p className="text-[10px] text-green-700 font-oswald uppercase mt-1">
          Classificados para a Segunda Rodada · Chaveamento conforme tabela oficial FIFA 2026
        </p>
      </div>
      <div className="p-4 space-y-2">
        {thirds.map((t, idx) => {
          const slot = groupToSlot[t.groupId];
          const facesGroup = slot ? SLOT_TO_FIRST[slot] : null;
          return (
            <div key={t.teamId} className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded border border-green-500/20">
              {/* Posição */}
              <span className="text-[11px] font-bebas text-yellow-600 w-5 text-right shrink-0">{idx + 1}º</span>
              {/* Grupo de origem */}
              <span className="text-[9px] font-oswald text-green-700 bg-green-900/30 border border-green-900/50 px-1.5 py-0.5 rounded uppercase shrink-0">
                Gr. {t.groupId}
              </span>
              {/* Bandeira + nome */}
              <TeamFlag teamId={t.teamId} className="w-6 h-4 shrink-0" fallback={TEAMS[t.teamId].flag} />
              <span className="text-[11px] font-oswald text-white uppercase flex-1 truncate">{TEAMS[t.teamId].name}</span>
              {/* Confronto atribuído pela FIFA */}
              {facesGroup ? (
                <span className="text-[9px] font-bebas text-green-400 bg-green-900/30 border border-green-500/20 px-2 py-0.5 rounded shrink-0">
                  vs 1º {facesGroup}
                </span>
              ) : (
                <span className="text-[9px] font-oswald text-green-900 shrink-0">aguardando</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// STATS TAB
// ============================================================
interface MatchStat {
  matchId: string;
  groupId: string;
  homeTeamId: string;
  awayTeamId: string;
  officialHome: number;
  officialAway: number;
  total: number;
  resultHits: number;
  exactHits: number;
  topPredictions: { score: string; count: number }[];
}

function StatsTab() {
  const [stats, setStats] = useState<MatchStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/match-stats')
      .then(res => res.json())
      .then((data: MatchStat[]) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
      <p className="text-green-700 font-oswald uppercase tracking-widest">Carregando Estatísticas...</p>
    </div>
  );

  if (stats.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <BarChart2 className="w-16 h-16 text-green-900" />
      <div className="text-center">
        <p className="text-green-700 font-bebas text-2xl tracking-widest uppercase">Nenhum resultado oficial ainda</p>
        <p className="text-green-900 font-oswald text-sm mt-2 uppercase tracking-wider">
          As estatísticas aparecem conforme o admin registra os placares reais
        </p>
      </div>
    </div>
  );

  // Agrupar por grupo
  const byGroup: Record<string, MatchStat[]> = {};
  stats.forEach(s => {
    if (!byGroup[s.groupId]) byGroup[s.groupId] = [];
    byGroup[s.groupId].push(s);
  });

  // Totais gerais
  const totalMatches = stats.length;
  const totalResultHits = stats.reduce((s, m) => s + m.resultHits, 0);
  const totalExactHits = stats.reduce((s, m) => s + m.exactHits, 0);
  const totalPreds = stats.reduce((s, m) => s + m.total, 0);
  const avgResultPct = totalPreds > 0 ? Math.round((totalResultHits / totalPreds) * 100) : 0;
  const avgExactPct  = totalPreds > 0 ? Math.round((totalExactHits  / totalPreds) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-5xl font-bebas text-green-400 uppercase tracking-[0.2em]">ESTATÍSTICAS DOS JOGOS</h2>
        <div className="h-1 w-32 bg-green-700 mx-auto mt-4 rounded-full" />
        <p className="mt-6 text-xs font-oswald text-green-700 uppercase tracking-wider">
          Comparativo entre previsões dos participantes e resultados oficiais
        </p>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Jogos Encerrados', value: totalMatches, color: 'text-green-400' },
          { label: 'Total de Previsões', value: totalPreds, color: 'text-green-400' },
          { label: 'Acertos de Resultado', value: `${avgResultPct}%`, color: 'text-green-400', sub: 'média geral' },
          { label: 'Placar Exato',         value: `${avgExactPct}%`,  color: 'text-yellow-500', sub: 'média geral' },
        ].map(card => (
          <div key={card.label} className="bg-[#081a08]/80 border border-green-900/50 rounded-xl p-4 text-center backdrop-blur-md">
            <p className={`text-3xl font-bebas ${card.color}`}>{card.value}</p>
            <p className="text-[10px] font-oswald text-green-700 uppercase tracking-wider mt-1">{card.label}</p>
            {card.sub && <p className="text-[9px] font-mono text-green-900 mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Por grupo */}
      {Object.entries(byGroup).sort(([a], [b]) => a.localeCompare(b)).map(([groupId, matches]) => (
        <div key={groupId} className="bg-[#081a08]/80 border border-green-900/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="bg-black/40 px-6 py-4 border-b border-green-900/30 flex items-center justify-between">
            <h3 className="text-2xl font-bebas text-green-400 tracking-widest uppercase">Grupo {groupId}</h3>
            <span className="text-[10px] font-oswald text-green-800 uppercase">{matches.length} jogo{matches.length > 1 ? 's' : ''} encerrado{matches.length > 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-green-900/10">
            {matches.map(m => {
              const resultPct = m.total > 0 ? Math.round((m.resultHits / m.total) * 100) : 0;
              const exactPct  = m.total > 0 ? Math.round((m.exactHits  / m.total) * 100) : 0;
              const homeTeam = TEAMS[m.homeTeamId];
              const awayTeam = TEAMS[m.awayTeamId];
              return (
                <div key={m.matchId} className="p-4 md:p-6 space-y-4">
                  {/* Cabeçalho do jogo */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TeamFlag teamId={m.homeTeamId} className="w-8 h-6 shrink-0" fallback={homeTeam?.flag} />
                      <span className="font-bebas text-lg text-white truncate">{homeTeam?.name}</span>
                    </div>
                    <span className="font-bebas text-2xl text-yellow-500 px-3 shrink-0 bg-black/30 rounded-lg border border-yellow-900/30 py-0.5">
                      {m.officialHome} – {m.officialAway}
                    </span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="font-bebas text-lg text-white truncate text-right">{awayTeam?.name}</span>
                      <TeamFlag teamId={m.awayTeamId} className="w-8 h-6 shrink-0" fallback={awayTeam?.flag} />
                    </div>
                    <span className="w-full text-right text-[10px] font-oswald text-green-900 uppercase">{m.total} participante{m.total !== 1 ? 's' : ''} apostaram</span>
                  </div>

                  {/* Barras de acerto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-oswald uppercase text-green-700">
                        <span>Acertou o resultado (V/E/D)</span>
                        <span className="text-green-400 font-bold">{m.resultHits}/{m.total} · {resultPct}%</span>
                      </div>
                      <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${resultPct}%`,
                            background: resultPct >= 60 ? '#22c55e' : resultPct >= 35 ? '#84cc16' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-oswald uppercase text-green-700">
                        <span>Placar exato</span>
                        <span className="text-yellow-500 font-bold">{m.exactHits}/{m.total} · {exactPct}%</span>
                      </div>
                      <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full transition-all duration-700"
                          style={{ width: `${exactPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Placares mais apostados */}
                  {m.topPredictions.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-oswald text-green-800 uppercase tracking-widest shrink-0">Mais apostados:</span>
                      {m.topPredictions.map((p, i) => {
                        const isCorrect = p.score === `${m.officialHome}-${m.officialAway}`;
                        return (
                          <span key={i} className={`text-[10px] font-bebas px-2 py-0.5 rounded border ${
                            isCorrect
                              ? 'text-green-300 bg-green-500/15 border-green-500/40'
                              : 'text-green-800 bg-black/20 border-green-900/30'
                          }`}>
                            {p.score}
                            <span className="text-[8px] opacity-60 ml-1">({p.count}×)</span>
                            {isCorrect && <span className="ml-1 text-green-400">✓</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// COUNTDOWN TIMER
// ============================================================
function CountdownTimer({ deadline }: { deadline: string | null }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadline) return;
    const target = new Date(deadline).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) { setExpired(true); setTimeLeft(null); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;

  return (
    <div className="bg-black/40 border border-yellow-900/30 rounded-xl p-3 backdrop-blur-sm">
      <p className="text-[9px] font-oswald text-yellow-700 uppercase tracking-widest mb-2 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Prazo para palpites
      </p>
      {expired ? (
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-500" />
          <span className="text-red-400 font-bebas text-lg tracking-widest">PRAZO ENCERRADO</span>
        </div>
      ) : timeLeft ? (
        <div className="flex items-center gap-2">
          {[
            { v: timeLeft.days, l: "DIAS" },
            { v: timeLeft.hours, l: "HRS" },
            { v: timeLeft.minutes, l: "MIN" },
            { v: timeLeft.seconds, l: "SEG" },
          ].map(({ v, l }, i) => (
            <div key={l} className="flex items-center gap-1">
              {i > 0 && <span className="text-yellow-900 font-bebas text-lg">:</span>}
              <div className="text-center">
                <div className="font-bebas text-2xl text-yellow-400 leading-none">{String(v).padStart(2, "0")}</div>
                <div className="text-[8px] font-mono text-yellow-800">{l}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-yellow-700 animate-spin" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// RANKING POR SETOR
// ============================================================
function SectorRankingTab() {
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ranking/by-sector")
      .then(r => r.json())
      .then(data => { setSectors(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
      <p className="text-green-700 font-oswald uppercase tracking-widest">Carregando Ranking por Setor...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-5xl font-bebas text-green-400 uppercase tracking-[0.2em]">RANKING POR SETOR</h2>
        <div className="h-1 w-32 bg-green-700 mx-auto mt-4 rounded-full" />
        <p className="mt-6 text-xs font-oswald text-green-700 uppercase tracking-wider">
          Desempenho médio por departamento — clique para ver os membros
        </p>
      </div>

      <div className="space-y-3">
        {sectors.map((sector, idx) => (
          <div key={sector.department} className="bg-[#081a08]/80 border border-green-900/50 rounded-2xl overflow-hidden backdrop-blur-md">
            <button
              onClick={() => setExpandedSector(expandedSector === sector.department ? null : sector.department)}
              className="w-full flex items-center gap-4 p-5 hover:bg-white/5 transition-colors"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bebas border-2 shrink-0 ${
                idx === 0 ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" :
                idx === 1 ? "bg-gray-400/20 border-gray-400 text-gray-300" :
                idx === 2 ? "bg-amber-700/20 border-amber-700 text-amber-600" :
                "bg-green-900/20 border-green-900 text-green-700"
              }`}>
                {idx + 1}º
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-green-700 shrink-0" />
                  <p className="font-bebas text-xl text-white tracking-widest truncate">{sector.department}</p>
                </div>
                <p className="text-[10px] font-oswald text-green-700 uppercase">
                  {sector.count} membro{sector.count !== 1 ? "s" : ""} · maior pontuação: {sector.topScore}pts
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bebas text-yellow-500">{sector.avgScore}</p>
                <p className="text-[9px] font-mono text-green-700">MÉDIA pts</p>
              </div>
              <ChevronDown className={`w-5 h-5 text-green-700 transition-transform shrink-0 ${expandedSector === sector.department ? "rotate-180" : ""}`} />
            </button>
            {expandedSector === sector.department && (
              <div className="border-t border-green-900/20 divide-y divide-green-900/10">
                {sector.members.map((m: any, mi: number) => (
                  <div key={mi} className="flex items-center justify-between px-6 py-3 hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-900/30 flex items-center justify-center text-[10px] font-bold text-green-500">
                        {m.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-oswald text-sm text-green-100 uppercase">{m.name}</span>
                    </div>
                    <span className="font-bebas text-lg text-green-400">{m.score} <span className="text-[10px] text-green-700">pts</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// VER PREVISÕES DE OUTRO USUÁRIO (MODAL)
// ============================================================
function ViewPredictionsModal({ userId, userName, onClose }: { userId: number; userName: string; onClose: () => void }) {
  const [preds, setPreds] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("worldcup_auth_token");
    fetch(`/api/predictions/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); }))
      .then(data => { setPreds(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#081a08] border border-green-900/50 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#081a08] border-b border-green-900/30 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bebas text-xl text-green-400 tracking-widest">PREVISÕES DE {userName.toUpperCase()}</h3>
            <p className="text-[10px] font-mono text-green-700">Visíveis após o encerramento do prazo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-green-700" />
          </button>
        </div>
        <div className="p-6">
          {loading && <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>}
          {error && <p className="text-red-400 font-oswald text-center uppercase py-8">{error}</p>}
          {!loading && !error && !preds && <p className="text-green-700 font-oswald text-center uppercase py-8">Este usuário não fez previsões ainda</p>}
          {preds && (
            <div className="space-y-6">
              {/* Campeão */}
              {preds.finalPrediction && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-oswald text-yellow-700 uppercase tracking-widest mb-1">Campeão previsto</p>
                  <p className="font-bebas text-3xl text-yellow-400">{TEAMS[preds.finalPrediction]?.name || preds.finalPrediction}</p>
                </div>
              )}
              {/* Finalistas */}
              {preds.finalistPrediction?.filter(Boolean).length > 0 && (
                <div className="bg-black/40 border border-green-900/20 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-oswald text-green-700 uppercase tracking-widest">Finalistas</p>
                  <div className="flex gap-3 flex-wrap">
                    {preds.finalistPrediction.filter(Boolean).map((t: string, i: number) => (
                      <span key={i} className="font-bebas text-lg text-green-400 bg-green-900/20 border border-green-900/40 px-3 py-1 rounded-lg">
                        {TEAMS[t]?.name || t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Placares por grupo */}
              {preds.groupPredictions && (
                <div className="space-y-4">
                  <p className="text-[10px] font-oswald text-green-700 uppercase tracking-widest border-b border-green-900/20 pb-2">Placares da fase de grupos</p>
                  {Object.entries(preds.groupPredictions as Record<string, any>).sort().map(([gid, gp]) => {
                    const matches = (gp as any).matchPredictions?.filter((m: any) => m.homeScore !== null && m.awayScore !== null) || [];
                    if (matches.length === 0) return null;
                    return (
                      <div key={gid} className="space-y-1">
                        <p className="text-[10px] font-bebas text-green-600 tracking-widest">GRUPO {gid}</p>
                        {matches.map((m: any) => {
                          const match = GROUP_MATCHES.find(gm => gm.id === m.matchId);
                          if (!match) return null;
                          return (
                            <div key={m.matchId} className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded text-[11px] font-oswald uppercase">
                              <span className="text-green-200 truncate flex-1 text-right">{TEAMS[match.homeTeamId]?.name}</span>
                              <span className="mx-3 font-bebas text-yellow-400 text-base shrink-0">{m.homeScore} × {m.awayScore}</span>
                              <span className="text-green-200 truncate flex-1">{TEAMS[match.awayTeamId]?.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL DE PERFIL / ALTERAR SENHA
// ============================================================
function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthContext();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const token = () => localStorage.getItem("worldcup_auth_token") ?? "";
  const jsonH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

    const DEPARTMENTS = [
    "Administrativo",
    "Central de Atendimento",
    "Comissões",
    "Comunicação",
    "Conselho Pleno",
    "Controladoria",
    "Digitalização",
    "ESA",
    "Eventos",
    "Exame de Ordem",
    "Gabinete",
    "Inclusão Digital",
    "Ouvidoria",
    "Procuradoria Geral",
    "RH",
    "Secretaria",
    "Sede Balnearia",
    "Subsecao",
    "Tecnologia",
    "TED",
    "Tesouraria",
    "Sociedades",
    "Contabilidade",
    "CAASC",
    "Compras"
  ];

  const handleSaveProfile = async () => {
    if (!name.trim() || !department) return setMsg({ type: "error", text: "Preencha nome e setor" });
    setSaving(true);
    try {
      const r = await fetch("/api/auth/update-profile", {
        method: "POST", headers: jsonH(), body: JSON.stringify({ name, department })
      });
      const data = await r.json();
      if (r.ok) {
        setMsg({ type: "success", text: "Perfil atualizado! Recarregue para ver as mudanças." });
        const storedUser = JSON.parse(localStorage.getItem("worldcup_user") || "{}");
        localStorage.setItem("worldcup_user", JSON.stringify({ ...storedUser, name: data.name, department: data.department }));
      } else {
        setMsg({ type: "error", text: data.error || "Erro ao atualizar perfil" });
      }
    } catch { setMsg({ type: "error", text: "Erro de conexão" }); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) return setMsg({ type: "error", text: "Preencha todos os campos" });
    if (newPass !== confirmPass) return setMsg({ type: "error", text: "As senhas não coincidem" });
    if (newPass.length < 6) return setMsg({ type: "error", text: "Nova senha deve ter pelo menos 6 caracteres" });
    setSaving(true);
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST", headers: jsonH(), body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
      });
      const data = await r.json();
      if (r.ok) {
        setMsg({ type: "success", text: "Senha alterada com sucesso!" });
        setCurrentPass(""); setNewPass(""); setConfirmPass("");
      } else {
        setMsg({ type: "error", text: data.error || "Erro ao alterar senha" });
      }
    } catch { setMsg({ type: "error", text: "Erro de conexão" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#081a08] border border-green-900/50 rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="border-b border-green-900/30 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bebas text-xl text-green-400 tracking-widest">MEU PERFIL</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-green-700" />
          </button>
        </div>
        <div className="flex border-b border-green-900/20">
          {(["profile", "password"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 font-bebas tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${tab === t ? "text-green-400 border-b-2 border-green-500" : "text-green-800 hover:text-green-600"}`}>
              {t === "profile" ? <><User className="w-4 h-4" /> DADOS</> : <><KeyRound className="w-4 h-4" /> SENHA</>}
            </button>
          ))}
        </div>
        <div className="p-6 space-y-4">
          {tab === "profile" && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-green-700 uppercase">Nome completo</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-black/60 border border-green-900/50 rounded-lg px-3 py-2.5 text-green-300 text-sm outline-none focus:border-green-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-green-700 uppercase">Email</label>
                <input value={user?.email || ""} disabled
                  className="w-full bg-black/40 border border-green-900/30 rounded-lg px-3 py-2.5 text-green-700 text-sm cursor-not-allowed" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-green-700 uppercase">Setor / Departamento</label>
                <select value={department} onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-black/60 border border-green-900/50 rounded-lg px-3 py-2.5 text-green-300 text-sm outline-none focus:border-green-500">
                  <option value="">Selecione...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button onClick={handleSaveProfile} disabled={saving}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bebas tracking-[0.3em] rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} SALVAR PERFIL
              </button>
            </>
          )}
          {tab === "password" && (
            <>
              {(["Senha atual", "Nova senha", "Confirmar nova senha"] as const).map((label, i) => {
                const vals = [currentPass, newPass, confirmPass];
                const sets = [setCurrentPass, setNewPass, setConfirmPass];
                return (
                  <div key={i} className="space-y-1.5">
                    <label className="text-[10px] font-mono text-green-700 uppercase">{label}</label>
                    <input type="password" value={vals[i]} onChange={e => sets[i](e.target.value)}
                      className="w-full bg-black/60 border border-green-900/50 rounded-lg px-3 py-2.5 text-green-300 text-sm outline-none focus:border-green-500" />
                  </div>
                );
              })}
              <button onClick={handleChangePassword} disabled={saving}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bebas tracking-[0.3em] rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} ALTERAR SENHA
              </button>
            </>
          )}
          {msg && (
            <div className={`rounded-lg px-4 py-3 text-sm font-oswald uppercase text-center ${msg.type === "success" ? "bg-green-900/30 border border-green-700/40 text-green-400" : "bg-red-900/30 border border-red-700/40 text-red-400"}`}>
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, logout } = useAuthContext();
  const { 
    state, resetAll, setConfirmedGroups, setConfirmedKnockout,
    hasUnsavedChanges, isSaving, savePredictionsToDatabase 
  } = useSimulator();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"ranking" | "sector" | "groups" | "knockout" | "stats" | "rules" | "payment" | "awards">("ranking");
  const [deadline, setDeadline] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewPredUser, setViewPredUser] = useState<{ id: number; name: string } | null>(null);
  const [confirmEditTab, setConfirmEditTab] = useState<"groups" | "knockout" | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const prevResultsRef = useRef<number>(-1);

  const confirmedGroups = state.confirmedGroups;
  const confirmedKnockout = state.confirmedKnockout;

  // Busca deadline e verifica notificações de novos resultados
  useEffect(() => {
    fetch("/api/config")
      .then(r => r.ok ? r.json() : null)
      .then(cfg => {
        if (cfg) {
          setDeadline(cfg.predictionDeadline || null);
          setIsLocked(cfg.isLocked || false);
        }
      })
      .catch(() => {});
  }, []);

  // Polling de novos resultados para notificação (a cada 60s)
  useEffect(() => {
    const checkResults = () => {
      fetch("/api/admin/results", { headers: { Authorization: `Bearer ${localStorage.getItem("worldcup_auth_token") || ""}` } })
        .then(r => r.ok ? r.json() : [])
        .then((data: any[]) => {
          const count = data.length;
          if (prevResultsRef.current >= 0 && count > prevResultsRef.current) {
            const diff = count - prevResultsRef.current;
            setNotification(`🏆 ${diff} novo${diff > 1 ? "s resultado(s)" : " resultado"} registrado${diff > 1 ? "s" : ""}!`);
            setTimeout(() => setNotification(null), 7000);
          }
          prevResultsRef.current = count;
        })
        .catch(() => {});
    };
    checkResults();
    const id = setInterval(checkResults, 60000);
    return () => clearInterval(id);
  }, []);

  // Limpar localStorage corrompido na primeira renderização
  useEffect(() => {
    try {
      const stored = localStorage.getItem('worldcup2026_simulator');
      if (stored && stored.length > 2000000) {
        localStorage.removeItem('worldcup2026_simulator');
        window.location.reload();
      }
    } catch (e) {
      localStorage.removeItem('worldcup2026_simulator');
    }
  }, []);

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
    const expected = 16 + 8 + 4 + 2 + 2 + 1; // SR, R16, QF, SF, Finalists, Champion
    return { total, expected };
  };

  const groupStats = countGroupMatches();
  const knockoutStats = countKnockoutMatches();
  const isGroupsComplete = groupStats.predicted === groupStats.total && groupStats.total > 0;
  const isKnockoutComplete = knockoutStats.total === knockoutStats.expected;

  return (
    <div className="min-h-screen tactical-bg">
      {/* Banner de previsões encerradas */}
      {isLocked && (
        <div className="w-full bg-red-950/90 border-b-2 border-red-500/60 backdrop-blur-sm sticky top-0 z-[60]">
          <div className="container flex items-center justify-center gap-3 py-3 px-4">
            <Lock className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <p className="text-red-200 font-oswald text-sm uppercase tracking-widest text-center">
              ⛔ Previsões encerradas — o prazo para palpites foi fechado pelo administrador. Você pode visualizar suas previsões, mas não alterá-las.
            </p>
            <Lock className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="relative h-[480px] w-full overflow-hidden border-b border-green-900/50">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#040d04]/60 to-[#040d04]" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000')] bg-cover bg-center grayscale" />
        
        <div className="container relative h-full flex flex-col justify-between py-4">
          {/* Barra superior: usuário + botões */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-green-900/20 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <p className="text-[10px] text-white font-mono uppercase tracking-tight truncate">
                <span className="hidden sm:inline">LOGADO COMO: </span>
                <span className="text-green-400 font-bold">{user?.name}</span>
              </p>
              <div className={`ml-1 px-2 py-0.5 rounded text-[8px] font-bebas tracking-widest uppercase border shrink-0 ${
                user?.hasPaid
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-red-500/20 border-red-500 text-red-400"
              }`}>
                {user?.hasPaid ? "PAGAMENTO CONFIRMADO" : "PAGAMENTO PENDENTE"}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <CountdownTimer deadline={deadline} />
              <button onClick={() => setShowProfileModal(true)} className="bg-black/60 hover:bg-black/80 border border-green-900/50 text-green-500 p-2 rounded-lg transition-all" title="Meu Perfil">
                <User className="w-4 h-4" />
              </button>
              {user?.role === "admin" && (
                <button onClick={() => setLocation("/admin")} className="bg-yellow-950/20 hover:bg-yellow-950/40 border border-yellow-900/30 text-yellow-500 px-3 py-2 rounded-lg text-[10px] font-oswald uppercase flex items-center gap-1.5 tracking-widest transition-all">
                  <Shield className="w-3 h-3" /> <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              <button onClick={logout} className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-500 px-3 py-2 rounded-lg text-[10px] font-oswald uppercase flex items-center gap-1.5 tracking-widest transition-all">
                <LogOut className="w-3 h-3" /> <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Conteúdo central: taça + título */}
          <div className="flex items-center gap-6 lg:gap-12 flex-1 py-4">
            <div className="hidden lg:block shrink-0 relative">
              <div className="absolute inset-0 bg-yellow-500/20 blur-[100px] rounded-full animate-pulse" />
              <img src="./assets/taca.png" alt="Taça da Copa" className="h-[300px] xl:h-[360px] object-contain drop-shadow-[0_0_40px_rgba(234,179,8,0.4)] relative z-10" />
            </div>

            <div className="relative z-10 min-w-0">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bebas text-white leading-[0.85] mb-3">
                BOLÃO <br />
                <span className="text-yellow-500">FUNCIONÁRIOS DA OAB</span>
              </h1>
              <p className="max-w-xl text-green-500/70 font-oswald text-xs sm:text-sm md:text-base leading-relaxed mb-4 hidden sm:block">
                Faça suas previsões para todos os jogos, escolha os classificados de cada fase e tente acertar o campeão mundial. Acumule pontos por cada acerto!
              </p>
              <div className="flex flex-wrap gap-3 text-[10px] font-oswald uppercase tracking-widest text-green-800">
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 48 equipes</span>
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 12 grupos</span>
                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 5 fases</span>
                <span className="hidden md:flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 72 jogos na fase de grupos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-black/90 backdrop-blur-xl sticky top-0 z-50 border-y border-green-900/30 shadow-2xl group/nav">
        <div className="container relative">
          {/* Seta Esquerda */}
          <button 
            onClick={() => {
              const el = document.getElementById('main-nav-scroll');
              if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 p-1 rounded-full border border-blue-500/30 transition-all opacity-0 group-hover/nav:opacity-100 hidden md:flex"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>

          <div id="main-nav-scroll" className="flex items-center gap-4 md:gap-8 xl:gap-12 py-3 md:py-4 xl:py-5 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab("ranking")}
            className={`flex items-center gap-1.5 md:gap-3 font-bebas text-base md:text-xl xl:text-2xl tracking-widest transition-all shrink-0 ${activeTab === "ranking" ? "text-yellow-500 scale-110" : "text-green-900 hover:text-green-700"}`}
          >
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> RANKING GLOBAL
          </button>
          <button 
            onClick={() => setActiveTab("sector")}
            className={`flex items-center gap-1.5 md:gap-3 font-bebas text-base md:text-xl xl:text-2xl tracking-widest transition-all shrink-0 ${activeTab === "sector" ? "text-yellow-500 scale-110" : "text-green-900 hover:text-green-700"}`}
          >
            <Building2 className="w-4 h-4 md:w-5 md:h-5" /> POR SETOR
          </button>
          <button 
            onClick={() => setActiveTab("groups")}
            className={`flex flex-col items-start transition-all shrink-0 ${activeTab === "groups" ? "scale-110" : "hover:opacity-80"}`}
          >
            <div className={`flex items-center gap-1.5 md:gap-3 font-bebas text-base md:text-xl xl:text-2xl tracking-widest ${activeTab === "groups" ? "text-green-400" : "text-green-900"}`}>
              <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" /> FASE DE GRUPOS <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === "groups" ? "bg-green-500 text-black" : "bg-green-900/30 text-green-700"}`}>12/12</span>
            </div>
            {confirmedGroups && <span className="text-[10px] font-oswald text-green-500 uppercase tracking-tighter mt-0.5">Seleção Confirmada!</span>}
          </button>
          <button 
            onClick={() => setActiveTab("knockout")}
            className={`flex flex-col items-start transition-all shrink-0 ${activeTab === "knockout" ? "scale-110" : "hover:opacity-80"}`}
          >
            <div className={`flex items-center gap-1.5 md:gap-3 font-bebas text-base md:text-xl xl:text-2xl tracking-widest ${activeTab === "knockout" ? "text-green-400" : "text-green-900"}`}>
              <Trophy className="w-4 h-4 md:w-5 md:h-5" /> ELIMINATÓRIAS <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTab === "knockout" ? "bg-green-500 text-black" : "bg-green-900/30 text-green-700"}`}>32 TIMES</span>
            </div>
            {confirmedKnockout && <span className="text-[10px] font-oswald text-green-500 uppercase tracking-tighter mt-0.5">Seleção Confirmada!</span>}
          </button>
          <button 
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-1.5 md:gap-3 font-bebas text-base md:text-xl xl:text-2xl tracking-widest transition-all shrink-0 ${activeTab === "stats" ? "text-green-400 scale-110" : "text-green-900 hover:text-green-700"}`}
          >
            <BarChart2 className="w-4 h-4 md:w-5 md:h-5" /> ESTATÍSTICAS
          </button>
          <button 
            onClick={() => setActiveTab("awards")}
            className={`flex items-center gap-1.5 md:gap-3 font-bebas text-base md:text-xl xl:text-2xl tracking-widest transition-all shrink-0 ${activeTab === "awards" ? "text-yellow-500 scale-110" : "text-green-900 hover:text-green-700"}`}
          >
            <Trophy className="w-4 h-4 md:w-5 md:h-5" /> PREMIAÇÃO
          </button>
          <button 
            onClick={() => setActiveTab("payment")}
            className={`flex items-center gap-1.5 md:gap-3 font-bebas text-base md:text-xl xl:text-2xl tracking-widest transition-all shrink-0 ${activeTab === "payment" ? "text-yellow-500 scale-110" : "text-green-900 hover:text-green-700"}`}
          >
            <Shield className="w-4 h-4 md:w-5 md:h-5" /> PAGAMENTO
          </button>
          <button 
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-1.5 md:gap-3 font-bebas text-base md:text-xl xl:text-2xl tracking-widest transition-all shrink-0 ${activeTab === "rules" ? "text-green-400 scale-110" : "text-green-900 hover:text-green-700"}`}
          >
            <ClipboardList className="w-4 h-4 md:w-5 md:h-5" /> REGRAS & PONTOS
          </button>
          </div>

          {/* Seta Direita */}
          <button 
            onClick={() => {
              const el = document.getElementById('main-nav-scroll');
              if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 p-1 rounded-full border border-blue-500/30 transition-all opacity-0 group-hover/nav:opacity-100 hidden md:flex"
          >
            <ChevronDown className="w-5 h-5 -rotate-90" />
          </button>
        </div>
      </div>

      <div className="container py-8 md:py-16">
        <div className="flex flex-col-reverse lg:flex-row gap-8 md:gap-12 items-start">
          <div className="flex-1 w-full">
            {activeTab === "ranking" && <RankingTab onViewPredictions={(id, name) => setViewPredUser({ id, name })} />}
            {activeTab === "sector" && <SectorRankingTab />}
            {activeTab === "groups" && (
              <div className="space-y-12">

                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${confirmedGroups && !isLocked ? "pointer-events-none opacity-80" : ""}`}>
                  {GROUPS.map(g => <GroupCard key={g.id} groupId={g.id} />)}
                </div>
                
                <BestThirdsTable />


              </div>
            )}
            {activeTab === "knockout" && (
              <div className="space-y-12">
                <div className={confirmedKnockout ? "pointer-events-none opacity-80" : ""}>
                  <KnockoutSection />
                </div>

              </div>
            )}
            {activeTab === "stats" && <StatsTab />}
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
            {activeTab === "payment" && (
              <div className="max-w-3xl mx-auto bg-[#081a08]/80 border border-green-900/50 rounded-2xl p-10 backdrop-blur-md shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                <h2 className="text-4xl font-bebas text-yellow-500 mb-8 text-center uppercase tracking-widest">Instruções de Pagamento</h2>
                
                <div className="space-y-8 font-oswald uppercase tracking-wider">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-8 text-center space-y-4">
                    <p className="text-green-400 text-sm">Valor da inscrição:</p>
                    <p className="text-5xl font-bebas text-yellow-400 tracking-widest">R$ 30,00</p>
                    <div className="h-px w-20 bg-yellow-500/30 mx-auto" />
                    <p className="text-green-400 text-sm">Realizar o Pix para CPF:</p>
                    <p className="text-4xl font-bebas text-white tracking-widest">103.201.589-69</p>
                    <div className="h-px w-20 bg-yellow-500/30 mx-auto" />
                    <p className="text-green-400 text-sm">Email para enviar comprovante:</p>
                    <p className="text-xl text-yellow-500 lowercase font-mono">Enzo@oab-sc.org.br</p>
                  </div>

                  <div className="bg-red-500/10 border-l-4 border-red-500 p-6 space-y-4">
                    <div className="flex items-center gap-3 text-red-500">
                      <AlertCircle className="w-6 h-6" />
                      <h3 className="text-xl font-bebas tracking-widest">Atenção aos Prazos</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-red-200/80">
                      Estaremos aceitando os pagamentos até o dia <span className="text-red-500 font-bold">09/06/2026</span>, a fim de finalizar o período de preenchimento do bolão e validar a confirmação de pagamento de todos os usuários cadastrados.
                    </p>
                    <p className="text-xs leading-relaxed text-red-200/80">
                      Depois do dia 09, o bolão estará disponível, porém <span className="text-red-500 font-bold">bloqueado para edição</span>. Portanto, façam o quanto antes para não terem problemas após o preenchimento.
                    </p>
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-[10px] text-green-700 font-mono">
                      Sua participação só será validada após a confirmação do recebimento.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "awards" && (
              <div className="max-w-3xl mx-auto bg-[#081a08]/80 border border-green-900/50 rounded-2xl p-10 backdrop-blur-md shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                <h2 className="text-4xl font-bebas text-yellow-500 mb-8 text-center uppercase tracking-widest">Premiação</h2>
                
                <div className="space-y-8 font-oswald uppercase tracking-wider">
                  <p className="text-green-400 text-center text-xs mb-4">O valor arrecadado será dividido na seguinte proporção:</p>
                  
                  <div className="space-y-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bebas text-2xl">1º</div>
                        <span className="text-2xl text-white font-bebas tracking-widest">Primeiro Colocado</span>
                      </div>
                      <span className="text-4xl text-yellow-500 font-bebas">65%</span>
                    </div>

                    <div className="bg-slate-400/10 border border-slate-400/30 rounded-xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-400 flex items-center justify-center text-black font-bebas text-2xl">2º</div>
                        <span className="text-2xl text-white font-bebas tracking-widest">Segundo Colocado</span>
                      </div>
                      <span className="text-4xl text-slate-400 font-bebas">25%</span>
                    </div>

                    <div className="bg-orange-700/10 border border-orange-700/30 rounded-xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-700 flex items-center justify-center text-black font-bebas text-2xl">3º</div>
                        <span className="text-2xl text-white font-bebas tracking-widest">Terceiro Colocado</span>
                      </div>
                      <span className="text-4xl text-orange-700 font-bebas">10%</span>
                    </div>
                  </div>

                  <div className="text-center pt-8">
                    <p className="text-[10px] text-green-700 font-mono">
                      Os valores finais dependem do total de participantes confirmados.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-24 space-y-6">
            <ScoringPanel />

          </div>
        </div>
      </div>

      {/* Botão Flutuante Unificado */}
      {!isLocked && (
        <>
          {/* ABA GRUPOS */}
          {activeTab === "groups" && confirmedGroups && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
              <button
                onClick={() => setConfirmEditTab("groups")}
                disabled={isSaving}
                className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-60 text-black font-bebas text-2xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(234,179,8,0.5)] flex items-center gap-3 border-2 border-white/20 whitespace-nowrap"
              >
                <RotateCcw className="w-6 h-6" />
                EDITAR SELEÇÃO
              </button>
            </div>
          )}
          {activeTab === "groups" && !confirmedGroups && isGroupsComplete && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
              <button
                onClick={() => { setConfirmedGroups(true); savePredictionsToDatabase(); }}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-black font-bebas text-2xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(34,197,94,0.5)] flex items-center gap-3 border-2 border-white/20 whitespace-nowrap"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                SALVAR E CONFIRMAR
              </button>
            </div>
          )}
          {activeTab === "groups" && !confirmedGroups && !isGroupsComplete && hasUnsavedChanges && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
              <button
                onClick={savePredictionsToDatabase}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bebas text-xl px-10 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-3 border-2 border-white/20 whitespace-nowrap"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                SALVAR ALTERAÇÕES
              </button>
            </div>
          )}

          {/* ABA ELIMINATÓRIAS */}
          {activeTab === "knockout" && confirmedKnockout && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
              <button
                onClick={() => setConfirmEditTab("knockout")}
                disabled={isSaving}
                className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-60 text-black font-bebas text-2xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(234,179,8,0.5)] flex items-center gap-3 border-2 border-white/20 whitespace-nowrap"
              >
                <RotateCcw className="w-6 h-6" />
                EDITAR SELEÇÃO
              </button>
            </div>
          )}
          {activeTab === "knockout" && !confirmedKnockout && isKnockoutComplete && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
              <button
                onClick={() => { setConfirmedKnockout(true); savePredictionsToDatabase(); }}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-black font-bebas text-2xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(34,197,94,0.5)] flex items-center gap-3 border-2 border-white/20 whitespace-nowrap"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                SALVAR E CONFIRMAR
              </button>
            </div>
          )}
          {activeTab === "knockout" && !confirmedKnockout && !isKnockoutComplete && hasUnsavedChanges && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
              <button
                onClick={savePredictionsToDatabase}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bebas text-xl px-10 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-3 border-2 border-white/20 whitespace-nowrap"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                SALVAR ALTERAÇÕES
              </button>
            </div>
          )}

          {/* OUTRAS ABAS */}
          {activeTab !== "groups" && activeTab !== "knockout" && hasUnsavedChanges && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
              <button
                onClick={savePredictionsToDatabase}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bebas text-xl px-10 py-4 rounded-full transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-3 border-2 border-white/20 whitespace-nowrap"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                SALVAR ALTERAÇÕES
              </button>
            </div>
          )}
        </>
      )}

      {/* Modais */}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {viewPredUser && <ViewPredictionsModal userId={viewPredUser.id} userName={viewPredUser.name} onClose={() => setViewPredUser(null)} />}

      {/* Modal de confirmação — Editar Seleção */}
      {confirmEditTab && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0a1f0a] border border-yellow-600/40 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(234,179,8,0.15)] space-y-6">
            <div className="flex items-center gap-3 text-yellow-500">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 className="text-2xl font-bebas tracking-widest uppercase">Editar Seleção</h3>
            </div>
            <p className="text-sm font-oswald text-green-200/80 leading-relaxed">
              Tem certeza que deseja <span className="text-yellow-400 font-bold">desconfirmar</span> seus palpites de{" "}
              <span className="text-white font-bold">
                {confirmEditTab === "groups" ? "Fase de Grupos" : "Eliminatórias"}
              </span>
              ? Você poderá editar novamente, mas precisará confirmar uma nova vez.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmEditTab(null)}
                className="flex-1 py-3 rounded-xl border border-green-900/50 text-green-400 font-bebas text-lg tracking-widest hover:bg-green-900/20 transition-all"
              >
                CANCELAR
              </button>
              <button
                onClick={() => {
                  if (confirmEditTab === "groups") {
                    setConfirmedGroups(false);
                  } else {
                    setConfirmedKnockout(false);
                  }
                  savePredictionsToDatabase();
                  setConfirmEditTab(null);
                }}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 disabled:opacity-60 text-black font-bebas text-lg tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação de novo resultado */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-xl bg-green-900/90 border border-green-500 text-green-100 backdrop-blur-md shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
          <span className="font-bebas tracking-widest uppercase text-base">{notification}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-green-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
