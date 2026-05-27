import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { GROUPS, GROUP_MATCHES, TEAMS } from "@/lib/worldCupData";
import { useSimulator } from "@/contexts/SimulatorContext";

const matchToGroupId: Record<string, string> = {};
GROUPS.forEach(g => {
  GROUP_MATCHES.filter(m => g.teams.includes(m.homeTeamId)).forEach(m => {
    matchToGroupId[m.id] = g.id;
  });
});

const ALL_MATCHES = GROUP_MATCHES.map(m => ({
  ...m,
  groupId: matchToGroupId[m.id],
}));

function BigScoreBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); onClick(); }}
      disabled={disabled}
      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bebas transition-all select-none
        ${disabled
          ? "bg-green-900/10 text-green-900 border border-green-900/20"
          : "bg-green-900/50 text-green-300 border border-green-700/50 active:scale-90 active:bg-green-700/60"
        }`}
    >
      {children}
    </button>
  );
}

function ScoreDisplay({ value }: { value: number | null }) {
  return (
    <span className="w-16 text-center font-bebas text-5xl text-white leading-none select-none">
      {value === null ? "—" : value}
    </span>
  );
}

export function MobileQuickPick() {
  const { state, setMatchPrediction, isPredictionsLocked } = useSimulator();
  const [index, setIndex] = useState(0);
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  const filtered = filterGroup
    ? ALL_MATCHES.filter(m => m.groupId === filterGroup)
    : ALL_MATCHES;

  const match = filtered[index] ?? filtered[0];

  const touchStartX = useRef<number | null>(null);

  const getPred = useCallback((m: typeof match) => {
    const gp = state.groupPredictions[m.groupId];
    return gp?.matchPredictions.find(p => p.matchId === m.id) ?? null;
  }, [state]);

  const setScore = useCallback((field: "home" | "away", val: number | null) => {
    if (!match) return;
    const pred = getPred(match);
    const home = field === "home" ? val : (pred?.homeScore ?? null);
    const away = field === "away" ? val : (pred?.awayScore ?? null);
    setMatchPrediction(match.groupId, match.id, null, home, away);
  }, [match, getPred, setMatchPrediction]);

  const goTo = (i: number) => {
    setIndex(Math.max(0, Math.min(filtered.length - 1, i)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goTo(index + 1);
      else goTo(index - 1);
    }
    touchStartX.current = null;
  };

  const filledCount = ALL_MATCHES.filter(m => {
    const p = getPred(m);
    return p?.homeScore !== null && p?.homeScore !== undefined && p?.awayScore !== null && p?.awayScore !== undefined;
  }).length;

  if (!match) return null;

  const pred = getPred(match);
  const homeScore = pred?.homeScore ?? null;
  const awayScore = pred?.awayScore ?? null;
  const homeTeam = TEAMS[match.homeTeamId];
  const awayTeam = TEAMS[match.awayTeamId];
  const hasPred = homeScore !== null && awayScore !== null;

  return (
    <div className="flex flex-col gap-4">

      {/* Progresso global */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-green-900/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(filledCount / 72) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-green-600 shrink-0">{filledCount}/72 jogos</span>
      </div>

      {/* Filtro por grupo */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => { setFilterGroup(null); setIndex(0); }}
          className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bebas tracking-widest border transition-all
            ${!filterGroup ? "bg-green-600 text-white border-green-500" : "bg-green-900/20 text-green-700 border-green-900/30"}`}
        >
          TODOS
        </button>
        {GROUPS.map(g => {
          const gFilled = ALL_MATCHES.filter(m => m.groupId === g.id).filter(m => {
            const p = getPred(m);
            return p?.homeScore !== null && p?.homeScore !== undefined;
          }).length;
          const isDone = gFilled === 6;
          return (
            <button
              key={g.id}
              onClick={() => { setFilterGroup(g.id); setIndex(0); }}
              className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bebas tracking-widest border transition-all
                ${filterGroup === g.id ? "bg-green-600 text-white border-green-500" : "bg-green-900/20 text-green-700 border-green-900/30"}`}
            >
              {g.id}
              {isDone && <CheckCircle2 className="w-3 h-3 text-green-400" />}
            </button>
          );
        })}
      </div>

      {/* Card da partida */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative bg-black/40 border border-green-800/30 rounded-2xl overflow-hidden select-none"
      >
        {/* Cabeçalho do card */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-green-900/30 border-b border-green-900/20">
          <div className="flex items-center gap-2">
            <span className="font-bebas text-green-400 tracking-widest text-sm">GRUPO {match.groupId}</span>
            <span className="text-green-900 text-[10px] font-mono">RODADA {match.round}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasPred
              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
              : <Circle className="w-4 h-4 text-green-900" />
            }
            <span className="text-[10px] font-mono text-green-800">{index + 1}/{filtered.length}</span>
          </div>
        </div>

        <div className="px-4 pt-1 pb-0.5 text-center">
          <span className="text-[10px] font-mono text-green-800">{match.date} · {match.venue}</span>
        </div>

        {/* Times + Placar */}
        <div className="flex items-center justify-between gap-2 px-4 py-6">

          {/* Time da casa */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-4xl">{homeTeam?.flag}</span>
            <span className="font-bebas text-green-100 text-base tracking-wider text-center leading-tight">
              {homeTeam?.name}
            </span>
          </div>

          {/* Placar */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {/* Gols Casa */}
              <div className="flex flex-col items-center gap-2">
                <BigScoreBtn
                  onClick={() => setScore("home", Math.min(20, (homeScore ?? 0) + 1))}
                  disabled={isPredictionsLocked}
                >+</BigScoreBtn>
                <ScoreDisplay value={homeScore} />
                <BigScoreBtn
                  onClick={() => setScore("home", Math.max(0, (homeScore ?? 0) - 1))}
                  disabled={isPredictionsLocked || homeScore === null || homeScore === 0}
                >−</BigScoreBtn>
              </div>

              <span className="font-bebas text-green-800 text-3xl pb-1">×</span>

              {/* Gols Visitante */}
              <div className="flex flex-col items-center gap-2">
                <BigScoreBtn
                  onClick={() => setScore("away", Math.min(20, (awayScore ?? 0) + 1))}
                  disabled={isPredictionsLocked}
                >+</BigScoreBtn>
                <ScoreDisplay value={awayScore} />
                <BigScoreBtn
                  onClick={() => setScore("away", Math.max(0, (awayScore ?? 0) - 1))}
                  disabled={isPredictionsLocked || awayScore === null || awayScore === 0}
                >−</BigScoreBtn>
              </div>
            </div>

            {!isPredictionsLocked && homeScore === null && (
              <button
                onClick={() => { setScore("home", 0); setScore("away", 0); }}
                className="text-[10px] font-mono text-green-700 border border-green-900/40 rounded px-2 py-0.5 hover:text-green-500 hover:border-green-700 transition-all"
              >
                0 × 0
              </button>
            )}
          </div>

          {/* Time visitante */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-4xl">{awayTeam?.flag}</span>
            <span className="font-bebas text-green-100 text-base tracking-wider text-center leading-tight">
              {awayTeam?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="flex items-center gap-1 px-4 py-3 rounded-xl border border-green-900/30 text-green-700 font-bebas tracking-widest text-sm disabled:opacity-30 transition-all active:scale-95 flex-1 justify-center"
        >
          <ChevronLeft className="w-4 h-4" /> ANTERIOR
        </button>
        <button
          onClick={() => goTo(index + 1)}
          disabled={index === filtered.length - 1}
          className="flex items-center gap-1 px-4 py-3 rounded-xl bg-green-800/40 border border-green-700/40 text-green-300 font-bebas tracking-widest text-sm disabled:opacity-30 transition-all active:scale-95 flex-1 justify-center"
        >
          PRÓXIMO <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dica de swipe */}
      <p className="text-center text-[10px] font-mono text-green-900">
        deslize para navegar entre jogos
      </p>
    </div>
  );
}
