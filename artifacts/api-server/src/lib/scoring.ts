export function computeExactCount(prediction: any, groupResults: any[]): number {
  if (!prediction) return 0;
  let exact = 0;
  const resultsMap: Record<string, { home: number; away: number }> = {};
  for (const r of groupResults) {
    resultsMap[r.matchId] = { home: r.homeScore, away: r.awayScore };
  }
  const groupPredictions: Record<string, any> = prediction.groupPredictions || {};
  for (const group of Object.values(groupPredictions)) {
    const matchPredictions = (group as any).matchPredictions;
    if (!Array.isArray(matchPredictions)) continue;
    for (const pred of matchPredictions) {
      const official = resultsMap[pred.matchId];
      if (!official || pred.homeScore === null || pred.awayScore === null) continue;
      if (Number(pred.homeScore) === official.home && Number(pred.awayScore) === official.away) {
        exact++;
      }
    }
  }
  return exact;
}

export interface KnockoutResults {
  secondRound?: Record<string, string>;
  r16?: Record<string, string>;
  qf?: Record<string, string>;
  sf?: Record<string, string>;
  finalists?: [string | null, string | null];
  champion?: string | null;
}

export function computeScore(
  prediction: any,
  groupResults: any[],
  knockoutResults?: KnockoutResults | null,
): number {
  if (!prediction) return 0;
  let score = 0;

  // ── 1. FASE DE GRUPOS ────────────────────────────────────────────────
  const resultsMap: Record<string, { home: number; away: number }> = {};
  for (const r of groupResults) {
    resultsMap[r.matchId] = { home: r.homeScore, away: r.awayScore };
  }

  const groupPredictions: Record<string, any> = prediction.groupPredictions || {};
  for (const group of Object.values(groupPredictions)) {
    const matchPredictions = (group as any).matchPredictions;
    if (!Array.isArray(matchPredictions)) continue;

    for (const pred of matchPredictions) {
      const official = resultsMap[pred.matchId];
      if (!official || pred.homeScore === null || pred.awayScore === null) continue;

      const ph = Number(pred.homeScore), pa = Number(pred.awayScore);
      const oh = official.home, oa = official.away;

      if (ph === oh && pa === oa) {
        score += 10; // acerto exato
      } else {
        const predRes = ph > pa ? "1" : ph < pa ? "2" : "X";
        const offRes  = oh > oa ? "1" : oh < oa ? "2" : "X";
        if (predRes === offRes) score += 6; // acertou vencedor/empate
        if (ph === oh) score += 2;          // acertou gol do mandante
        if (pa === oa) score += 2;          // acertou gol do visitante
      }
    }
  }

  // ── 2. MATA-MATA ─────────────────────────────────────────────────────
  if (!knockoutResults) return score;

  // Fase de 32 (Segunda Rodada) — 1 pt por time que avança
  const officialSR = knockoutResults.secondRound || {};
  const userSR: Record<string, string | null> = prediction.secondRoundPredictions || {};
  for (const [matchId, officialWinner] of Object.entries(officialSR)) {
    if (officialWinner && userSR[matchId] && userSR[matchId] === officialWinner) {
      score += 1;
    }
  }

  // Oitavas (R16) — 2 pts por time que avança
  const officialR16 = knockoutResults.r16 || {};
  const userR16: Record<string, string | null> = prediction.r16Predictions || {};
  for (const [matchId, officialWinner] of Object.entries(officialR16)) {
    if (officialWinner && userR16[matchId] && userR16[matchId] === officialWinner) {
      score += 2;
    }
  }

  // Quartas — 4 pts por time que avança
  const officialQF = knockoutResults.qf || {};
  const userQF: Record<string, string | null> = prediction.qfPredictions || {};
  for (const [matchId, officialWinner] of Object.entries(officialQF)) {
    if (officialWinner && userQF[matchId] && userQF[matchId] === officialWinner) {
      score += 4;
    }
  }

  // Semis — 8 pts por time que avança
  const officialSF = knockoutResults.sf || {};
  const userSF: Record<string, string | null> = prediction.sfPredictions || {};
  for (const [matchId, officialWinner] of Object.entries(officialSF)) {
    if (officialWinner && userSF[matchId] && userSF[matchId] === officialWinner) {
      score += 8;
    }
  }

  // Finalistas — 10 pts por cada finalista correto (ordem não importa)
  const officialFinalists: (string | null)[] = knockoutResults.finalists || [null, null];
  const userFinalists: (string | null)[] = Array.isArray(prediction.finalistPrediction)
    ? prediction.finalistPrediction
    : [null, null];
  const officialFinalistSet = new Set(officialFinalists.filter(Boolean));
  for (const team of userFinalists) {
    if (team && officialFinalistSet.has(team)) {
      score += 10;
    }
  }

  // Campeão — 20 pts
  if (knockoutResults.champion && prediction.finalPrediction &&
      prediction.finalPrediction === knockoutResults.champion) {
    score += 20;
  }

  return score;
}
