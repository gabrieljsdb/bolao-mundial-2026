// ============================================================
// SIMULATOR CONTEXT — Copa do Mundo 2026
// Design: Tactical Board — dark green, Oswald/Bebas Neue
// Lógica: Previsões do usuário + Resultados oficiais do admin
// Inclui regra dos 8 melhores terceiros colocados
// ============================================================
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  GROUPS, TEAMS, SCORING, GROUP_MATCHES,
  type MatchResult, type SimulatorState, type GroupPrediction, type MatchPrediction
} from '@/lib/worldCupData';
import { assignThirdsToMatchups } from '@/lib/knockoutData';

export interface OfficialResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export interface OfficialResults {
  groupMatches: Record<string, OfficialResult>;
  secondRound: Record<string, string>;
  r16: Record<string, string>;
  qf: Record<string, string>;
  sf: Record<string, string>;
  finalist1: string | null;
  finalist2: string | null;
  champion: string | null;
  bestThirds?: string[];
  finalists?: string[];
}

interface SystemConfig {
  predictionDeadline: string | null;
  isLocked: boolean;
}

interface SimulatorContextType {
  state: SimulatorState;
  officialResults: OfficialResults;
  systemConfig: SystemConfig;
  isPredictionsLocked: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  setMatchPrediction: (groupId: string, matchId: string, result: MatchResult | null, homeScore: number | null, awayScore: number | null) => void;
  toggleQualified: (groupId: string, teamId: string) => void;
  setSecondRoundWinner: (matchId: string, winner: string | null) => void;
  setR16Winner: (matchId: string, winner: string | null) => void;
  setQFWinner: (matchId: string, winner: string | null) => void;
  setSFWinner: (matchId: string, winner: string | null) => void;
  setFinalist: (slot: 0 | 1, teamId: string | null) => void;
  setChampion: (teamId: string | null) => void;
  
  // Admin functions
  setOfficialGroupResult: (matchId: string, homeScore: number, awayScore: number) => void;
  setOfficialSecondRoundWinner: (matchId: string, winner: string) => void;
  setOfficialR16Winner: (matchId: string, winner: string) => void;
  setOfficialQFWinner: (matchId: string, winner: string) => void;
  setOfficialSFWinner: (matchId: string, winner: string) => void;
  setOfficialFinalists: (finalist1: string, finalist2: string) => void;
  setOfficialChampion: (champion: string) => void;
  
  // Scoring
  calculateUserScore: () => number;
  getScoreBreakdown: () => { category: string; points: number; max: number; hits: number; total: number }[];
  
  totalScore: number;
  getGroupQualifiers: () => string[];
  getBestThirds: () => string[];
  getBestThirdsWithGroups: () => { teamId: string; groupId: string }[];
  getThirdMatchupAssignment: () => Record<string, string>;
  resetAll: () => void;
  setConfirmedGroups: (confirmed: boolean) => void;
  setConfirmedKnockout: (confirmed: boolean) => void;
  savePredictionsToDatabase: () => Promise<void>;
  
  finalists: [string | null, string | null];
  champion: string | null;
}

const defaultState: SimulatorState = {
  groupPredictions: {},
  secondRoundPredictions: {},
  r16Predictions: {},
  qfPredictions: {},
  sfPredictions: {},
  finalPrediction: null,
  finalistPrediction: [null, null],
};

const defaultOfficialResults: OfficialResults = {
  groupMatches: {},
  secondRound: {},
  r16: {},
  qf: {},
  sf: {},
  finalist1: null,
  finalist2: null,
  champion: null,
};

const SimulatorContext = createContext<SimulatorContextType | null>(null);

function normalizeSimulatorState(data: any): SimulatorState {
  return {
    ...defaultState,
    groupPredictions: data?.groupPredictions || {},
    secondRoundPredictions: data?.secondRoundPredictions || {},
    r16Predictions: data?.r16Predictions || {},
    qfPredictions: data?.qfPredictions || {},
    sfPredictions: data?.sfPredictions || {},
    finalistPrediction: Array.isArray(data?.finalistPrediction) ? data.finalistPrediction : [null, null],
    finalPrediction: data?.finalPrediction || null,
    confirmedGroups: Boolean(data?.confirmedGroups),
    confirmedKnockout: Boolean(data?.confirmedKnockout),
  };
}


// Função para limpar dados redundantes antes de salvar
function cleanupStateForStorage(state: SimulatorState): any {
  return {
    groupPredictions: state.groupPredictions,
    secondRoundPredictions: state.secondRoundPredictions,
    r16Predictions: state.r16Predictions,
    qfPredictions: state.qfPredictions,
    sfPredictions: state.sfPredictions,
    finalistPrediction: state.finalistPrediction,
    finalPrediction: state.finalPrediction,
    confirmedGroups: state.confirmedGroups,
    confirmedKnockout: state.confirmedKnockout,
  };
}

export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthContext();
  const [loadedPredictionsForToken, setLoadedPredictionsForToken] = useState<string | null>(null);
  const [state, setState] = useState<SimulatorState>(() => {
    try {
      const saved = localStorage.getItem('worldcup2026_simulator');
      if (saved) return normalizeSimulatorState(JSON.parse(saved));
    } catch {}
    return defaultState;
  });
  const [lastSavedState, setLastSavedState] = useState<SimulatorState>(state);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [officialResults, setOfficialResults] = useState<OfficialResults>(defaultOfficialResults);
  const [systemConfig, setSystemConfig] = useState<any>({ 
    predictionDeadline: null, 
    isLocked: false,
    officialKnockoutResults: {
      secondRound: {},
      r16: {},
      qf: {},
      sf: {},
      finalists: [null, null],
      champion: null
    }
  });

  const isPredictionsLocked = React.useMemo(() => {
    if (systemConfig.isLocked) return true;
    if (systemConfig.predictionDeadline) return new Date() > new Date(systemConfig.predictionDeadline);
    return false;
  }, [systemConfig]);

  // Carregar do Banco de Dados sempre que o token de autenticação mudar.
  // O SimulatorProvider é montado antes/depois da tela de login e não desmonta ao trocar de rota;
  // por isso, depender apenas de useEffect([]) fazia o app não buscar as previsões após login.
  useEffect(() => {
    let cancelled = false;

    
    if (!token) {
      setLoadedPredictionsForToken(null);
      return;
    }

    setLoadedPredictionsForToken(null);

    fetch('/api/predictions', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar previsões');
        return res.json();
      })
      .then(data => {
        if (cancelled) return;

        if (data) {
          const normalized = normalizeSimulatorState(data);
          setState(normalized);
          try { localStorage.setItem('worldcup2026_simulator', JSON.stringify(cleanupStateForStorage(normalized))); } catch (e) { console.warn('Storage quota exceeded'); }
        } else {
          setState(defaultState);
          try { localStorage.setItem('worldcup2026_simulator', JSON.stringify(cleanupStateForStorage(defaultState))); } catch (e) { console.warn('Storage quota exceeded'); }
        }

        setLoadedPredictionsForToken(token);
      })
      .catch(err => {
        if (!cancelled) {
          console.error("Erro ao carregar previsões:", err);
          setLoadedPredictionsForToken(token);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Detectar alterações não salvas - qualquer mudança no state ativa o botão
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [state]);

  // Auto-save com debounce: salva no banco 5 segundos após a última mudança
  // Só dispara após as previsões terem sido carregadas do servidor (loadedPredictionsForToken)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!token || !hasUnsavedChanges || loadedPredictionsForToken !== token) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(state),
        });
        if (response.ok) {
          setLastSavedState(state);
          setHasUnsavedChanges(false);
        }
      } catch {
        // Silently ignore — usuário ainda pode salvar manualmente
      }
    }, 5000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [state, token, hasUnsavedChanges, loadedPredictionsForToken]);

  // Salvar apenas no localStorage (não no banco automaticamente)
  useEffect(() => {
    try { localStorage.setItem('worldcup2026_simulator', JSON.stringify(cleanupStateForStorage(state))); } catch (e) { console.warn('Storage quota exceeded, clearing old data'); localStorage.removeItem('worldcup2026_simulator'); }
  }, [state]);

  // Sincronizar lastSavedState quando as previsões são carregadas do servidor
  useEffect(() => {
    if (loadedPredictionsForToken === token && token) {
      setLastSavedState(state);
      setHasUnsavedChanges(false);
    }
  }, [loadedPredictionsForToken, token]);

  // Função para salvar manualmente no banco de dados
  const savePredictionsToDatabase = useCallback(async () => { 
    if (!token || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(state),
      });
      
      if (response.ok) {
        setLastSavedState(state);
        setHasUnsavedChanges(false);
        console.log('Previsões salvas com sucesso!');
      } else {
        console.error('Erro ao salvar previsões:', response.statusText);
      }
    } catch (err) {
      console.error('Erro ao salvar previsões:', err);
    } finally {
      setIsSaving(false);
    }
  }, [state, token, hasUnsavedChanges]);

  // Sincronizar resultados oficiais e config do servidor
  useEffect(() => {
    const fetchConfig = () => {
      fetch("/api/config")
        .then(res => res.json())
        .then(data => setSystemConfig(data))
        .catch(console.error);

      fetch("/api/admin/results")
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) return;
          const groupMatches: Record<string, OfficialResult> = {};
          data.forEach((r: any) => {
            groupMatches[r.matchId] = r;
          });
          setOfficialResults(prev => ({ ...prev, groupMatches }));
        })
        .catch(console.error);
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, 10000); // Atualizar a cada 10s
    return () => clearInterval(interval);
  }, []);

  const calculateGroupRanking = (groupId: string, matchPredictions: MatchPrediction[]) => {
    const group = GROUPS.find(g => g.id === groupId);
    if (!group) return [];

    const stats: Record<string, { pts: number; gd: number; gs: number }> = {};
    group.teams.forEach(id => stats[id] = { pts: 0, gd: 0, gs: 0 });

    matchPredictions.forEach(m => {
      if (m.homeScore === null || m.awayScore === null) return;
      const match = GROUP_MATCHES.find(gm => gm.id === m.matchId);
      if (!match || !stats[match.homeTeamId] || !stats[match.awayTeamId]) return;

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

    return group.teams
      .map(id => ({ teamId: id, ...stats[id] }))
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        // FIFA 2026: Saldo de gols geral, depois gols marcados, DEPOIS confronto direto
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gs !== a.gs) return b.gs - a.gs;
        // Confronto direto (critério 3: pontos no confronto, 4: saldo, 5: gols)
        const h2hMatch = matchPredictions.find(m =>
          (m.homeScore !== null && m.awayScore !== null) &&
          ((GROUP_MATCHES.find(gm => gm.id === m.matchId)?.homeTeamId === a.teamId && GROUP_MATCHES.find(gm => gm.id === m.matchId)?.awayTeamId === b.teamId) ||
           (GROUP_MATCHES.find(gm => gm.id === m.matchId)?.homeTeamId === b.teamId && GROUP_MATCHES.find(gm => gm.id === m.matchId)?.awayTeamId === a.teamId))
        );
        if (h2hMatch) {
          const gm = GROUP_MATCHES.find(gm => gm.id === h2hMatch.matchId)!;
          const aScore = gm.homeTeamId === a.teamId ? h2hMatch.homeScore! : h2hMatch.awayScore!;
          const bScore = gm.homeTeamId === b.teamId ? h2hMatch.homeScore! : h2hMatch.awayScore!;
          const aH2HPts = aScore > bScore ? 3 : aScore === bScore ? 1 : 0;
          const bH2HPts = bScore > aScore ? 3 : bScore === aScore ? 1 : 0;
          if (aH2HPts !== bH2HPts) return bH2HPts - aH2HPts;
          // Em empate: saldo e gols do confronto também são iguais → próximo critério
        }
        return 0;
      });
  };

  const setMatchPrediction = useCallback((groupId: string, matchId: string, result: MatchResult | null, homeScore: number | null, awayScore: number | null) => {
    setState(prev => {
      const groupPred = prev.groupPredictions[groupId] || { groupId, qualified: [], matchPredictions: [] };
      const existingIdx = groupPred.matchPredictions.findIndex(m => m.matchId === matchId);
      const newPred = { matchId, result, homeScore, awayScore };
      const newMatchPredictions = existingIdx >= 0
        ? groupPred.matchPredictions.map((m, i) => i === existingIdx ? newPred : m)
        : [...groupPred.matchPredictions, newPred];

      // Auto-calculate qualifiers
      const ranking = calculateGroupRanking(groupId, newMatchPredictions);
      const newQualified: [string, string] = [ranking[0].teamId, ranking[1].teamId];

      return {
        ...prev,
        groupPredictions: {
          ...prev.groupPredictions,
          [groupId]: { 
            ...groupPred, 
            matchPredictions: newMatchPredictions,
            qualified: newQualified
          }
        }
      };
    });
  }, []);

  const toggleQualified = useCallback((groupId: string, teamId: string) => {
    setState(prev => {
      const groupPred = prev.groupPredictions[groupId] || { groupId, qualified: [], matchPredictions: [] };
      let newQualified = [...groupPred.qualified];
      if (newQualified.includes(teamId)) {
        newQualified = newQualified.filter(id => id !== teamId);
      } else if (newQualified.length < 2) {
        newQualified.push(teamId);
      }
      return {
        ...prev,
        groupPredictions: {
          ...prev.groupPredictions,
          [groupId]: { ...groupPred, qualified: newQualified as [string, string] }
        }
      };
    });
  }, []);

  const getGroupQualifiers = useCallback(() => {
    const qualifiers: string[] = [];
    GROUPS.forEach(g => {
      const q = state.groupPredictions[g.id]?.qualified || [];
      qualifiers.push(...q);
    });
    return qualifiers;
  }, [state.groupPredictions]);

  // Retorna os 12 terceiros com groupId, ordenados e recortados nos 8 melhores
  const getBestThirdsWithGroups = useCallback((): { teamId: string; groupId: string }[] => {
    const thirds: { teamId: string; groupId: string; pts: number; gd: number; gs: number }[] = [];

    GROUPS.forEach(group => {
      const groupPred = state.groupPredictions[group.id];
      if (!groupPred) return;

      const stats: Record<string, { pts: number; gd: number; gs: number }> = {};
      group.teams.forEach(id => stats[id] = { pts: 0, gd: 0, gs: 0 });

      groupPred.matchPredictions.forEach(m => {
        if (m.homeScore === null || m.awayScore === null) return;
        const match = GROUP_MATCHES.find(gm => gm.id === m.matchId);
        if (!match) return;

        stats[match.homeTeamId].gs += m.homeScore;
        stats[match.awayTeamId].gs += m.awayScore;
        stats[match.homeTeamId].gd += (m.homeScore - m.awayScore);
        stats[match.awayTeamId].gd += (m.awayScore - m.homeScore);

        if (m.homeScore > m.awayScore) stats[match.homeTeamId].pts += 3;
        else if (m.awayScore > m.homeScore) stats[match.awayTeamId].pts += 3;
        else { stats[match.homeTeamId].pts += 1; stats[match.awayTeamId].pts += 1; }
      });

      const matchPreds = groupPred.matchPredictions;
      const sorted = group.teams
        .map(id => ({ teamId: id, ...stats[id] }))
        .sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          if (b.gd !== a.gd) return b.gd - a.gd;
          if (b.gs !== a.gs) return b.gs - a.gs;
          const h2hMatch = matchPreds.find(m =>
            (m.homeScore !== null && m.awayScore !== null) &&
            ((GROUP_MATCHES.find(gm => gm.id === m.matchId)?.homeTeamId === a.teamId && GROUP_MATCHES.find(gm => gm.id === m.matchId)?.awayTeamId === b.teamId) ||
             (GROUP_MATCHES.find(gm => gm.id === m.matchId)?.homeTeamId === b.teamId && GROUP_MATCHES.find(gm => gm.id === m.matchId)?.awayTeamId === a.teamId))
          );
          if (h2hMatch) {
            const gm = GROUP_MATCHES.find(gm => gm.id === h2hMatch.matchId)!;
            const aScore = gm.homeTeamId === a.teamId ? h2hMatch.homeScore! : h2hMatch.awayScore!;
            const bScore = gm.homeTeamId === b.teamId ? h2hMatch.homeScore! : h2hMatch.awayScore!;
            const aH2HPts = aScore > bScore ? 3 : aScore === bScore ? 1 : 0;
            const bH2HPts = bScore > aScore ? 3 : bScore === aScore ? 1 : 0;
            if (aH2HPts !== bH2HPts) return bH2HPts - aH2HPts;
          }
          return 0;
        });

      if (sorted.length >= 3) {
        thirds.push({ teamId: sorted[2].teamId, groupId: group.id, ...stats[sorted[2].teamId] });
      }
    });

    return thirds
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gs - a.gs)
      .slice(0, 8);
  }, [state.groupPredictions]);

  // Retorna apenas os IDs (compatível com scoring existente)
  const getBestThirds = useCallback((): string[] => {
    return getBestThirdsWithGroups().map(t => t.teamId);
  }, [getBestThirdsWithGroups]);

  // Atribui cada 3º ao confronto correto conforme tabela oficial FIFA 2026
  const getThirdMatchupAssignment = useCallback((): Record<string, string> => {
    // Terceiros oficiais (admin) têm prioridade sobre as previsões do usuário
    const officialThirds = officialResults.bestThirds;
    let thirdsWithGroups: { teamId: string; groupId: string }[];

    if (officialThirds && officialThirds.length === 8) {
      thirdsWithGroups = officialThirds.map(teamId => ({
        teamId,
        groupId: GROUPS.find(g => g.teams.includes(teamId))?.id ?? '',
      })).filter(t => t.groupId);
    } else {
      thirdsWithGroups = getBestThirdsWithGroups();
    }

    if (thirdsWithGroups.length < 8) return {};

    const qualifyingGroups = thirdsWithGroups.map(t => t.groupId);
    const slotToGroup = assignThirdsToMatchups(qualifyingGroups);
    if (!slotToGroup) return {};

    // Converte slot → groupId em slot → teamId
    const result: Record<string, string> = {};
    for (const [slot, groupId] of Object.entries(slotToGroup)) {
      const third = thirdsWithGroups.find(t => t.groupId === groupId);
      if (third) result[slot] = third.teamId;
    }
    return result;
  }, [officialResults.bestThirds, getBestThirdsWithGroups]);

  const setSecondRoundWinner = useCallback((matchId: string, winner: string | null) => {
    setState(prev => ({ ...prev, secondRoundPredictions: { ...prev.secondRoundPredictions, [matchId]: winner } }));
  }, []);

  const setR16Winner = useCallback((matchId: string, winner: string | null) => {
    setState(prev => ({ ...prev, r16Predictions: { ...prev.r16Predictions, [matchId]: winner } }));
  }, []);

  const setQFWinner = useCallback((matchId: string, winner: string | null) => {
    setState(prev => ({ ...prev, qfPredictions: { ...prev.qfPredictions, [matchId]: winner } }));
  }, []);

  const setSFWinner = useCallback((matchId: string, winner: string | null) => {
    setState(prev => {
      const slot = matchId === "sf_1" ? 0 : 1;
      const newFinalists: [string | null, string | null] = [prev.finalistPrediction[0], prev.finalistPrediction[1]];
      newFinalists[slot] = winner || null;
      const currentChampion = prev.finalPrediction;
      const championStillValid = currentChampion !== null && newFinalists.includes(currentChampion);
      return {
        ...prev,
        sfPredictions: { ...prev.sfPredictions, [matchId]: winner },
        finalistPrediction: newFinalists,
        finalPrediction: championStillValid ? currentChampion : null,
      };
    });
  }, []);

  const setFinalist = useCallback((slot: 0 | 1, teamId: string | null) => {
    setState(prev => {
      const finalists: [string | null, string | null] = [...prev.finalistPrediction];
      finalists[slot] = teamId;
      return { ...prev, finalistPrediction: finalists };
    });
  }, []);

  const setChampion = useCallback((teamId: string | null) => {
    setState(prev => ({ ...prev, finalPrediction: teamId }));
  }, []);

  const setConfirmedGroups = useCallback((confirmed: boolean) => {
    setState(prev => ({ ...prev, confirmedGroups: confirmed }));
  }, []);

  const setConfirmedKnockout = useCallback((confirmed: boolean) => {
    setState(prev => ({ ...prev, confirmedKnockout: confirmed }));
  }, []);

  const resetAll = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem('worldcup2026_simulator');
  }, []);

  // Lógica de Pontuação no Frontend
  const calculateUserScore = useCallback(() => {
    let total = 0;
    const official = systemConfig.officialKnockoutResults;

    // Pontos Fase de Grupos
    Object.values(officialResults.groupMatches).forEach((officialRes) => {
      if (officialRes.homeScore === null || officialRes.awayScore === null) return;
      
      let userMatchPred: any = null;
      Object.values(state.groupPredictions).forEach((group: any) => {
        const found = group.matchPredictions?.find((m: any) => m.matchId === officialRes.matchId);
        if (found) userMatchPred = found;
      });

      if (userMatchPred && userMatchPred.homeScore !== null && userMatchPred.awayScore !== null) {
        const officialResult = officialRes.homeScore > officialRes.awayScore ? "home" : officialRes.homeScore < officialRes.awayScore ? "away" : "draw";
        const userResult = userMatchPred.homeScore > userMatchPred.awayScore ? "home" : userMatchPred.homeScore < userMatchPred.awayScore ? "away" : "draw";

        if (officialResult === userResult) total += SCORING.GROUP_WINNER;
        if (officialRes.homeScore === userMatchPred.homeScore) total += SCORING.GROUP_HOME_SCORE;
        if (officialRes.awayScore === userMatchPred.awayScore) total += SCORING.GROUP_AWAY_SCORE;
      }
    });

    // Pontos Melhores Terceiros Colocados
    if (official?.bestThirds && Array.isArray(official.bestThirds)) {
      const userBestThirds = getBestThirds();
      userBestThirds.forEach(teamId => {
        if (official.bestThirds.includes(teamId)) total += SCORING.BEST_THIRD;
      });
    }

    // Pontos Fase Eliminatória
    if (state.secondRoundPredictions && official?.secondRound) {
      Object.entries(state.secondRoundPredictions).forEach(([matchId, winner]) => {
        if (winner && official.secondRound[matchId] === winner) total += SCORING.SECOND_ROUND;
      });
    }

    if (state.r16Predictions && official?.r16) {
      Object.entries(state.r16Predictions).forEach(([matchId, winner]) => {
        if (winner && official.r16[matchId] === winner) total += SCORING.R16_ADVANCE;
      });
    }

    if (state.qfPredictions && official?.qf) {
      Object.entries(state.qfPredictions).forEach(([matchId, winner]) => {
        if (winner && official.qf[matchId] === winner) total += SCORING.QF_ADVANCE;
      });
    }

    if (state.sfPredictions && official?.sf) {
      Object.entries(state.sfPredictions).forEach(([matchId, winner]) => {
        if (winner && official.sf[matchId] === winner) total += SCORING.SF_ADVANCE;
      });
    }

    if (state.finalistPrediction && official?.finalists) {
      state.finalistPrediction.forEach((f: any) => {
        if (f && official.finalists.includes(f)) total += SCORING.FINALIST;
      });
    }

    if (state.finalPrediction && official?.champion === state.finalPrediction) {
      total += SCORING.CHAMPION;
    }

    return total;
  }, [state, officialResults, systemConfig, getBestThirds]);

  const getScoreBreakdown = useCallback(() => {
    const official = systemConfig.officialKnockoutResults;

    let groupResultPts = 0, groupHomePts = 0, groupAwayPts = 0;
    let groupHits = 0, groupHomeHits = 0, groupAwayHits = 0, groupMatchesWithOfficial = 0;

    Object.values(officialResults.groupMatches).forEach((officialRes) => {
      if (officialRes.homeScore === null || officialRes.awayScore === null) return;
      groupMatchesWithOfficial++;
      let userMatchPred: any = null;
      Object.values(state.groupPredictions).forEach((group: any) => {
        const found = group.matchPredictions?.find((m: any) => m.matchId === officialRes.matchId);
        if (found) userMatchPred = found;
      });
      if (userMatchPred && userMatchPred.homeScore !== null && userMatchPred.awayScore !== null) {
        const oR = officialRes.homeScore > officialRes.awayScore ? "home" : officialRes.homeScore < officialRes.awayScore ? "away" : "draw";
        const uR = userMatchPred.homeScore > userMatchPred.awayScore ? "home" : userMatchPred.homeScore < userMatchPred.awayScore ? "away" : "draw";
        if (oR === uR) { groupResultPts += SCORING.GROUP_WINNER; groupHits++; }
        if (officialRes.homeScore === userMatchPred.homeScore) { groupHomePts += SCORING.GROUP_HOME_SCORE; groupHomeHits++; }
        if (officialRes.awayScore === userMatchPred.awayScore) { groupAwayPts += SCORING.GROUP_AWAY_SCORE; groupAwayHits++; }
      }
    });

    let bestThirdPts = 0, bestThirdHits = 0;
    if (official?.bestThirds && Array.isArray(official.bestThirds)) {
      getBestThirds().forEach((teamId: string) => {
        if (official.bestThirds.includes(teamId)) { bestThirdPts += SCORING.BEST_THIRD; bestThirdHits++; }
      });
    }

    let secondRoundPts = 0, secondRoundHits = 0;
    if (state.secondRoundPredictions && official?.secondRound) {
      Object.entries(state.secondRoundPredictions).forEach(([id, w]) => {
        if (w && official.secondRound[id] === w) { secondRoundPts += SCORING.SECOND_ROUND; secondRoundHits++; }
      });
    }

    let r16Pts = 0, r16Hits = 0;
    if (state.r16Predictions && official?.r16) {
      Object.entries(state.r16Predictions).forEach(([id, w]) => {
        if (w && official.r16[id] === w) { r16Pts += SCORING.R16_ADVANCE; r16Hits++; }
      });
    }

    let qfPts = 0, qfHits = 0;
    if (state.qfPredictions && official?.qf) {
      Object.entries(state.qfPredictions).forEach(([id, w]) => {
        if (w && official.qf[id] === w) { qfPts += SCORING.QF_ADVANCE; qfHits++; }
      });
    }

    let sfPts = 0, sfHits = 0;
    if (state.sfPredictions && official?.sf) {
      Object.entries(state.sfPredictions).forEach(([id, w]) => {
        if (w && official.sf[id] === w) { sfPts += SCORING.SF_ADVANCE; sfHits++; }
      });
    }

    let finalistPts = 0, finalistHits = 0;
    if (state.finalistPrediction && official?.finalists) {
      state.finalistPrediction.forEach((f: any) => {
        if (f && official.finalists.includes(f)) { finalistPts += SCORING.FINALIST; finalistHits++; }
      });
    }

    const championPts = (state.finalPrediction && official?.champion === state.finalPrediction) ? SCORING.CHAMPION : 0;

    return [
      { category: "Resultado de Jogo", points: groupResultPts, max: groupMatchesWithOfficial * SCORING.GROUP_WINNER, hits: groupHits, total: groupMatchesWithOfficial },
      { category: "Placar Casa", points: groupHomePts, max: groupMatchesWithOfficial * SCORING.GROUP_HOME_SCORE, hits: groupHomeHits, total: groupMatchesWithOfficial },
      { category: "Placar Fora", points: groupAwayPts, max: groupMatchesWithOfficial * SCORING.GROUP_AWAY_SCORE, hits: groupAwayHits, total: groupMatchesWithOfficial },
      { category: "Melhores Terceiros", points: bestThirdPts, max: 8 * SCORING.BEST_THIRD, hits: bestThirdHits, total: 8 },
      { category: "Segunda Rodada", points: secondRoundPts, max: 16 * SCORING.SECOND_ROUND, hits: secondRoundHits, total: 16 },
      { category: "Oitavas de Final", points: r16Pts, max: 8 * SCORING.R16_ADVANCE, hits: r16Hits, total: 8 },
      { category: "Quartas de Final", points: qfPts, max: 4 * SCORING.QF_ADVANCE, hits: qfHits, total: 4 },
      { category: "Semifinais", points: sfPts, max: 2 * SCORING.SF_ADVANCE, hits: sfHits, total: 2 },
      { category: "Finalistas", points: finalistPts, max: 2 * SCORING.FINALIST, hits: finalistHits, total: 2 },
      { category: "Campeão", points: championPts, max: SCORING.CHAMPION, hits: championPts > 0 ? 1 : 0, total: 1 },
    ];
  }, [state, officialResults, systemConfig, getBestThirds]);

  return (
    <SimulatorContext.Provider value={{
      state, officialResults, systemConfig, isPredictionsLocked,
      hasUnsavedChanges, isSaving,
      setMatchPrediction, toggleQualified, setSecondRoundWinner, setR16Winner, setQFWinner, setSFWinner, setFinalist, setChampion,
      setOfficialGroupResult: () => {}, setOfficialSecondRoundWinner: () => {}, setOfficialR16Winner: () => {},
      setOfficialQFWinner: () => {}, setOfficialSFWinner: () => {}, setOfficialFinalists: () => {}, setOfficialChampion: () => {},
      calculateUserScore, getScoreBreakdown, totalScore: calculateUserScore(),
      getGroupQualifiers, getBestThirds, getBestThirdsWithGroups, getThirdMatchupAssignment, resetAll,
      setConfirmedGroups, setConfirmedKnockout,
      savePredictionsToDatabase,
      finalists: state.finalistPrediction, champion: state.finalPrediction
    }}>
      {children}
    </SimulatorContext.Provider>
  );
}

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) throw new Error('useSimulator must be used within a SimulatorProvider');
  return context;
};
